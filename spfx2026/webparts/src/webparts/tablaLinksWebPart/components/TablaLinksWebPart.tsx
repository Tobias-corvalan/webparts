import * as React from "react";
import styles from "./TablaLinksWebPart.module.scss";
import { ITablaLinksWebPartProps } from "./ITablaLinksWebPartProps";
import { TablaLinksService, ILinkItem, IAgendaItem, IInfoLista } from "../services/TablaLinksService";

interface IGrupoTematica {
  tematica: string;
  items: ILinkItem[];
}

interface ISeccion {
  titulo: string;
  tipo: "links" | "agenda";
  tieneTematica: boolean;
  items: ILinkItem[];
  agendaItems: IAgendaItem[];
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
        secciones.push(this.crearSeccion(tituloSeccion1 || "Sección 1", info1));
      }

      if (lista2) {
        const info2 = await service.getItemsDeLista(lista2);
        secciones.push(this.crearSeccion(tituloSeccion2 || "Sección 2", info2));
      }

      this.setState({ secciones, cargando: false });
    } catch (err) {
      this.setState({ error: "Error al recuperar la información.", cargando: false });
      console.error(err);
    }
  }

  private crearSeccion(titulo: string, info: IInfoLista): ISeccion {
    if (info.tipo === "agenda") {
      return {
        titulo,
        tipo: "agenda",
        tieneTematica: false,
        items: [],
        agendaItems: info.agendaItems,
        grupos: []
      };
    }

    return {
      titulo,
      tipo: "links",
      tieneTematica: info.tieneTematica,
      items: info.items,
      agendaItems: [],
      grupos: this.agruparPorTematica(info.items, info.tieneTematica)
    };
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

  private renderAgenda(agendaItems: IAgendaItem[], idxSeccion: number): JSX.Element {
    return (
      <div className={styles.tablaAgenda}>
        <div className={`${styles.row} ${styles.headerRow}`}>
          <div className={`${styles.cellHorario} ${styles.headerCell}`}>HORARIO</div>
          <div className={`${styles.cellCharla} ${styles.headerCell}`}>CHARLA</div>
          <div className={`${styles.cellArea} ${styles.headerCell}`}>ÁREA RESPONSABLE</div>
          <div className={`${styles.cellArchivos} ${styles.headerCell}`}>ARCHIVOS</div>
        </div>
        {agendaItems.map((item, idxItem) => (
          <div
            key={`agenda-${idxSeccion}-${idxItem}`}
            className={`${styles.row} ${idxItem % 2 === 0 ? styles.rowPar : styles.rowImpar}`}
          >
            <div className={styles.cellHorario}>{item.horario}</div>
            <div className={styles.cellCharla}>{item.charla}</div>
            <div className={styles.cellArea}>{item.areaResponsable}</div>
            <div className={styles.cellArchivos}>
              {item.archivos.map((archivo, idxArchivo) => (
                <div key={`archivo-${idxSeccion}-${idxItem}-${idxArchivo}`}>
                  <a
                    href={archivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkArchivo}
                  >
                    {archivo.descripcion}
                  </a>
                </div>
              ))}
              {item.archivos.length === 0 && <span>-</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  private renderContenido(seccion: ISeccion, idxSeccion: number): JSX.Element {
    if (seccion.tipo === "agenda") {
      return this.renderAgenda(seccion.agendaItems, idxSeccion);
    }

    if (seccion.tieneTematica) {
      return this.renderSeccionConTematica(seccion, idxSeccion);
    }

    return this.renderItems(seccion.items, idxSeccion);
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
            {this.renderContenido(seccion, idxSeccion)}
          </div>
        ))}
      </div>
    );
  }
}
