declare interface ITablaDocWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  BackendSiteUrlFieldLabel: string;
  BibliotecaFieldLabel: string;
  ModoFieldLabel: string;
  ModoAutomatico: string;
  ModoMetadatos: string;
  ModoCarpetas: string;
  ModoArchivos: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
}

declare module 'TablaDocWebPartStrings' {
  const strings: ITablaDocWebPartStrings;
  export = strings;
}
