import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import * as strings from 'OrganigramaWebPartStrings';
import Organigrama from './components/Organigrama';
import { IOrganigramaProps } from './components/IOrganigramaProps';


export interface IOrganigramaWebPartProps {
  description: string;
  backendSiteUrl: string;
  listId: string;
}

export default class OrganigramaWebPart extends BaseClientSideWebPart<IOrganigramaWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const backendSiteUrl = this.properties.backendSiteUrl || this.context.pageContext.web.absoluteUrl;

    const element: React.ReactElement<IOrganigramaProps> = React.createElement(
      Organigrama,
      {
        description: this.properties.description,
        listId: this.properties.listId,
        backendSiteUrl,
        spHttpClient: this.context.spHttpClient
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
  if (propertyPath === 'backendSiteUrl' && oldValue !== newValue) {
    this.properties.listId = '';
  }
  super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
}

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('backendSiteUrl', {
                  label: strings.BackendSiteUrlFieldLabel
                }),
                PropertyFieldListPicker('listId', {
                  key: 'listId',
                  label: strings.ListFieldLabel,
                  selectedList: this.properties.listId,
                  includeHidden: false,
                  includeListTitleAndUrl: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  webAbsoluteUrl: this.properties.backendSiteUrl || this.context.pageContext.web.absoluteUrl,
                  baseTemplate: 100
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
