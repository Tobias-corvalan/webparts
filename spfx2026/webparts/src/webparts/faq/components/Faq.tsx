import * as React from 'react';
import { useState } from 'react';
import styles from './Faq.module.scss';
import type { IFaqProps } from './IFaqProps';
import { useEffect } from 'react';
import { set } from '@microsoft/sp-lodash-subset/lib/index';
import {SPHttpClientResponse,SPHttpClient} from '@microsoft/sp-http'
import { Icon } from '@fluentui/react';
import { SharePointBackendService } from '../../../services/SharePointBackendService';

// import { escape } from '@microsoft/sp-lodash-subset';
// import welcomeDark from '../assets/welcome-dark.png';
// import welcomeLight from '../assets/welcome-light.png';

type ListItem = {
  id: number,
  Title: string,
  ClaseImagen: string,
  NombreIcono: string,
  Link: string,
  imgp: any
}


const FAQ = (props:IFaqProps)=>{

  const [items,setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState<Boolean>(true);
  const [error, setError] = useState<string|null>(null);



  const {
      listName,
      siteUrl,
      spHttpClient,
      sp,
      backendSiteUrl
     } = props

useEffect(()=> {
let isMounted = true;

const fetchItems = async () =>{

  setLoading(true);
  setError(null);
  setItems([]);

  try{
    const safeId = encodeURIComponent(listName || '');
//     const url = 
//   `${siteUrl}/_api/web/lists/getbytitle('${safeTitle}')/items?$select=Id,Title,cuerpo,img&$top=50
// `;

  

//   const res: SPHttpClientResponse = await spHttpClient.get(url,SPHttpClient.configurations.v1)
//   console.log(url)
  

// if (!res.ok) throw new Error(`${res.status} ${res.text} `);

// const data = await res.json();


const query =
  `?$select=Id,Title,ClaseImagen,NombreIcono,orden,Link` +
  `&$top=50`;

const data: ListItem[] = await SharePointBackendService.getListItems(
              props.spHttpClient,
              `${props.backendSiteUrl}`,
              'RecuadroHome',
              '?$select=Id,Title,ClaseImagen,NombreIcono,orden,Link&$top=50'
            );

console.log('FAQ BACKEND:', data);

if (isMounted) {
  setItems(data);
}


}catch(e: any){
  if(isMounted) setError(e.message || 'No se cual es el error');
}finally{
  if(isMounted) setLoading(false);
}
}

 if(listName && listName.trim().length > 0){
  void fetchItems();
 }else{
  setItems([]);
  setLoading(false);
 }

 return ()=>{isMounted = false};
},[spHttpClient,siteUrl,listName])

  // ==========================================
  // CUADROS AZULES
  // ==========================================

  const quickLinks = [
    {
      title: 'Colaboradores',
      icon: 'People',
      url: '#'
    },
    {
      title: 'Servicios',
      icon: 'BulletedList',
      url: '#'
    },
    {
      title: 'Beneficios',
      icon: 'FavoriteStar',
      url: '#'
    },
    {
      title: 'Medicamentos',
      icon: 'Pill',
      url: '#'
    },
    {
      title: 'Talento',
      icon: 'Contact',
      url: '#'
    },
    {
      title: 'Consultas',
      icon: 'Messages',
      url: '#'
    },
    {
      title: 'Sucesos Factores',
      icon: 'Group',
      url: '#'
    },
    {
      title: 'Marca',
      icon: 'GridViewMedium',
      url: '#'
    },
    {
      title: 'Accesos Directos',
      icon: 'Link',
      url: '#'
    }
  ];


  return (

    <div className={styles.container}>
      <div className={styles.quickLinks}>

        {items.map((link, index) => (

          <div
            key={index}
            className={styles.quickLink}
            onClick={() => {
              if (link.Link !== '#') {
                window.location.href = link.Link;
              }
            }}
          >

            {/\.(png|svg|jpe?g|gif|webp)$/i.test(
                (link.NombreIcono || '').trim()
              ) ? (
                <img
                  src={
                    'https://digitalm365stk.sharepoint.com/sites/PnPModernSearchTest/' +
                    'PublishingImages/Iconos%20Recuadro/' +
                    encodeURIComponent(link.NombreIcono.trim())
                  }
                  className={styles.imageIcon}
                  alt=""
                />
              ) : link.ClaseImagen ? (
                <i
                  className={styles.legacyIcon}
                  data-icon={link.ClaseImagen.trim()}
                  aria-hidden="true"
                />
              ) : (
                <Icon
                  iconName={(link.NombreIcono || '').trim()}
                  className={styles.icon}
                />
              )}

            <span className={styles.title}>
              {link.Title}
            </span>

          </div>

        ))}

      </div>
    </div>
  );
};

export default FAQ;

