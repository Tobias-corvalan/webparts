import { SPHttpClient } from "@microsoft/sp-http";

export interface ITablaDocProps {
  description: string;
  spHttpClient: SPHttpClient;
  siteUrl: string;
  backendSiteUrl: string;
  biblioteca: string;
}
