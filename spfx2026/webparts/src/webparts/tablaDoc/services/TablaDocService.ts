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

export type ModoVisualizacion = "automatico" | "metadatos" | "carpetas" | "archivos";

export class TablaDocService {
  constructor(
    private spHttpClient: SPHttpClient,
    private siteUrl: string,
    private biblioteca: string = "Documentos",
    private modo: ModoVisualizacion = "automatico"
  ) {}

  public async getGrupos(): Promise<IGrupo[]> {
    const listEndpoint = this.obtenerListEndpoint(this.biblioteca);
    const urlBase = `${this.siteUrl}/_api/web/lists/${listEndpoint}`;

    const modoEfectivo = await this.resolverModo(urlBase);
    console.log("[TablaDocService] Modo efectivo:", modoEfectivo);

    switch (modoEfectivo) {
      case "metadatos":
        return this.getGruposConMetadatos(urlBase);
      case "carpetas":
        return this.getGruposPorCarpetas(urlBase);
      case "archivos":
      default:
        return this.getGruposArchivosSueltos(urlBase);
    }
  }

  // ============================================================
  // Modo automatico: detecta si existen los campos de metadatos
  // ============================================================
  private async resolverModo(urlBase: string): Promise<ModoVisualizacion> {
    if (this.modo !== "automatico") {
      return this.modo;
    }

    try {
      const url = `${urlBase}/fields?$filter=EntityPropertyName eq 'Indice' or EntityPropertyName eq 'Subindice' or EntityPropertyName eq 'Vigente'&$select=EntityPropertyName`;
      const json = await this.obtenerJson(url);
      const campos = (json.value || json.d?.results || []) as { EntityPropertyName: string }[];
      const nombres = campos.map((c) => c.EntityPropertyName);

      const tieneMetadatos =
        nombres.indexOf("Indice") !== -1 &&
        nombres.indexOf("Subindice") !== -1 &&
        nombres.indexOf("Vigente") !== -1;

      if (tieneMetadatos) {
        return "metadatos";
      }
    } catch (err) {
      console.warn("[TablaDocService] No se pudo detectar metadatos:", err);
    }

    try {
      const urlRaiz = await this.obtenerUrlRaiz(urlBase);
      const carpetas = await this.obtenerSubcarpetas(urlRaiz);

      if (carpetas.length > 0) {
        return "carpetas";
      }
    } catch (err) {
      console.warn("[TablaDocService] No se pudo detectar carpetas:", err);
    }

    return "archivos";
  }

  // ============================================================
  // Modo con metadatos: usa /items con expand
  // ============================================================
  private async getGruposConMetadatos(urlBase: string): Promise<IGrupo[]> {
    const url =
      `${urlBase}/items` +
      `?$expand=File,Folder` +
      `&$select=Vigente,Indice,Subindice,FileSystemObjectType,FileDirRef,` +
      `File/ServerRelativeUrl,File/Name,` +
      `Folder/ServerRelativeUrl,Folder/Name`;

    const items = await this.obtenerItems(url);
    const urlRaiz = await this.obtenerUrlRaiz(urlBase);

    const indicesCarpetas: { [carpeta: string]: number } = {};
    const agrupados: { [carpeta: string]: { indice: number; archivos: IArchivo[] } } = {};

    for (const item of items) {
      if (item.FileSystemObjectType !== 1) continue;

      const carpeta = this.obtenerNombreCarpetaDesdeUrl(
        item.Folder?.ServerRelativeUrl || item.FileDirRef || "",
        urlRaiz
      );

      if (carpeta) {
        indicesCarpetas[carpeta] = Number(item.Indice) || 9999;
      }
    }

    for (const item of items) {
      if (item.FileSystemObjectType !== 0) continue;
      if (item.Vigente !== true) continue;
      if (!item.File || !item.File.ServerRelativeUrl) continue;

      const carpetaArchivo = this.obtenerNombreCarpetaDesdeUrl(
        item.FileDirRef || item.File.ServerRelativeUrl,
        urlRaiz
      );

      if (!carpetaArchivo) continue;

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

    return this.ordenarYDevolver(agrupados);
  }

  // ============================================================
  // Modo solo carpetas: recorre carpetas recursivamente y agrupa
  // ============================================================
  private async getGruposPorCarpetas(urlBase: string): Promise<IGrupo[]> {
    const urlRaiz = await this.obtenerUrlRaiz(urlBase);
    const grupos: IGrupo[] = [];

    // Grupo para archivos sueltos en la raiz
    const archivosRaiz = await this.obtenerArchivosDeCarpeta(urlRaiz);
    if (archivosRaiz.length > 0) {
      grupos.push({
        carpeta: "Documentos",
        indice: 1,
        archivos: archivosRaiz.map((a, i) => ({
          nombre: a.Name,
          url: a.ServerRelativeUrl,
          subindice: i + 1
        }))
      });
    }

    // Recorrer carpetas recursivamente
    await this.recorrerCarpetas(urlRaiz, grupos, grupos.length + 1);

    return grupos.sort((a, b) => a.indice - b.indice);
  }

  private async recorrerCarpetas(
    urlCarpeta: string,
    grupos: IGrupo[],
    indiceInicial: number
  ): Promise<number> {
    let indice = indiceInicial;
    const carpetas = await this.obtenerSubcarpetas(urlCarpeta);

    for (const carpeta of carpetas) {
      const urlSubcarpeta = carpeta.ServerRelativeUrl;
      const archivos = await this.obtenerArchivosDeCarpeta(urlSubcarpeta);

      if (archivos.length > 0) {
        grupos.push({
          carpeta: carpeta.Name,
          indice: indice++,
          archivos: archivos.map((a, i) => ({
            nombre: a.Name,
            url: a.ServerRelativeUrl,
            subindice: i + 1
          }))
        });
      }

      indice = await this.recorrerCarpetas(urlSubcarpeta, grupos, indice);
    }

    return indice;
  }

  private async obtenerSubcarpetas(urlCarpeta: string): Promise<any[]> {
    try {
      const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(urlCarpeta)}')/folders?$select=Name,ServerRelativeUrl`;
      const json = await this.obtenerJson(url);
      const carpetas = json.d?.results || json.value || [];
      // Excluir carpetas de formularios de SharePoint y carpetas ocultas
      return carpetas.filter((c: any) => {
        const nombre = c.Name || "";
        return nombre !== "Forms" && nombre.indexOf("_") !== 0;
      });
    } catch (err) {
      console.warn("[TablaDocService] No se pudieron obtener subcarpetas:", err);
      return [];
    }
  }

