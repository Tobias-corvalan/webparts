import * as React from "react";
import styles from "./TablaDoc.module.scss";
import { ITablaDocProps } from "./ITablaDocProps";
import { TablaDocService, IGrupo } from "../services/TablaDocService";

interface IState {
  grupos: IGrupo[];
  cargando: boolean;
  error: string;
}

export default class TablaDoc extends React.Component<ITablaDocProps, IState> {
  constructor(props: ITablaDocProps) {
    super(props);
    this.state = {
      grupos: [],
      cargando: true,
      error: ""
    };
  }

  public componentDidMount(): void {
    this.cargar();
  }

  public componentDidUpdate(prevProps: ITablaDocProps): void {
    const siteUrl = this.props.backendSiteUrl || this.props.siteUrl;
    const biblioteca = this.props.biblioteca || "Documentos";
    const prevSiteUrl = prevProps.backendSiteUrl || prevProps.siteUrl;
    const prevBiblioteca = prevProps.biblioteca || "Documentos";

    if (siteUrl !== prevSiteUrl || biblioteca !== prevBiblioteca) {
      this.setState({ cargando: true, error: "", grupos: [] }, () => {
        this.cargar();
      });
    }
  }

  private async cargar(): Promise<void> {
    const siteUrl = this.props.backendSiteUrl || this.props.siteUrl;
    const biblioteca = this.props.biblioteca || "Documentos";
    const service = new TablaDocService(
      this.props.spHttpClient,
      siteUrl,
      biblioteca
    );

    try {
      const grupos = await service.getGrupos();
      this.setState({ grupos, cargando: false });
    } catch (err) {
      this.setState({
        error: "Error al recuperar la información.",
        cargando: false
      });
      console.error(err);
    }
  }

  public render(): React.ReactElement<ITablaDocProps> {
    const { grupos, cargando, error } = this.state;
    const { description } = this.props;

    return (
      <div className={styles.tablaDocContainer}>
        <div className={styles.titleWrapper}>
          <div className={styles.title}>{description}</div>
        </div>

        {cargando && (
          <div className={styles.activity}>
            <div className={styles.activityHeader}>Cargando...</div>
          </div>
        )}

        {error && (
          <div className={styles.activity}>
            <div className={styles.activityHeader}>{error}</div>
          </div>
        )}

        {!cargando && !error && grupos.length === 0 && (
          <div className={styles.activity}>
            <div className={styles.activityHeader}>
              No se encontraron documentos vigentes.
            </div>
          </div>
        )}

        {grupos.map((grupo, index) => (
          <div
            key={`${grupo.carpeta}-${index}`}
            className={styles.activity}
          >
            <div className={styles.activityHeader}>{grupo.carpeta}</div>
            {grupo.archivos.length > 0 && (
              <div className={styles.activityFiles}>
                <ul>
                  {grupo.archivos.map((archivo, idx) => {
                    const nombreMostrar = archivo.nombre.replace(/\.[^/.]+$/, "");
                    return (
                      <li key={`${archivo.url}-${idx}`}>
                        <a
                          href={archivo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          • {nombreMostrar}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
}
