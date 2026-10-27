import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

export interface ILinkItem {
  titulo: string;
  link: string;
  orden: number;
  visible: boolean;
  tematica: string;
}

export interface IAgendaItem {
  horario: string;
  charla: string;
  areaResponsable: string;
  archivos: IArchivoAgenda[];
  orden: number;
  visible: boolean;
}

export interface IArchivoAgenda {
  url: string;
  descripcion: string;
}

export interface ISeccionLinks {
  titulo: string;
  orden: number;
  items: ILinkItem[];
}

export interface IInfoLista {
  tipo: "links" | "agenda";
  tieneTematica: boolean;
  items: ILinkItem[];
  agendaItems: IAgendaItem[];
}

export class TablaLinksService {
  constructor(
    private spHttpClient: SPHttpClient,
    private siteUrl: string
  ) {}

  public async getItemsDeLista(listaId: string): Promise<IInfoLista> {
    if (!listaId) {
      return { tipo: "links", tieneTematica: false, items: [], agendaItems: [] };
    }

    const listEndpoint = this.obtenerListEndpoint(listaId);
    const campos = await this.obtenerCampos(listEndpoint);

    const tieneHorario = campos.indexOf("HORARIO") !== -1;
    const areaFieldName = this.obtenerNombreCampoAreaResponsable(campos);
    const tieneAreaResponsable = !!areaFieldName;
    const esAgenda = tieneHorario && tieneAreaResponsable;
    const tieneTematica = !esAgenda && campos.indexOf("Tematica") !== -1;

    if (esAgenda) {
      return this.getAgendaItems(listEndpoint, campos, areaFieldName);
    }

    return this.getLinkItems(listEndpoint, tieneTematica);
  }

  private async getLinkItems(listEndpoint: string, tieneTematica: boolean): Promise<IInfoLista> {
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

    return { tipo: "links", tieneTematica, items: itemsFiltrados, agendaItems: [] };
  }

  private async getAgendaItems(listEndpoint: string, campos: string[], areaFieldName: string): Promise<IInfoLista> {
    const tieneArchivos2 = campos.indexOf("ARCHIVOS2") !== -1;
    const tieneArchivos3 = campos.indexOf("ARCHIVOS3") !== -1;

    let selectFields = `Title,HORARIO,${areaFieldName},ARCHIVOS,Orden,Visible`;
    if (tieneArchivos2) {
      selectFields += ",ARCHIVOS2";
    }
    if (tieneArchivos3) {
      selectFields += ",ARCHIVOS3";
    }

    const url = `${this.siteUrl}/_api/web/lists/${listEndpoint}/items?$select=${selectFields}&$orderby=Orden asc`;
    const json = await this.obtenerJson(url);
    const items = json.d?.results || json.value || [];

    const agendaItems = items
      .map((item: any) => {
        const archivos: IArchivoAgenda[] = [];
        const archivos1 = this.extraerLinkConDescripcion(item.ARCHIVOS);
        if (archivos1) {
          archivos.push(archivos1);
        }
        if (tieneArchivos2) {
          const archivos2 = this.extraerLinkConDescripcion(item.ARCHIVOS2);
          if (archivos2) {
            archivos.push(archivos2);
          }
        }
        if (tieneArchivos3) {
          const archivos3 = this.extraerLinkConDescripcion(item.ARCHIVOS3);
          if (archivos3) {
            archivos.push(archivos3);
          }
        }

        const areaValue = item[areaFieldName] !== undefined ? item[areaFieldName] : null;
        return {
          horario: item.HORARIO || "",
          charla: item.Title || "",
          areaResponsable: areaValue || "",
          archivos,
          orden: Number(item.Orden) || 9999,
          visible: item.Visible === true || item.Visible === "1" || item.Visible === 1
        };
      })
      .filter((item: IAgendaItem) => item.visible && item.charla)
      .sort((a: IAgendaItem, b: IAgendaItem) => a.orden - b.orden);

    return { tipo: "agenda", tieneTematica: false, items: [], agendaItems };
  }

  private async obtenerCampos(listEndpoint: string): Promise<string[]> {
    try {
      const url = `${this.siteUrl}/_api/web/lists/${listEndpoint}/fields?$select=EntityPropertyName,Title`;
      const json = await this.obtenerJson(url);
      const campos = json.d?.results || json.value || [];
      return campos.map((c: any) => c.EntityPropertyName);
    } catch (err) {
      console.warn("[TablaLinksService] No se pudieron obtener campos:", err);
      return [];
    }
  }

  private obtenerNombreCampoAreaResponsable(campos: string[]): string | null {
    const candidatos = [
      "_x00c1_REARESPONSABLE",
      "_x00c1reaResponsable",
      "AreaResponsable",
      "ÁreaResponsable",
      "Area_x0020_Responsable",
      "_x00c1_REA_x0020_RESPONSABLE"
    ];

    for (const candidato of candidatos) {
      if (campos.indexOf(candidato) !== -1) {
        return candidato;
      }
    }

    const encontrado = campos.find((c) =>
      /reare?responsable/i.test(c) || /reare/i.test(c)
    );

    return encontrado || null;
  }

  private extraerLinkConDescripcion(link: any): IArchivoAgenda | null {
    if (!link) {
      return null;
    }

    if (typeof link === "string") {
      return { url: link, descripcion: "Ver más" };
    }

    if (link.Url) {
      return {
        url: link.Url,
        descripcion: link.Description || "Ver más"
      };
    }

    if (link.__metadata && link.__metadata.type === "SP.FieldUrlValue" && link.Url) {
      return {
        url: link.Url,
        descripcion: link.Description || "Ver más"
      };
    }

    return null;
  }

  private extraerLink(link: any): string {
    const resultado = this.extraerLinkConDescripcion(link);
    return resultado ? resultado.url : "";
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
