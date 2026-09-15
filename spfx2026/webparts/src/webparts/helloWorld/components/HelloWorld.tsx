import * as React from 'react';
import styles from './HelloWorld.module.scss';
import type { IHelloWorldProps } from './IHelloWorldProps';
import { escape } from '@microsoft/sp-lodash-subset';
import welcomeDark from '../assets/welcome-dark.png';
import welcomeLight from '../assets/welcome-light.png';
import { useState, useEffect } from 'react';
import { SharePointBackendService } from '../../../services/SharePointBackendService';

type ListItem = {
  id: number;
  Title: string;
  Imagen: string;
  Descripcion: string;
  LinkTitulo: string;
  SinSombreado: boolean;
  Titulo: string;
};

const Welcome = (props: IHelloWorldProps) => {
  const {
    description,
    isDarkTheme,
    environmentMessage,
    userDisplayName,
    siteUrl,
    spHttpClient,
    sp,
    listName,
    backendSiteUrl
  } = props;

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const safeId = encodeURIComponent(listName || '');

        const data = await SharePointBackendService.getListItems(
  props.spHttpClient,
  `${props.backendSiteUrl}`,
  listName,
  '?$select=Id,Title,Imagen,Descripci_x00f3_n,LinkTitulo,SinSombreado&$top=50'
);

        console.log("Datos obtenidos:", data);

        if (isMounted) {

          const lista: ListItem[] = data.map((item: any) => ({
  id: item.Id,
  Title: item.Title || "",
  Imagen: item.Imagen?.Url || "",
  Descripcion: item.Descripci_x00f3_n || "",
  LinkTitulo: item.LinkTitulo?.Url || "",
  SinSombreado: item.SinSombreado || false,
  Titulo: item.LinkTitulo?.Description || ""
}));
          console.log("Lista mapeada:", lista);

          setItems(lista);
        }

      } catch (e: any) {

        if (isMounted) {
          setError(e.message || 'No se cual es el error');
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (listName && listName.trim().length > 0) {
     void fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };

  }, [sp, listName,backendSiteUrl]);

  const slides = [
    {
      id: 1,
      titulo: 'Bienvenidos a Gador',
      imagen: 'https://picsum.photos/id/1018/1600/500',
      descripcion: '¿Querés conocer más sobre nuestra organización?',
      linkTitulo: 'Conocé más',
      link: 'https://www.google.com',
      sombreado: false
    },
    {
      id: 2,
      titulo: 'Beneficios',
      imagen: 'https://picsum.photos/id/1015/1600/500',
      descripcion: 'Conocé todos los beneficios disponibles para colaboradores.',
      linkTitulo: 'Ver beneficios',
      link: '#',
      sombreado: true
    },
    {
      id: 3,
      titulo: 'Talento',
      imagen: 'https://picsum.photos/id/1019/1600/500',
      descripcion: 'Encontrá nuevas oportunidades y desarrollá tu talento.',
      linkTitulo: 'Ver más',
      link: '#',
      sombreado: true
    },
    {
      id: 4,
      titulo: 'Novedades',
      imagen: 'https://picsum.photos/id/1043/1600/500',
      descripcion: 'Enterate de las últimas novedades de Gador.',
      linkTitulo: 'Ver novedades',
      link: '#',
      sombreado: false
    }
  ];

const [currentSlide, setCurrentSlide] = useState(0);
const [resetTimer, setResetTimer] = useState(0);

const nextSlide = () => {
  setCurrentSlide((prev) =>
    prev === items.length - 1 ? 0 : prev + 1
  );

  // Reinicia el contador de 5 segundos
  setResetTimer((prev) => prev + 1);
};

const previousSlide = () => {
  setCurrentSlide((prev) =>
    prev === 0 ? items.length - 1 : prev - 1
  );

  // Reinicia el contador de 5 segundos
  setResetTimer((prev) => prev + 1);
};

