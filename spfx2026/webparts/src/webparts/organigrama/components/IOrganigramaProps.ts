import { SPHttpClient } from '@microsoft/sp-http';

export interface IOrganigramaProps {
  description: string;
  listId: string;
  spHttpClient: SPHttpClient;
  backendSiteUrl: string;
}
