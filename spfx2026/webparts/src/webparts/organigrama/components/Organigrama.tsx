import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './Organigrama.module.scss';
import { IOrganigramaProps } from './IOrganigramaProps';
import { SharePointBackendService } from '../../../services/SharePointBackendService';

interface IOrganigramaItem {
  Id: number;
  Title: string;
  Visible: boolean;
  Indice: number;
  Subindice: number;
  Link?: {
    Url: string;
    Description?: string;
  };
}

const Organigrama = (props: IOrganigramaProps): JSX.Element => {

  const [items, setItems] = useState<IOrganigramaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    let isMounted = true;

    const cargarOrganigrama = async (): Promise<void> => {

      if (!props.listId || !props.backendSiteUrl) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {

        const query =
          `?$select=Id,Title,Visible,Indice,Subindice,Link` +
          `&$filter=Visible eq 1` +
          `&$orderby=Indice asc,Subindice asc`;

        const data =
          await SharePointBackendService.getListItemsById(
            props.spHttpClient,
            props.backendSiteUrl,
            props.listId,
            query
          );

        console.log('Datos Organigrama:', data);

        if (isMounted) {
          setItems(data as IOrganigramaItem[]);
        }

      } catch (e: any) {

        console.error('Error obteniendo organigrama:', e);

        if (isMounted) {
          setError(
            e?.message || 'No se pudo obtener el organigrama'
          );
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void cargarOrganigrama();

    return () => {
      isMounted = false;
    };

  }, [
    props.listId,
    props.backendSiteUrl,
    props.spHttpClient
  ]);


  if (loading) {
    return <div className={styles.container}>Cargando...</div>;
  }


  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (items.length === 0) {
    return <div className={styles.container}>No hay datos para mostrar.</div>;
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        {props.description || 'Organigrama'}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>

          <tbody>

            {items
              .filter(item => item.Subindice === 0)
              .map(item => {

                const hijos = items.filter(
                  hijo =>
                    hijo.Indice === item.Indice &&
                    hijo.Subindice > 0
                );

                return (
                  <tr key={item.Id}>

                    <td>

                      <dl>
                        <dt>

                          <a
                            href={item.Link?.Url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className={styles.link}>
                              {item.Title}
                            </span>
                          </a>

                        </dt>
                      </dl>


                      {hijos.length > 0 && (

                        <ul className={styles.lista}>

                          {hijos.map(hijo => (

                            <li key={hijo.Id}>

                              <a
                                href={hijo.Link?.Url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className={styles.link}>
                                  {hijo.Title}
                                </span>
                              </a>

                            </li>

                          ))}

                        </ul>

                      )}

                    </td>

                  </tr>
                );
              })}

          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Organigrama;
