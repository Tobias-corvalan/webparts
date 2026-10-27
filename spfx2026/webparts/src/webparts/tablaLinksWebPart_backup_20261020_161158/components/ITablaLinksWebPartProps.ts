import { SPHttpClient } from "@microsoft/sp-http";

export interface ITablaLinksWebPartProps {
  tituloSeccion1: string;
  lista1: string;
  tituloSeccion2: string;
  lista2: string;
  backendSiteUrl: string;
  spHttpClient: SPHttpClient;
  siteUrl: string;
}
