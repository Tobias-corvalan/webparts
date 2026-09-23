declare interface IOrganigramaWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  BackendSiteUrlFieldLabel: string;
  ListFieldLabel: string;
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

declare module 'OrganigramaWebPartStrings' {
  const strings: IOrganigramaWebPartStrings;
  export = strings;
}
