import {SPHttpClient} from '@microsoft/sp-http'
import { SPFI } from '@pnp/sp';

export interface IFaqProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  listName: string;
  sp: SPFI;//se declaro aca y arriba se cambio el listitle por id

  spHttpClient: SPHttpClient;
  siteUrl: string;
  backendSiteUrl: string;
}
