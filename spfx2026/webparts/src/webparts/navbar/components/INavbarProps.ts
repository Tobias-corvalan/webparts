import { SPFI } from '@pnp/sp';

export interface INavbarProps {
  sp: SPFI;

  // Sitio ACTUAL, donde vive el webpart (context.pageContext.web.absoluteUrl).
  // Se usa para "INICIO", la búsqueda, y para saber qué link está activo.
  siteUrl: string;

  // Sitio BACKEND: la raíz de la site collection clásica donde está la
  // Navegación Global de verdad (Información/Gestión/Talento/Buenas Prácticas
  // y sus subsitios). Ya NO sale de context.pageContext.site.absoluteUrl —
  // se configura a mano desde el panel de propiedades del webpart, porque el
  // navbar puede vivir en un sitio moderno completamente distinto.
  backendSiteUrl: string;
}