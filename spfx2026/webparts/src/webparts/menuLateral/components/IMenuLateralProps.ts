import { SPFI } from '@pnp/sp';

export interface IMenuLateralProps {
  sp: SPFI;
  context: any;                    // contexto SPFx para crear el sp contra el backend
  siteUrl: string;                 // web actual (context.pageContext.web.absoluteUrl)
  backendSiteUrl: string;          // sitio clásico donde está la navegación lateral, banner y grupos

  // Regla de negocio puntual heredada del código viejo: oculta un link
  // si el usuario pertenece a cierto grupo Y está parado en cierto subsitio.
  // Quedan configurables por si el día de mañana cambian sin tocar código.
  restrictedGroupId?: number;      // default: 1440
  restrictedSiteSegment?: string;  // default: 'GestionMedicamentos'
  restrictedLinkTitle?: string;    // default: 'Nuevo Pedido'
}