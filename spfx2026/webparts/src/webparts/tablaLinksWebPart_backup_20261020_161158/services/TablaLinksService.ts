import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

export interface ILinkItem {
  titulo: string;
  link: string;
  orden: number;
  visible: boolean;
  tematica: string;
}

export interface ISeccionLinks {
  titulo: string;
  orden: number;
  items: ILinkItem[];
}

export interface IInfoLista {
  tieneTematica: boolean;
  items: ILinkItem[];
}

export class TablaLinksService {
  constructor(
    private spHttpClient: SPHttpClient,
    private siteUrl: string
  ) {}

  public async getItemsDeLista(listaId: string): Promise<IInfoLista> {
    if (!listaId) {
      return { tieneTematica: false, items: [] };
    }

    const listEndpoint = this.obtenerListEndpoint(listaId);
    const tieneTematica = await this.tieneCampoTematica(listEndpoint);

    const selectFields = tieneTematica
      ? "Title,Link,Orden,Visible,Tematica"
      : "Title,Link,Orden,Visible";

    const url = `${this.siteUrl}/_api/web/lists/${listEndpoint}/items?$select=${selectFields}&$orderby=Orden asc`;
    const json = await this.obtenerJson(url);
    const items = json.d?.results || json.value || [];

    const itemsFiltrados = items
      .map((item: any) => ({
        titulo: item.Title || "",
        link: this.extraerLink(item.Link),
        orden: Number(item.Orden) || 9999,
        visible: item.Visible === true || item.Visible === "1" || item.Visible === 1,
        tematica: tieneTematica ? (item.Tematica || "Sin temática") : ""
      }))
      .filter((item: ILinkItem) => item.visible && item.titulo && item.link)
      .sort((a: ILinkItem, b: ILinkItem) => a.orden - b.orden);

    return { tieneTematica, items: itemsFiltrados };
  }

  private async tieneCampoTematica(listEndpoint: string): Promise<boolean> {
    try {
      const url = `${this.siteUrl}/_api/web/lists/${listEndpoint}/fields?$filter=EntityPropertyName eq 'Tematica'&$select=EntityPropertyName`;
      const json = await this.obtenerJson(url);
      const campos = json.d?.results || json.value || [];
      return campos.length > 0;
    } catch (err) {
      console.warn("[TablaLinksService] No se pudo detectar campo Tematica:", err);
      return false;
    }
  }

  private extraerLink(link: any): string {
    if (!link) {
      return "";
    }

    if (typeof link === "string") {
      return link;
    }

    if (link.Url) {
      return link.Url;
    }

    if (link.__metadata && link.__metadata.type === "SP.FieldUrlValue") {
      return link.Url || "";
    }

    return "";
  }

  private async obtenerJson(url: string): Promise<any> {
    console.log("[TablaLinksService] URL:", url);

    const response: SPHttpClientResponse = await this.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose"
        }
      }
    );

    console.log("[TablaLinksService] Status:", response.status, response.statusText);

    if (!response.ok) {
      const texto = await response.text();
      console.error("[TablaLinksService] Error respuesta:", texto.substring(0, 500));
      throw new Error(`Error HTTP ${response.status}`);
    }

    const json = await response.json();
    console.log("[TablaLinksService] Respuesta:", json);
    return json;
  }

  private obtenerListEndpoint(listaId: string): string {
    const guidRegex = /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/;
    const valor = listaId.trim();

    if (guidRegex.test(valor)) {
      const guid = valor.replace(/[{}]/g, "");
      return `GetById('${guid}')`;
    }

    return `getbytitle('${encodeURIComponent(valor)}')`;
  }
}
