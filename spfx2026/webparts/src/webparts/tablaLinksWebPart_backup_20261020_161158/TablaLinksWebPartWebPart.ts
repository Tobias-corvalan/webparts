import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy
} from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';

import * as strings from 'TablaLinksWebPartWebPartStrings';
import TablaLinksWebPart from './components/TablaLinksWebPart';
import { ITablaLinksWebPartProps } from './components/ITablaLinksWebPartProps';

export interface ITablaLinksWebPartWebPartProps {
  tituloSeccion1: string;
  lista1: string;
  tituloSeccion2: string;
  lista2: string;
  backendSiteUrl: string;
}

export default class TablaLinksWebPartWebPart extends BaseClientSideWebPart<ITablaLinksWebPartWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ITablaLinksWebPartProps> = React.createElement(
      TablaLinksWebPart,
      {
        tituloSeccion1: this.properties.tituloSeccion1,
        lista1: this.properties.lista1,
        tituloSeccion2: this.properties.tituloSeccion2,
        lista2: this.properties.lista2,
        backendSiteUrl: this.properties.backendSiteUrl,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const siteUrl = this.properties.backendSiteUrl || this.context.pageContext.web.absoluteUrl;

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
                PropertyPaneTextField('backendSiteUrl', {
                  label: strings.BackendSiteUrlFieldLabel,
                  placeholder: "https://contoso.sharepoint.com/sites/ejemplo"
                }),
                PropertyPaneTextField('tituloSeccion1', {
                  label: strings.TituloSeccion1Label
                }),
                PropertyFieldListPicker('lista1', {
                  label: strings.Lista1Label,
                  selectedList: this.properties.lista1,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  baseTemplate: 100,
                  webAbsoluteUrl: siteUrl,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  onGetErrorMessage: undefined,
                  deferredValidationTime: 0,
                  key: 'tablaLinksLista1FieldId'
                }),
                PropertyPaneTextField('tituloSeccion2', {
                  label: strings.TituloSeccion2Label
                }),
                PropertyFieldListPicker('lista2', {
                  label: strings.Lista2Label,
                  selectedList: this.properties.lista2,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  baseTemplate: 100,
                  webAbsoluteUrl: siteUrl,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  onGetErrorMessage: undefined,
                  deferredValidationTime: 0,
                  key: 'tablaLinksLista2FieldId'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
