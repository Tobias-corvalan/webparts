import * as React from 'react';
import { useEffect, useState, useRef } from 'react';

import { IListaNovedadesProps } from './IListaNovedadesProps';

import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

import styles from './ListaNovedades.module.scss';
import { SharePointBackendService } from '../../../services/SharePointBackendService';

interface INovedad {
  Id: number;
  Modified: string;
  Destacar: boolean;
  Ocultar: boolean;
  Estado_x0020_Formulario: string;

  Template?: {
    Title: string;
  };

  Vista?: {
    Url: string;
    Description: string;
  };
}

interface IElementoLista {
  tipo: 'cumpleanos' | 'novedad';
  Id: number;
  Template?: string;
  Url: string;
  Description: string;
}

const ListaNovedades: React.FC<IListaNovedadesProps> = (props) => {

  /* =====================================================
     ESTADOS
  ===================================================== */

  const [elementos, setElementos] =
    useState<IElementoLista[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const [indiceActual, setIndiceActual] =
    useState<number>(0);

  const [pausado, setPausado] =
    useState<boolean>(false);

  const [animacionActiva, setAnimacionActiva] =
    useState<boolean>(true);


  /* =====================================================
     REFERENCIAS
  ===================================================== */

  /*
   * Timer del autoplay.
   *
   * Usamos setTimeout y no setInterval.
   */
  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Indica si actualmente estamos haciendo
   * una animación.
   *
   * Evita dos movimientos simultáneos.
   */
  const animandoRef =
    useRef<boolean>(false);

  /*
   * Timer utilizado cuando mantenemos
   * el mouse apretado.
   */
  const movimientoMouseRef =
    useRef<ReturnType<typeof setInterval> | null>(null);


  /* =====================================================
     CARRUSEL INFINITO
  ===================================================== */

  /*
   * No usamos flat().
   *
   * Creamos 10 copias de la lista.
   *
   * Esto nos permite movernos hacia arriba
   * y hacia abajo sin que se termine la lista.
   */
  const elementosCarrusel: IElementoLista[] = [];

  if (elementos.length > 0) {

    for (let i = 0; i < 10; i++) {

      elementosCarrusel.push(...elementos);

    }

  }


  /* =====================================================
     CARGAR DATOS
  ===================================================== */

  useEffect(() => {

    void getInformacionGeneralItems();

  }, [props.backendSiteUrl, props.subsitePath]);


  /* =====================================================
     OBTENER NOVEDADES
  ===================================================== */

  async function getInformacionGeneralItems(): Promise<void> {

      setError(null);
      setElementos([]);

      if (!props.backendSiteUrl) {

        console.warn(
          'ListaNovedades: falta configurar "URL del sitio backend" en el panel de propiedades del webpart.'
        );

        setError(
          'Falta configurar la URL del sitio backend en las propiedades del webpart.'
        );

        setLoading(false);

        return;

      }

      try {

        setLoading(true);

        const itemsTotales: INovedad[] =
          await SharePointBackendService.getListItems(
            props.spHttpClient,
            `${props.backendSiteUrl}${props.subsitePath}`,
            'Informacion General',
            '?$select=*,Template/Title,Vista/Url,Vista/Description&$expand=Template&$orderby=Id desc'
          );

        console.log(
          'TODOS LOS ITEMS:',
          itemsTotales
        );


        /* ==========================================
           DESTACADOS
        ========================================== */

        const itemsDestacados =
          itemsTotales.filter(
            (el) =>
              el.Destacar === true &&
              el.Estado_x0020_Formulario ===
                'Publicado'
          );


        /* ==========================================
           NO DESTACADOS / NO OCULTOS
        ========================================== */

        const itemsNoDestacadosNoOcultos =
          itemsTotales.filter(
            (el) =>
              el.Destacar === false &&
              el.Ocultar === false &&
              el.Estado_x0020_Formulario ===
                'Publicado'
          );


        console.log(
          'DESTACADOS:',
          itemsDestacados
        );

        console.log(
          'NO DESTACADOS:',
          itemsNoDestacadosNoOcultos
        );


        /* ==========================================
           ARMAR LAS 5 NOVEDADES
        ========================================== */

        const novedadesFinales:
          INovedad[] = [];

        let todosDestacados = false;


        /*
         * Primero destacados recientes.
         */
        for (
          let i = 0;
          i < itemsDestacados.length;
          i++
        ) {

          if (
            diasDesdeModificacion(
              itemsDestacados[i].Modified
            ) <= 8
          ) {

            novedadesFinales.push(
              itemsDestacados[i]
            );

          }

          if (
            novedadesFinales.length === 5
          ) {

            todosDestacados = true;

            break;

          }

        }


        /*
         * Si no llegamos a 5,
         * completamos con normales.
         */
        if (!todosDestacados) {

          for (
            let j = 0;
            j < itemsNoDestacadosNoOcultos.length;
            j++
          ) {

            novedadesFinales.push(
              itemsNoDestacadosNoOcultos[j]
            );

            if (
              novedadesFinales.length === 5
            ) {

              break;

            }

          }

        }


        console.log(
          'NOVEDADES FINALES:',
          novedadesFinales
        );


        /* ==========================================
           ARMAR LISTA FINAL
        ========================================== */

        const listaFinal:
          IElementoLista[] = [];


        /*
         * Cumpleaños siempre primero.
         */
        listaFinal.push({

          tipo: 'cumpleanos',

          Id: 0,

          Url:
            `${props.backendSiteUrl}/GP/Sociales/Paginas/Cumpleaños/Todos.aspx`,

          Description:
            'Cumpleaños del Mes'

        });


        /*
         * Agregar novedades.
         */
        novedadesFinales.forEach(
          (novedad) => {

            listaFinal.push({

              tipo: 'novedad',

              Id: novedad.Id,

              Template:
                novedad.Template?.Title || '',

              Url:
                novedad.Vista?.Url || '#',

              Description:
                novedad.Vista?.Description || ''

            });

          }
        );


        console.log(
          'LISTA FINAL:',
          listaFinal
        );


        setElementos(listaFinal);

      }
      catch (error) {

        console.error(
          'ERROR OBTENIENDO NOVEDADES:',
          error
        );

        setError(
          'No se pudieron cargar las novedades. Probá de nuevo más tarde.'
        );

      }
      finally {

        setLoading(false);

      }

    };


  /* =====================================================
     POSICIÓN INICIAL
  ===================================================== */

  useEffect(() => {

    if (elementos.length === 0) {
      return;
    }

    /*
     * Tenemos 10 copias.
     *
     * Arrancamos en la copia número 5.
     */
    const indiceInicial =
      elementos.length * 5;

    setAnimacionActiva(false);

    setIndiceActual(
      indiceInicial
    );

    animandoRef.current = false;


    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        setAnimacionActiva(true);

      });

    });

  }, [elementos.length]);


  /* =====================================================
     AUTOPLAY
  ===================================================== */

  useEffect(() => {

    /*
     * Cancelamos cualquier timer anterior.
     */
    if (timeoutRef.current) {

      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;

    }


    /*
     * Si está pausado no hacemos nada.
     */
    if (
      pausado ||
      elementos.length <= 1
    ) {

      return;

    }


    /*
     * Esperamos 4 segundos.
     */
    timeoutRef.current =
      setTimeout(() => {

        moverSiguiente();

      }, 4000);


    return () => {

      if (timeoutRef.current) {

        clearTimeout(
          timeoutRef.current
        );

        timeoutRef.current = null;

      }

    };

  }, [
    indiceActual,
    elementos.length,
    pausado
  ]);


  /* =====================================================
     MOVER HACIA ABAJO
  ===================================================== */

  function moverSiguiente(): void {

    /*
     * Si ya estamos animando,
     * no permitimos otro movimiento.
     */
    if (
      elementos.length === 0 ||
      animandoRef.current
    ) {

      return;

    }


    /*
     * Cancelamos autoplay.
     */
    if (timeoutRef.current) {

      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;

    }


    animandoRef.current = true;


    setIndiceActual(
      (indice) => indice + 1
    );

  };


  /* =====================================================
     MOVER HACIA ARRIBA
  ===================================================== */

  const moverAnterior = (): void => {

    if (
      elementos.length === 0 ||
      animandoRef.current
    ) {

      return;

    }


    /*
     * Cancelamos autoplay.
     */
    if (timeoutRef.current) {

      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;

    }


    animandoRef.current = true;


    setIndiceActual(
      (indice) => indice - 1
    );

  };


  /* =====================================================
     MOUSE PRESIONADO
  ===================================================== */

  const iniciarMovimientoMouse = (
    direccion: 'arriba' | 'abajo'
  ): void => {

    /*
     * Cancelamos el autoplay.
     */
    if (timeoutRef.current) {

      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;

    }


    /*
     * Si ya estamos manteniendo el mouse,
     * no iniciamos otro timer.
     */
    if (movimientoMouseRef.current) {

      return;

    }


    /*
     * Primer movimiento inmediato.
     */
    if (
      direccion === 'arriba'
    ) {

      moverAnterior();

    }
    else {

      moverSiguiente();

    }


    /*
     * Mientras mantenemos apretado,
     * seguimos moviendo.
     */
    movimientoMouseRef.current =
      setInterval(() => {

        if (
          direccion === 'arriba'
        ) {

          moverAnterior();

        }
        else {

          moverSiguiente();

        }

      }, 700);

  };


  /* =====================================================
     DETENER MOUSE
  ===================================================== */

  const detenerMovimientoMouse =
    (): void => {

      if (
        movimientoMouseRef.current
      ) {

        clearInterval(
          movimientoMouseRef.current
        );

        movimientoMouseRef.current =
          null;

      }

    };


  /* =====================================================
     FIN DE ANIMACIÓN
  ===================================================== */

  const manejarFinAnimacion = (
    event:
      React.TransitionEvent<HTMLDivElement>
  ): void => {

    /*
     * Solo nos interesa transform.
     */
    if (
      event.propertyName !==
      'transform'
    ) {

      return;

    }


    const cantidad =
      elementos.length;


    if (cantidad === 0) {
      return;
    }


    /*
     * Centro del carrusel.
     */
    const centro =
      cantidad * 5;


    /* ==========================================
       NOS FUIMOS DEMASIADO HACIA ADELANTE
    ========================================== */

    if (
      indiceActual >=
      centro + cantidad
    ) {

      setAnimacionActiva(false);

      setIndiceActual(
        centro
      );

      animandoRef.current =
        false;


      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          setAnimacionActiva(true);

        });

      });

      return;

    }


    /* ==========================================
       NOS FUIMOS DEMASIADO HACIA ATRÁS
    ========================================== */

    if (
      indiceActual < centro
    ) {

      setAnimacionActiva(false);

      setIndiceActual(
        centro + cantidad - 1
      );

      animandoRef.current =
        false;


      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          setAnimacionActiva(true);

        });

      });

      return;

    }


    /*
     * Terminó una animación normal.
     */
    animandoRef.current =
      false;

  };


  /* =====================================================
     DÍAS DESDE MODIFICACIÓN
  ===================================================== */

  function diasDesdeModificacion(fecha: string): number {

    const ahora =
      new Date().getTime();

    const modificacion =
      new Date(fecha).getTime();

    return Math.floor(
      (ahora - modificacion) /
      (1000 * 60 * 60 * 24)
    );

  };


  /* =====================================================
     OBTENER IMAGEN
  ===================================================== */

  const obtenerImagen = (
    nombre: string
  ): string => {

    let nombreImagen =
      nombre;


    if (
      nombreImagen.includes('_V')
    ) {

      nombreImagen =
        nombreImagen.substring(
          0,
          nombreImagen.length - 1
        ) + '1';

    }


    return (
      `${props.backendSiteUrl}/ConfNovedades/Imagenes/MINI-${nombreImagen}.jpg`
    );

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <div className={styles.listaNovedades}>
        <div className={styles.tituloNovedades}>
          <span className={styles.iconoTitulo} aria-hidden="true">📣</span>
          Novedades
        </div>
        <div className={styles.loading}>
          Cargando novedades...
        </div>
      </div>
    );

  }


  /* =====================================================
     SIN ELEMENTOS
  ===================================================== */

  if (elementos.length === 0) {

    return (
      <div className={styles.listaNovedades}>
        <div className={styles.tituloNovedades}>
          <span className={styles.iconoTitulo} aria-hidden="true">📣</span>
          Novedades
        </div>
        <div className={styles.error}>
          {error || 'No hay novedades para mostrar.'}
        </div>
      </div>
    );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className={styles.listaNovedades}>


      {/* ================================================
          TÍTULO
      ================================================= */}

      <div className={styles.tituloNovedades}>
        <span className={styles.iconoTitulo} aria-hidden="true">📣</span>
        Novedades
      </div>


      {/* ================================================
          LISTA VISIBLE

          Se muestran 5 elementos.
      ================================================= */}

      <div
        className={styles.listaVisible}

        onMouseEnter={() =>
          setPausado(true)
        }

        onMouseLeave={() => {

          setPausado(false);

          detenerMovimientoMouse();

        }}
      >

        <div
          className={styles.novedadLista}

          onTransitionEnd={
            manejarFinAnimacion
          }

          style={{

            transform:
              `translateY(-${indiceActual * 66}px)`,

            transition:
              animacionActiva
                ? 'transform 0.6s ease-in-out'
                : 'none'

          }}
        >

          {elementosCarrusel.map(
            (
              elemento,
              index
            ) => (

              <div
                key={
                  `${elemento.tipo}-${elemento.Id}-${index}`
                }

                className={
                  styles.newsItem
                }
              >

                <table
                  cellPadding={4}
                >

                  <tbody>

                    <tr>

                      <td>

                        <img
                          src={
                            obtenerImagen(
                              elemento.tipo ===
                                'cumpleanos'
                                ? 'Cumpleaños'
                                : elemento.Template || ''
                            )
                          }

                          className={
                            styles.imgCircle
                          }

                          alt=""
                        />

                      </td>


                      <td>

                        <a
                          href={
                            elemento.Url
                          }

                          target="_blank"

                          rel="noopener noreferrer"
                        >
                          {
                            elemento.Description
                          }
                        </a>

                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            )
          )}

        </div>

      </div>


      {/* ================================================
          CONTROLES MANUALES

          Dos flechas chiquitas abajo a la izquierda.
          Mantener apretado = movimiento continuo
          (reusa las mismas funciones de antes).
      ================================================= */}

      <div className={styles.controles}>

        <button
          type="button"
          className={styles.botonControl}
          aria-label="Ver novedad siguiente"

          onMouseDown={() =>
            iniciarMovimientoMouse('abajo')
          }
          onMouseUp={detenerMovimientoMouse}
          onMouseLeave={detenerMovimientoMouse}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.botonControl}
          aria-label="Ver novedad anterior"

          onMouseDown={() =>
            iniciarMovimientoMouse('arriba')
          }
          onMouseUp={detenerMovimientoMouse}
          onMouseLeave={detenerMovimientoMouse}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 7.5L6 4L9.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

      </div>

    </div>

  );

};

export default ListaNovedades;