import * as React from 'react';
import styles from './Footer.module.scss';
import type { IFooterProps } from './IFooterProps';
 
const Footer: React.FC<IFooterProps> = ({ copyrightText, logoUrl, homeUrl }) => {
  // Si no se configura un texto puntual, arma uno con el año actual
  // (en vez de dejar un año fijo hardcodeado, tipo "2020", que queda viejo).
  const currentYear = new Date().getFullYear();
  const text =
    copyrightText && copyrightText.trim().length > 0
      ? copyrightText
      : `Copyright ${currentYear} Gador S.A. Todos los Derechos Reservados.`;
 
  const scrollToTop = (): void => {
    // SharePoint mete el scroll real adentro de un <div> interno generado
    // por Fluent UI, con una clase que cambia entre sesiones/builds — no se
    // puede apuntar a un selector fijo. En cambio, buscamos en el momento
    // del click CUALQUIER elemento que tenga scroll aplicado, y lo llevamos
    // a todos a 0. Es más pesado que un selector directo, pero solo corre
    // cuando el usuario hace click (no en cada scroll), así que no pesa.
    const scrolledElements = Array.from(
      document.querySelectorAll<HTMLElement>('*')
    ).filter((el) => el.scrollTop > 0);
 
    scrolledElements.forEach((el) => {
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        el.scrollTop = 0;
      }
    });
 
    // Fallbacks, por si en algún layout distinto sí es la window/body la que scrollea.
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
 
  return (
    <div className={styles.footerWrapper}>
      <button
        type="button"
        className={styles.scrollTopBtn}
        aria-label="Volver arriba"
        onClick={scrollToTop}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 10L8 5L13 10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
 
      <div className={styles.footerBar}>
        <span className={styles.copyright}>{text}</span>
 
        <a href={homeUrl} className={styles.brand}>
          {logoUrl ? (
            <img src={logoUrl} alt="Gador" className={styles.logoImg} />
          ) : (
            <span className={styles.logoIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="9" height="9" fill="white" />
                <rect x="11" y="0" width="9" height="9" fill="white" opacity="0.5" />
                <rect x="0" y="11" width="9" height="9" fill="white" opacity="0.5" />
                <rect x="11" y="11" width="9" height="9" fill="white" />
              </svg>
            </span>
          )}
          <span className={styles.brandText}>Gador</span>
        </a>
      </div>
    </div>
  );
};
 
export default Footer;