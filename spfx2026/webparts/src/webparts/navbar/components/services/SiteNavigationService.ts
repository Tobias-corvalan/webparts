// services/SiteNavigationService.ts

export interface ISubNavItem {
  title: string;
  url: string;
}

export interface IMainNavItem {
  title: string;
  url: string;
  children: ISubNavItem[];
}

interface IRawNavNode {
  Title: string;
  SimpleUrl: string;
  IsHidden?: boolean;
  Nodes?: { results: IRawNavNode[] };
}

/**
 * Pide el árbol de navegación clásico de SharePoint (_api/navigation/menustate).
 * @param webUrl        url absoluta del web contra el que se consulta
 * @param providerName  'GlobalNavigationSwitchableProvider' (nav superior/global)
 *                      o 'CurrentNavigationSwitchableProvider' (quick launch del subsitio)
 */
async function getMenuState(
  webUrl: string,
  providerName: string
): Promise<IRawNavNode[]> {
  const endpoint = `${webUrl.replace(/\/$/, '')}/_api/navigation/menustate?mapprovidername='${providerName}'`;

  const response = await fetch(endpoint, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json;odata=verbose',
    },
  });

  if (!response.ok) {
    throw new Error(`menustate (${providerName}) falló en ${webUrl}: HTTP ${response.status}`);
  }

  const data = await response.json();
  const nodes: IRawNavNode[] = data?.d?.MenuState?.Nodes?.results || [];
  // Esta API clásica devuelve los nodos en orden INVERSO al que se muestran
  // (por eso el código legacy hacía .prepend() en vez de .append() al armarlos).
  return nodes.filter((n) => !n.IsHidden).reverse();
}

export class SiteNavigationService {
  /**
   * @param siteCollectionUrl url absoluta de la RAÍZ de la colección de sitios
   *                          (context.pageContext.site.absoluteUrl), porque la
   *                          navegación global se define ahí.
   */
  constructor(private siteCollectionUrl: string) {}

  public async getNavigation(): Promise<IMainNavItem[]> {
    const origin = new URL(this.siteCollectionUrl).origin;

    // 1) Navegación global (nivel superior: Información, Gestión, Talento, Buenas Prácticas)
    // Sacamos "Inicio" porque ya lo agregamos a mano en el componente (siempre primero,
    // apuntando a siteUrl) — si no, aparece duplicado.
    const globalNodes = (
      await getMenuState(this.siteCollectionUrl, 'GlobalNavigationSwitchableProvider')
    ).filter((n) => n.Title.trim().toLowerCase() !== 'inicio');

    // 2) Para cada ítem del nivel superior, traemos el Quick Launch de SU PROPIO subsitio
    const mainItems: IMainNavItem[] = await Promise.all(
      globalNodes.map(async (node) => {
        let children: ISubNavItem[] = [];

        // SimpleUrl suele venir server-relative (ej: "/sites/QARRHH/GP")
        const subWebUrl = node.SimpleUrl ? `${origin}${node.SimpleUrl}` : '';

        if (subWebUrl) {
          try {
            const subNodes = await getMenuState(
              subWebUrl,
              'CurrentNavigationSwitchableProvider'
            );
            // El primer nodo es la raíz de la navegación de ese subsitio;
            // sus hijos son los links reales del submenú (también vienen al revés).
            const childNodes = (subNodes[0]?.Nodes?.results || []).reverse();
            children = childNodes
              .filter((c) => !c.IsHidden)
              .map((c) => ({ title: c.Title, url: c.SimpleUrl }));
          } catch (err) {
            // Si un subsitio no tiene quick launch o falla, seguimos sin romper todo el menú.
            console.error(`No se pudo traer el submenú de "${node.Title}":`, err);
          }
        }

        return {
          title: node.Title,
          url: node.SimpleUrl,
          children,
        };
      })
    );

    return mainItems;
  }
}