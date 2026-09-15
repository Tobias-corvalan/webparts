// services/LateralNavService.ts

export interface ILateralChildItem {
  title: string;
  url: string;
}

export interface ILateralParentItem {
  title: string;
  url: string;
  children: ILateralChildItem[];
}

interface IRawNavNode {
  Title: string;
  SimpleUrl: string;
  IsHidden?: boolean;
  Nodes?: { results: IRawNavNode[] };
}

async function getMenuState(webUrl: string, providerName: string): Promise<IRawNavNode[]> {
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
  // A diferencia del navbar superior, este árbol el código original lo recorría
  // con .append() (no .prepend()), así que acá NO hay que invertir el orden.
  return nodes.filter((n) => !n.IsHidden);
}

export class LateralNavService {
  /**
   * @param webUrl url absoluta del web ACTUAL (no de la site collection):
   *                context.pageContext.web.absoluteUrl
   */
  public async getLateralMenu(webUrl: string): Promise<ILateralParentItem[]> {
    const topNodes = await getMenuState(webUrl, 'CurrentNavigationSwitchableProvider');

    return topNodes.map((node) => {
      // OJO: acá los hijos vienen del mismo payload (no de un segundo fetch),
      // por eso hay que filtrar IsHidden acá también — el filtro de arriba
      // solo aplicó al array de nivel superior.
      const children: ILateralChildItem[] = (node.Nodes?.results || [])
        .filter((c) => !c.IsHidden)
        .map((c) => ({ title: c.Title, url: c.SimpleUrl }));

      return {
        title: node.Title,
        url: node.SimpleUrl,
        children,
      };
    });
  }
}