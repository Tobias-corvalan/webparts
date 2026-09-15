// services/UsageService.ts
import { SPFI, spfi } from "@pnp/sp";
import { SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/profiles";

export interface IUserData {
  legajo: string;
  email: string;
  direccion: string;
  sector: string;
  nombre: string;
}

const DEFAULT_USER: IUserData = {
  legajo: "No Registrado",
  email: "",
  direccion: "No Registrado",
  sector: "No Registrado",
  nombre: "No Registrado",
};

// ⚠️ Ajustá el nombre si tu lista de registro se llama distinto.
const USAGE_LIST_TITLE = "Registro De Uso";

export class UsageService {
  private sp: SPFI;

  /**
   * @param context contexto SPFx (necesario para crear el SPFI contra el backend)
   * @param backendSiteUrl sitio clásico donde vive la lista "Registro De Uso".
   *                       Si está vacío, se usa el sitio actual.
   */
  constructor(context: any, backendSiteUrl?: string) {
    const url = backendSiteUrl?.trim();
    this.sp = url && url.length > 0
      ? spfi(url).using(SPFx(context))
      : spfi().using(SPFx(context));
  }

  /**
   * Trae los datos del usuario logueado desde su perfil (User Profile Service),
   * igual que hacía GetMyProperties en el código clásico.
   */
  public async getCurrentUser(): Promise<IUserData> {
    try {
      const profile = await this.sp.profiles.myProperties();
      const props: { Key: string; Value: string }[] =
        (profile && (profile as any).UserProfileProperties) || [];

      const getProp = (key: string): string =>
        props.find((p) => p.Key === key)?.Value || "";

      return {
        nombre: (profile as any)?.DisplayName || DEFAULT_USER.nombre,
        legajo: getProp("upLegajo") || DEFAULT_USER.legajo,
        email: getProp("WorkEmail") || DEFAULT_USER.email,
        direccion: getProp("upDireccion") || DEFAULT_USER.direccion,
        sector: getProp("Department") || DEFAULT_USER.sector,
      };
    } catch (err) {
      console.error("No se pudo obtener el perfil del usuario:", err);
      return DEFAULT_USER;
    }
  }

  /**
   * Registra un click de navegación en la lista "Registro De Uso".
   * No frena la navegación si falla: solo lo loguea en consola.
   */
  public async registrarUso(params: {
    botonId: string;
    urlNav: string;
    textoBoton: string;
    pilar: string;
    tipoMenu: "Superior" | "Submenu" | "Lateral";
    usuario: IUserData;
  }): Promise<void> {
    const { botonId, urlNav, textoBoton, pilar, tipoMenu, usuario } = params;
    try {
      await this.sp.web.lists.getByTitle(USAGE_LIST_TITLE).items.add({
        BotonID: botonId,
        TextoID: textoBoton,
        // OJO: el nombre interno de esta columna en SharePoint clásico tenía un espacio
        // codificado como _x0020_. Si tu lista nueva usa otro nombre interno, cambialo acá.
        Mail_x0020_Usuario: usuario.email,
        Legajo: usuario.legajo,
        Direccion: usuario.direccion,
        Pilar: pilar,
        Sector: usuario.sector,
        NombreYApellido: usuario.nombre,
        TipoMenu: tipoMenu,
      });
    } catch (err) {
      console.error("Error registrando uso:", err, { botonId, urlNav });
    }
  }
}
