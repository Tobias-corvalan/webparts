// models/INavModels.ts

export interface ISubMenuItem {
  Id: number;
  Orden: number;
  Menu: string;   // texto que vincula con el Título del item principal (ej: "Informacion")
  Name: string;   // texto visible del link
  Link: string;
}

export interface IMainMenuItem {
  Id: number;
  Title: string;
  Link: string;
  URLImage?: string;
  Description?: string;
  children: ISubMenuItem[];
}
