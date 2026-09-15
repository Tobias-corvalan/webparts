// services/BannerService.ts

export interface IBannerInfo {
  imageUrl: string;
  link?: string;
}

export class BannerService {
  /**
   * Busca en /PublishingImages del sitio actual un archivo que empiece con
   * "BannerMenuLateral". Si el item tiene la columna LinkRedireccionamiento
   * cargada, el banner se muestra como link a esa url; si no, es solo imagen.
   * Devuelve null si no hay ningún banner cargado (no es un error).
   */
  public async getBanner(webUrl: string): Promise<IBannerInfo | null> {
    try {
      const base = webUrl.replace(/\/$/, '');
      const serverRelativeFolder = `${new URL(webUrl).pathname}/PublishingImages`;

      const api = `${base}/_api/web/GetFolderByServerRelativeUrl('${serverRelativeFolder}')/files`;
      const query =
        `?$select=ServerRelativeUrl,ListItemAllFields/Id,ListItemAllFields/LinkRedireccionamiento` +
        `&$expand=ListItemAllFields&$filter=startswith(Name,'BannerMenuLateral')`;

      const response = await fetch(`${api}${query}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json;odata=verbose' },
      });

      if (!response.ok) {
        throw new Error(`No se pudo traer el banner: HTTP ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = data?.d?.results || [];

      if (results.length === 0) {
        return null;
      }

      const first = results[0];
      return {
        imageUrl: first.ServerRelativeUrl,
        link: first.ListItemAllFields?.LinkRedireccionamiento || undefined,
      };
    } catch (err) {
      console.error('No se pudo traer el banner del menú lateral:', err);
      return null;
    }
  }
}