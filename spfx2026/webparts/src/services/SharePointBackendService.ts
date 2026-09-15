import { SPHttpClient } from '@microsoft/sp-http';

/**
 * Wrapper genérico para pegarle a la REST API de un sitio SharePoint que
 * actúa como "backend" (no necesariamente el sitio donde corre el webpart).
 *
 * Pensado para ser compartido entre TODOS los webparts que necesiten leer
 * datos de ese mismo backend (Navbar, MenuLateral, ListaNovedades, y los
 * que vengan), en vez de que cada uno repita su propia lógica de fetch.
 */
export class SharePointBackendService {

  public static async getListItems(
    spHttpClient: SPHttpClient,
    backendSiteUrl: string,
    listName: string,
    query: string = ''
  ): Promise<any[]> {

    // encodeURIComponent por si el nombre de la lista tiene espacios o
    // caracteres especiales (ej: "Informacion General" -> "Informacion%20General")
    const uri =
      `${backendSiteUrl}/_api/web/lists/GetByTitle('${encodeURIComponent(listName)}')/items${query}`;

    const response = await spHttpClient.get(
      uri,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error HTTP ${response.status}: ${response.statusText} (${uri})`
      );
    }

    const data = await response.json();
    return data.value;
  }

  public static async getListItemsById(
      spHttpClient: SPHttpClient,
      backendSiteUrl: string,
      listId: string,
      query: string = ''
    ): Promise<any[]> {

      const uri =
        `${backendSiteUrl}/_api/web/lists/GetById('${listId}')/items${query}`;

      console.log('URL BACKEND FAQ:', uri);

      const response = await spHttpClient.get(
        uri,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata'
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error HTTP ${response.status}: ${response.statusText} (${uri})`
        );
      }

      const data = await response.json();

      return data.value;
    }



}