import {SPHttpClient} from  '@microsoft/sp-http'
import { SPFI } from '@pnp/sp';

export interface IHelloWorldProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  listName: string;
   sp: SPFI;
   siteUrl: string;
   spHttpClient: SPHttpClient;
  backendSiteUrl: string
}
