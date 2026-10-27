import * as React from "react";
import styles from "./TablaLinksWebPart.module.scss";
import { ITablaLinksWebPartProps } from "./ITablaLinksWebPartProps";
import { TablaLinksService, ILinkItem } from "../services/TablaLinksService";

interface IGrupoTematica {
  tematica: string;
  items: ILinkItem[];
}

interface ISeccion {
  titulo: string;
  tieneTematica: boolean;
  items: ILinkItem[];
  grupos: IGrupoTematica[];
}

interface IState {
  secciones: ISeccion[];
  cargando: boolean;
  error: string;
}

export default class TablaLinksWebPart extends React.Component<ITablaLinksWebPartProps, IState> {
  constructor(props: ITablaLinksWebPartProps) {
    super(props);
    this.state = {
      secciones: [],
      cargando: true,
      error: ""
    };
  }

  public componentDidMount(): void {
    this.cargar();
  }

  public componentDidUpdate(prevProps: ITablaLinksWebPartProps): void {
    if (
      this.props.lista1 !== prevProps.lista1 ||
      this.props.lista2 !== prevProps.lista2 ||
      this.props.tituloSeccion1 !== prevProps.tituloSeccion1 ||
      this.props.tituloSeccion2 !== prevProps.tituloSeccion2 ||
      this.props.backendSiteUrl !== prevProps.backendSiteUrl
    ) {
      this.setState({ cargando: true, error: "", secciones: [] }, () => {
        this.cargar();
      });
    }
  }

  private async cargar(): Promise<void> {
    const { lista1, lista2, tituloSeccion1, tituloSeccion2, spHttpClient, siteUrl, backendSiteUrl } = this.props;

    if (!lista1 && !lista2) {
      this.setState({ cargando: false, error: "", secciones: [] });
      return;
    }

    const service = new TablaLinksService(spHttpClient, backendSiteUrl || siteUrl);
    const secciones: ISeccion[] = [];

    try {
      if (lista1) {
        const info1 = await service.getItemsDeLista(lista1);
        if (info1.items.length > 0) {
          secciones.push({
            titulo: tituloSeccion1 || "Sección 1",
            tieneTematica: info1.tieneTematica,
            items: info1.items,
            grupos: this.agruparPorTematica(info1.items, info1.tieneTematica)
          });
        }
      }

      if (lista2) {
        const info2 = await service.getItemsDeLista(lista2);
        if (info2.items.length > 0) {
          secciones.push({
            titulo: tituloSeccion2 || "Sección 2",
            tieneTematica: info2.tieneTematica,
            items: info2.items,
            grupos: this.agruparPorTematica(info2.items, info2.tieneTematica)
          });
        }
      }

      this.setState({ secciones, cargando: false });
    } catch (err) {
      this.setState({ error: "Error al recuperar la información.", cargando: false });
      console.error(err);
    }
  }

  private agruparPorTematica(items: ILinkItem[], tieneTematica: boolean): IGrupoTematica[] {
    if (!tieneTematica) {
      return [];
    }

    const mapa: { [tematica: string]: ILinkItem[] } = {};

    for (const item of items) {
      const tematica = item.tematica || "Sin temática";
      if (!mapa[tematica]) {
        mapa[tematica] = [];
      }
      mapa[tematica].push(item);
    }

    return Object.keys(mapa)
      .sort((a, b) => a.localeCompare(b))
      .map((tematica) => ({
        tematica,
        items: mapa[tematica]
      }));
  }

  private renderItems(items: ILinkItem[], idxSeccion: number): JSX.Element {
    return (
      <div className={styles.tabla}>
        {items.map((item, idxItem) => (
          <div
            key={`item-${idxSeccion}-${idxItem}`}
            className={`${styles.row} ${idxItem % 2 === 0 ? styles.rowPar : styles.rowImpar}`}
          >
            <div className={styles.cellTitulo}>{item.titulo}</div>
            <div className={styles.cellAccion}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.botonVerMas}
              >
                Ver más
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  private renderSeccionConTematica(seccion: ISeccion, idxSeccion: number): JSX.Element {
    return (
      <div className={styles.tablaTematica}>
        {seccion.grupos.map((grupo, idxGrupo) => (
          <div key={`grupo-${idxSeccion}-${idxGrupo}`} className={styles.grupoTematica}>
            <div className={styles.subtituloTematica}>{grupo.tematica}</div>
            {grupo.items.map((item, idxItem) => (
              <div
                key={`item-${idxSeccion}-${idxGrupo}-${idxItem}`}
                className={styles.row}
              >
                <div className={styles.cellTitulo}>{item.titulo}</div>
                <div className={styles.cellAccion}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.botonVerMas}
                  >
                    Ver más
                  </a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  public render(): React.ReactElement<ITablaLinksWebPartProps> {
    const { secciones, cargando, error } = this.state;

    return (
      <div className={styles.tablaLinksContainer}>
        {cargando && (
          <div className={styles.row}>
            <div className={styles.cellTitulo}>Cargando...</div>
          </div>
        )}

        {error && (
          <div className={styles.row}>
            <div className={styles.cellTitulo}>{error}</div>
          </div>
        )}

        {!cargando && !error && secciones.length === 0 && (
          <div className={styles.row}>
            <div className={styles.cellTitulo}>No se encontraron elementos.</div>
          </div>
        )}

        {secciones.map((seccion, idxSeccion) => (
          <div key={`seccion-${idxSeccion}`} className={styles.seccion}>
            <div className={styles.tituloWrapper}>
              <div className={styles.titulo}>{seccion.titulo}</div>
            </div>
            {seccion.tieneTematica
              ? this.renderSeccionConTematica(seccion, idxSeccion)
              : this.renderItems(seccion.items, idxSeccion)}
          </div>
        ))}
      </div>
    );
  }
}