  private async obtenerArchivosDeCarpeta(urlCarpeta: string): Promise<any[]> {
    try {
      const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(urlCarpeta)}')/files?$select=Name,ServerRelativeUrl`;
      const json = await this.obtenerJson(url);
      return json.d?.results || json.value || [];
    } catch (err) {
      console.warn("[TablaDocService] No se pudieron obtener archivos:", err);
      return [];
    }
  }

  // ============================================================
  // Modo solo archivos: muestra todos los archivos en una sola seccion
  // ============================================================
  private async getGruposArchivosSueltos(urlBase: string): Promise<IGrupo[]> {
    const elementos = await this.obtenerElementos(urlBase);
    const archivos = this.filtrarArchivos(elementos);

    const listaArchivos: IArchivo[] = [];

    for (const archivo of archivos) {
      listaArchivos.push({
        nombre: archivo.Name,
        url: archivo.ServerRelativeUrl,
        subindice: listaArchivos.length + 1
      });
    }

    return [
      {
        carpeta: "Documentos",
        indice: 1,
        archivos: listaArchivos
      }
    ];
  }

  // ============================================================
  // Helpers
  // ============================================================
  private async obtenerElementos(urlBase: string): Promise<any[]> {
    const url = `${urlBase}/files`;
    const json = await this.obtenerJson(url);
    return json.value || json.d?.results || [];
  }

  private filtrarArchivos(elementos: any[]): any[] {
    return elementos.filter((e: any) => {
      const tipo = e["@odata.type"] || e["odata.type"] || e.__metadata?.type || "";
      return tipo.indexOf("File") !== -1;
    });
  }

  private async obtenerUrlRaiz(urlBase: string): Promise<string> {
    try {
      const url = `${urlBase}/RootFolder?$select=ServerRelativeUrl`;
      const json = await this.obtenerJson(url);
      const resultado = json.d || json;
      return resultado?.ServerRelativeUrl || "";
    } catch (err) {
      console.warn("[TablaDocService] No se pudo obtener URL raiz:", err);
      return "";
    }
  }

  private async obtenerItems(url: string): Promise<any[]> {
    const json = await this.obtenerJson(url);
    return json.d?.results || json.value || [];
  }

  private async obtenerJson(url: string): Promise<any> {
    console.log("[TablaDocService] URL:", url);

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

    console.log("[TablaDocService] Status:", response.status, response.statusText);

    if (!response.ok) {
      const texto = await response.text();
      console.error("[TablaDocService] Error respuesta:", texto.substring(0, 500));
      throw new Error(`Error HTTP ${response.status}`);
    }

    const json = await response.json();
    console.log("[TablaDocService] Respuesta:", json);
    return json;
  }

  private ordenarYDevolver(
    agrupados: { [carpeta: string]: { indice: number; archivos: IArchivo[] } },
    ordenarArchivos: boolean = true
  ): IGrupo[] {
    const carpetasOrdenadas = Object.keys(agrupados).sort(
      (a, b) => agrupados[a].indice - agrupados[b].indice
    );

    return carpetasOrdenadas.map((carpeta) => {
      if (ordenarArchivos) {
        agrupados[carpeta].archivos.sort((a, b) => a.subindice - b.subindice);
      }

      return {
        carpeta,
        indice: agrupados[carpeta].indice,
        archivos: agrupados[carpeta].archivos
      };
    });
  }

  private obtenerNombreCarpetaDesdeUrl(url: string, urlRaiz: string): string | null {
    if (!url) return null;

    const normalizar = (u: string) => u.replace(/\/$/, "");
    const urlNormalizada = normalizar(url);
    const raizNormalizada = normalizar(urlRaiz);

    if (urlNormalizada === raizNormalizada || urlNormalizada === "") {
      return null;
    }

    if (raizNormalizada && urlNormalizada.toLowerCase().indexOf(raizNormalizada.toLowerCase()) === 0) {
      const resto = urlNormalizada.substring(raizNormalizada.length + 1);
      const partes = resto.split("/").filter((p) => p.length > 0);
      return partes[0] || null;
    }

    const partes = urlNormalizada.split("/").filter((p) => p.length > 0);
    if (partes.length >= 2) {
      return partes[partes.length - 2];
    }

    return null;
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
