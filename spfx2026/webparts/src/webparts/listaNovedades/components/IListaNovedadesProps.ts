import { SPHttpClient } from '@microsoft/sp-http';

export interface IListaNovedadesProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;

  // URL del sitio "backend" (el sitio clásico viejo que tiene la lista).
  // Ya NO es el sitio donde corre el webpart — se configura desde el panel
  // de propiedades porque el webpart puede vivir en cualquier sitio moderno.
  backendSiteUrl: string;

  // Ruta relativa al subsitio dentro de backendSiteUrl (ej: "/GP/Novedades").
  subsitePath: string;

  spHttpClient: SPHttpClient;
}