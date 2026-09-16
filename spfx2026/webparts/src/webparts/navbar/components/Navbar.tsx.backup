import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './Navbar.module.scss';
import type { INavbarProps } from './INavbarProps';
import { IMainNavItem } from './services/SiteNavigationService';
import { SiteNavigationService } from './services/SiteNavigationService';
import { UsageService, IUserData } from './services/UsageService';

const Navbar: React.FC<INavbarProps> = ({ sp, siteUrl, backendSiteUrl }) => {
  const [menu, setMenu] = useState<IMainNavItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<IUserData>({
    legajo: 'No Registrado',
    email: '',
    direccion: 'No Registrado',
    sector: 'No Registrado',
    nombre: 'No Registrado',
  });

  // Trae el menú desde la navegación nativa de SharePoint (Global + Quick Launch por subsitio)
  // del sitio BACKEND (no del sitio donde vive el webpart).
  useEffect(() => {
    // Se vacía primero para no dejar el menú de una configuración anterior
    // pegado en pantalla mientras carga, o si backendSiteUrl cambia a algo vacío.
    setMenu([]);

    if (!backendSiteUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const navService = new SiteNavigationService(backendSiteUrl);
    void navService
      .getNavigation()
      .then((data) => setMenu(data))
      .catch((err) => console.error('Error cargando navegación:', err))
      .then(() => setLoading(false));
  }, [backendSiteUrl]);

  // Trae el perfil del usuario una sola vez, para usarlo en cada registro de click
  useEffect(() => {
    const usageService = new UsageService(sp);
    void usageService.getCurrentUser().then((data) => setUserData(data));
  }, [sp]);

  // Cierra el dropdown y el buscador al hacer click fuera de la navbar
  useEffect(() => {
    const handleClickOutside = (evt: MouseEvent): void => {
      if (navRef.current && !navRef.current.contains(evt.target as Node)) {
        setOpenIndex(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pone el foco en el input apenas se abre el buscador
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const toggleItem = (index: number): void => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  // Compara la URL actual contra el link del ítem (equivalente a
  // urlSitio.indexOf(items[i].SimpleUrl) del código clásico).
  const isActive = (link: string): boolean => {
    if (!link || link === '#') {
      return false;
    }
    try {
      const linkPath = new URL(link, siteUrl).pathname.toLowerCase();
      return window.location.pathname.toLowerCase().indexOf(linkPath) !== -1;
    } catch {
      return false;
    }
  };

  // Registra el click en "Registro De Uso" y recién ahí navega.
  const handleNavClick = (
    evt: React.MouseEvent<HTMLAnchorElement>,
    opts: { botonId: string; urlNav: string; textoBoton: string; pilar: string; tipoMenu: 'Superior' | 'Submenu' }
  ): void => {
    evt.preventDefault();
    const usageService = new UsageService(sp);
    const goTo = (): void => {
      // Los links de los pilares/submenús vienen relativos al sitio BACKEND,
      // no al sitio donde vive el webpart — por eso se resuelve el origin
      // contra backendSiteUrl acá, no contra siteUrl.
      const origin = new URL(backendSiteUrl).origin;
      window.location.href = opts.urlNav.startsWith('http')
        ? opts.urlNav
        : `${origin}${opts.urlNav}`;
    };
    void usageService
      .registrarUso({ ...opts, usuario: userData })
      .then(goTo)
      .catch(goTo);
  };

  const runSearch = (): void => {
    const term = searchTerm.trim();
    if (!term) {
      return;
    }
    const base = (siteUrl || '').replace(/\/$/, '');
    window.location.href = `${base}/_layouts/15/search.aspx?q=${encodeURIComponent(term)}`;
  };

  const handleSearchKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>): void => {
    if (evt.key === 'Enter') {
      runSearch();
    } else if (evt.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  return (
    <div className={styles.navBar} ref={navRef}>
      <a href={siteUrl} className={styles.brand}>
        <span className={styles.brandText}>Gador</span>
      </a>

      <div className={styles.navCenter}>
        <ul className={styles.navList}>
        <li className={styles.navItem}>
          <a
            href={siteUrl}
            className={`${styles.navLink} ${isActive(siteUrl) ? styles.navLinkActive : ''}`}
            onClick={(evt) =>
              handleNavClick(evt, {
                botonId: 'inicio',
                urlNav: siteUrl,
                textoBoton: 'INICIO',
                pilar: 'INICIO',
                tipoMenu: 'Superior',
              })
            }
          >
            INICIO
          </a>
        </li>

        {loading && <li className={styles.navItem}>Cargando...</li>}

        {!loading && !backendSiteUrl && (
          <li className={styles.navItem}>
            Falta configurar la URL del sitio backend en las propiedades del webpart.
          </li>
        )}

        {!loading &&
          menu.map((item, index) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openIndex === index;
            return (
              <li
                key={item.url || item.title}
                className={`${styles.navItem} ${isOpen ? styles.open : ''}`}
              >
                <span className={styles.navLinkWrapper}>
                  <a
                    href={item.url}
                    className={`${styles.navLink} ${isActive(item.url) ? styles.navLinkActive : ''}`}
                    onClick={(evt) =>
                      handleNavClick(evt, {
                        botonId: String(index),
                        urlNav: item.url,
                        textoBoton: item.title,
                        pilar: item.title,
                        tipoMenu: 'Superior',
                      })
                    }
                  >
                    {item.title.toUpperCase()}
                  </a>
                  {hasChildren && (
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      aria-expanded={isOpen}
                      aria-label={`Mostrar submenú de ${item.title}`}
                      onClick={() => toggleItem(index)}
                    >
                      <span
                        className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
                      />
                    </button>
                  )}
                </span>

                {hasChildren && isOpen && (
                  <ul className={styles.subMenu}>
                    {item.children.map((sub) => (
                      <li key={sub.url || sub.title} className={styles.subMenuItem}>
                        <a
                          href={sub.url}
                          className={styles.subMenuLink}
                          onClick={(evt) =>
                            handleNavClick(evt, {
                              botonId: `${index}-${sub.url}`,
                              urlNav: sub.url,
                              textoBoton: sub.title,
                              pilar: item.title,
                              tipoMenu: 'Submenu',
                            })
                          }
                        >
                          {sub.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

      </ul>
      </div>

      <div className={styles.searchArea}>
        {searchOpen ? (
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(evt) => setSearchTerm(evt.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        ) : null}
        <button
          type="button"
          className={styles.searchBtn}
          aria-label="Buscar"
          onClick={() => {
            if (searchOpen) {
              runSearch();
            } else {
              setSearchOpen(true);
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5.25" stroke="white" strokeWidth="1.5" />
            <line x1="11.1" y1="11.1" x2="15" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Navbar;