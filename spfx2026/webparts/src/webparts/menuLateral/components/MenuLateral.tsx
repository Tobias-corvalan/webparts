import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './MenuLateral.module.scss';
import type { IMenuLateralProps } from './IMenuLateralProps';
import { LateralNavService, ILateralParentItem } from './services/LateralNavService';
import { UserGroupService } from './services/UserGroupService';
import { UsageService, IUserData } from './services/UsageService';
import { BannerService, IBannerInfo } from './services/BannerService';

const DEFAULT_USER: IUserData = {
  legajo: 'No Registrado',
  email: '',
  direccion: 'No Registrado',
  sector: 'No Registrado',
  nombre: 'No Registrado',
};

const MenuLateral: React.FC<IMenuLateralProps> = ({
  sp,
  context,
  siteUrl,
  backendSiteUrl,
  restrictedGroupId = 1440,
  restrictedSiteSegment = 'GestionMedicamentos',
  restrictedLinkTitle = 'Nuevo Pedido',
}) => {
  const [items, setItems] = useState<ILateralParentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestrictedGroup, setIsRestrictedGroup] = useState<boolean>(false);
  const [banner, setBanner] = useState<IBannerInfo | null>(null);
  const [userData, setUserData] = useState<IUserData>(DEFAULT_USER);

  // 1) Árbol de navegación lateral (del backend)
  useEffect(() => {
    if (!backendSiteUrl) {
      setLoading(false);
      return;
    }
    const navService = new LateralNavService();
    void navService
      .getLateralMenu(backendSiteUrl)
      .then((data) => setItems(data))
      .catch((err) => console.error('Error cargando menú lateral:', err))
      .then(() => setLoading(false));
  }, [backendSiteUrl]);

  // 2) Chequeo de grupo (para la regla de "Nuevo Pedido") - del backend
  useEffect(() => {
    if (!backendSiteUrl) {
      return;
    }
    const groupService = new UserGroupService(backendSiteUrl);
    void groupService.isUserInGroup(restrictedGroupId).then(setIsRestrictedGroup);
  }, [backendSiteUrl, restrictedGroupId]);

  // 3) Perfil del usuario, para el registro de uso (desde el backend)
  useEffect(() => {
    const usageService = new UsageService(context, backendSiteUrl);
    void usageService.getCurrentUser().then(setUserData);
  }, [context, backendSiteUrl]);

  // 4) Banner opcional (del backend)
  useEffect(() => {
    if (!backendSiteUrl) {
      return;
    }
    const bannerService = new BannerService();
    void bannerService.getBanner(backendSiteUrl).then(setBanner);
  }, [backendSiteUrl]);

  // Último segmento de la URL del sitio actual (ej: ".../GestionMedicamentos" -> "GestionMedicamentos")
  const currentSiteSegment = React.useMemo(() => {
    try {
      const path = new URL(siteUrl).pathname.split('/').filter(Boolean);
      return path[path.length - 1] || '';
    } catch {
      return '';
    }
  }, [siteUrl]);

  const handleClick = (
    evt: React.MouseEvent<HTMLAnchorElement>,
    opts: { botonId: string; urlNav: string; textoBoton: string; pilar: string }
  ): void => {
    evt.preventDefault();
    const usageService = new UsageService(context, backendSiteUrl);
    const goTo = (): void => {
      // Los links de la navegación lateral vienen relativos al backend;
      // se resuelven contra el origin del backendSiteUrl.
      const origin = new URL(backendSiteUrl).origin;
      const targetUrl = opts.urlNav.startsWith('http')
        ? opts.urlNav
        : `${origin}${opts.urlNav}`;
      window.location.href = targetUrl;
    };
    void usageService
      .registrarUso({ ...opts, tipoMenu: 'Lateral', usuario: userData })
      .then(goTo)
      .catch(goTo);
  };

  if (loading) {
    return <div className={styles.menuLateral}>Cargando...</div>;
  }

  return (
    <div className={styles.menuLateral}>
      {banner &&
        (banner.link ? (
          <a href={banner.link} download className={styles.bannerLink}>
            <img src={banner.imageUrl} alt="" className={styles.bannerImg} />
          </a>
        ) : (
          <img src={banner.imageUrl} alt="" className={styles.bannerImg} />
        ))}

      <ul className={styles.menuList}>
        {items.map((item, index) => {
          const hasChildren = item.children.length > 0;

          // Ítem sin hijos: link directo (equivalente al "if" del código viejo)
          if (!hasChildren) {
            return (
              <li key={item.url || item.title} className={styles.leafItem}>
                <a
                  href={item.url}
                  onClick={(evt) =>
                    handleClick(evt, {
                      botonId: String(index),
                      urlNav: item.url,
                      textoBoton: item.title,
                      pilar: item.title,
                    })
                  }
                >
                  {item.title}
                </a>
              </li>
            );
          }

          // Ítem con hijos: título en negrita (clickeable) + lista de hijos
          const visibleChildren = item.children.filter(
            (child) =>
              !(
                child.title === restrictedLinkTitle &&
                isRestrictedGroup &&
                currentSiteSegment === restrictedSiteSegment
              )
          );

          return (
            <React.Fragment key={item.url || item.title}>
              <li className={styles.parentItem}>
                <a
                  href={item.url}
                  onClick={(evt) =>
                    handleClick(evt, {
                      botonId: String(index),
                      urlNav: item.url,
                      textoBoton: item.title,
                      pilar: item.title,
                    })
                  }
                >
                  {item.title}
                </a>
              </li>
              <ul className={styles.childList}>
                {visibleChildren.map((child, childIndex) => (
                  <li key={child.url || child.title} className={styles.childItem}>
                    <a
                      href={child.url}
                      onClick={(evt) =>
                        handleClick(evt, {
                          botonId: `${index}-${childIndex}`,
                          urlNav: child.url,
                          textoBoton: child.title,
                          pilar: item.title,
                        })
                      }
                    >
                      {child.title}
                    </a>
                  </li>
                ))}
              </ul>
            </React.Fragment>
          );
        })}
      </ul>
    </div>
  );
};

export default MenuLateral;
