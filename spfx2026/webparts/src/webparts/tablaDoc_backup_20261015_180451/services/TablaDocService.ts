import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

export interface IArchivo {
  nombre: string;
  url: string;
  subindice: number;
}

export interface IGrupo {
  carpeta: string;
  indice: number;
  archivos: IArchivo[];
}

export class TablaDocService {
  constructor(
    private spHttpClient: SPHttpClient,
    private siteUrl: string,
    private biblioteca: string = "Documentos"
  ) {}

  public async getGrupos(): Promise<IGrupo[]> {
    const listEndpoint = this.obtenerListEndpoint(this.biblioteca);
    const url =
      `${this.siteUrl}/_api/web/lists/${listEndpoint}/items` +
      `?$expand=File,Folder` +
      `&$select=Vigente,Indice,Subindice,FileSystemObjectType,FileDirRef,` +
      `File/ServerRelativeUrl,File/Name,` +
      `Folder/ServerRelativeUrl,Folder/Name`;

    console.log("[TablaDocService] URL:", url);

    const response: SPHttpClientResponse = await this.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: "application/json;odata=verbose"
        }
      }
    );

    console.log("[TablaDocService] Status:", response.status, response.statusText);

    const json = await response.json();
    console.log("[TablaDocService] Respuesta:", json);

    if (!response.ok) {
      const errorMessage = json?.error?.message?.value || `Error HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Soportar formato OData verbose (d.results) y moderno (value)
    const items = json?.d?.results || json?.value || [];

    const indicesCarpetas: { [carpeta: string]: number } = {};
    const agrupados: { [carpeta: string]: { indice: number; archivos: IArchivo[] } } = {};

    // Índices de carpetas
    for (const item of items) {
      if (item.FileSystemObjectType !== 1) continue;

      const carpeta = this.obtenerNombreCarpeta(item);
      indicesCarpetas[carpeta] = Number(item.Indice) || 9999;
    }

    // Archivos vigentes
    for (const item of items) {
      if (item.FileSystemObjectType !== 0) continue;
      if (item.Vigente !== true) continue;
      if (!item.File || !item.File.ServerRelativeUrl) continue;

      const carpetaArchivo = this.obtenerNombreCarpeta(item);

      if (!agrupados[carpetaArchivo]) {
        agrupados[carpetaArchivo] = {
          indice: indicesCarpetas[carpetaArchivo] || 9999,
          archivos: []
        };
      }

      agrupados[carpetaArchivo].archivos.push({
        nombre: item.File.Name,
        url: item.File.ServerRelativeUrl,
        subindice: Number(item.Subindice) || 9999
      });
    }

    const carpetasOrdenadas = Object.keys(agrupados).sort(
      (a, b) => agrupados[a].indice - agrupados[b].indice
    );

    return carpetasOrdenadas.map((carpeta) => {
      agrupados[carpeta].archivos.sort((a, b) => a.subindice - b.subindice);

      return {
        carpeta,
        indice: agrupados[carpeta].indice,
        archivos: agrupados[carpeta].archivos
      };
    });
  }

  private obtenerNombreCarpeta(item: any): string {
    const fileDirRef = item.FileDirRef;
    const folderUrl = item.Folder?.ServerRelativeUrl;
    const fileUrl = item.File?.ServerRelativeUrl;

    // Para carpetas, FileDirRef es la ruta padre de la carpeta.
    // El nombre de la carpeta es la última parte de folderUrl o se extrae de fileDirRef.
    if (item.FileSystemObjectType === 1 && folderUrl) {
      const partes = folderUrl.split("/").filter(p => p.length > 0);
      return partes[partes.length - 1] || "Documentos sin clasificar";
    }

    // Para archivos, la carpeta es la última parte de FileDirRef
    if (fileDirRef) {
      const partes = fileDirRef.split("/").filter(p => p.length > 0);
      return partes[partes.length - 1] || "Documentos sin clasificar";
    }

    // Fallback con la URL del archivo
    if (fileUrl) {
      const partes = fileUrl.split("/").filter(p => p.length > 0);
      if (partes.length >= 2) {
        return partes[partes.length - 2];
      }
    }

    return "Documentos sin clasificar";
  }

  private obtenerListEndpoint(biblioteca: string): string {
    const guidRegex = /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/;
    const valor = biblioteca.trim();

    if (guidRegex.test(valor)) {
      const guid = valor.replace(/[{}]/g, "");
      return `GetById('${guid}')`;
    }

    return `getbytitle('${encodeURIComponent(valor)}')`;
  }
}