useEffect(() => {

  if (items.length === 0) {
    return;
  }

  const interval = setInterval(() => {

    setCurrentSlide((prev) =>
      prev === items.length - 1 ? 0 : prev + 1
    );

  }, 5000);

  return () => clearInterval(interval);

}, [items.length, resetTimer]);

 return (
  <section className={styles.helloWorld}>

    <div className={styles.hero}>

      <div
        className={styles.slidesTrack}
        style={{
          transform: `translateX(-${currentSlide * 100}%)`
        }}
      >

        {items.map((slide) => (

          <div
            key={slide.id}
            className={styles.slide}
          >

            {/* Fondo borroso: rellena el espacio vacío sin recortar la imagen principal */}
            <div
              className={styles.slideBg}
              style={{ backgroundImage: `url(${slide.Imagen})` }}
            ></div>

            {/* Imagen (completa, sin recortar) */}
            <img
              src={slide.Imagen}
              alt={slide.Title}
              className={styles.slideImg}
            />

            {/* Sombreado */}
            {slide.SinSombreado && (<>
              <div className={styles.overlay}></div>
                {/* Contenido */}
              <div className={styles.content}>

              <h2>
                {slide.Title}
              </h2>

              <p>
                {slide.Descripcion}
              </p>

              {slide.LinkTitulo && (
                <a
                  href={slide.LinkTitulo}
                  className={styles.button}
                  target="_blank"
                  rel="noreferrer"
                >
                  {slide.Titulo}
                </a>
              )}

            </div>
            </>
            )}
          </div>

        ))}

      </div>

      {/* Flecha izquierda */}
      {items.length > 1 && (
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={previousSlide}
        >
          <span>‹</span>
        </button>
      )}

      {/* Flecha derecha */}
      {items.length > 1 && (
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={nextSlide}
        >
          <span>›</span>
        </button>
      )}

      {/* Indicadores */}
      {items.length > 1 && (
        <div className={styles.dots}>

          {items.map((slide, index) => (

            <button
              key={slide.id}
              className={
                index === currentSlide
                  ? styles.dotActive
                  : styles.dot
              }
              onClick={() => setCurrentSlide(index)}
            />

          ))}

        </div>
      )}

    </div>

  </section>
  )
}


export default Welcome
// export default class HelloWorld extends React.Component<IHelloWorldProps> {
//   public render(): React.ReactElement<IHelloWorldProps> {
//     const {
//       description,
//       isDarkTheme,
//       environmentMessage,
//       userDisplayName,
//       MorningMessage,
//       AfternoonMessage,
//       EveningMessage
//     } = this.props;
// const now = new Date();
// const hour = now.getHours();
// const message = hour < 12 ? MorningMessage : hour >= 12 && hour < 18 ? AfternoonMessage : EveningMessage
//     return (
//       <section className={`${styles.helloWorld}`}>
//         <div className={styles.welcome}>
//           <img alt="" src={isDarkTheme ? welcomeDark : welcomeLight} className={styles.welcomeImage} />
//           <h2>Well done, {escape(userDisplayName)}!</h2>
//           <div>{environmentMessage}</div>
//           <div>Web part property value: <strong>{escape(description)}</strong></div>
//         </div>
//         <div>
//           <h3>Welcome to SharePoint Framework!</h3>
//           <h2>{message} !</h2>
//           <p>
//             The SharePoint Framework (SPFx) is a extensibility model for Microsoft Viva, Microsoft Teams and SharePoint. It&#39;s the easiest way to extend Microsoft 365 with automatic Single Sign On, automatic hosting and industry standard tooling.
//           </p>
//           <h4>Learn more about SPFx development:</h4>
//           <ul className={styles.links}>
//             <li><a href="https://aka.ms/spfx" target="_blank" rel="noreferrer">SharePoint Framework Overview</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-graph" target="_blank" rel="noreferrer">Use Microsoft Graph in your solution</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-teams" target="_blank" rel="noreferrer">Build for Microsoft Teams using SharePoint Framework</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-viva" target="_blank" rel="noreferrer">Build for Microsoft Viva Connections using SharePoint Framework</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-store" target="_blank" rel="noreferrer">Publish SharePoint Framework applications to the marketplace</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-api" target="_blank" rel="noreferrer">SharePoint Framework API reference</a></li>
//             <li><a href="https://aka.ms/m365pnp" target="_blank" rel="noreferrer">Microsoft 365 Developer Community</a></li>
//           </ul>
//         </div>
//       </section>
//     );
//   }
// }