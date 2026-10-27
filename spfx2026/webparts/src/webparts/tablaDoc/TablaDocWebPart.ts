import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy
} from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';

import * as strings from 'TablaDocWebPartStrings';
import TablaDoc from './components/TablaDoc';
import { ITablaDocProps } from './components/ITablaDocProps';

export interface ITablaDocWebPartProps {
  description: string;
  backendSiteUrl: string;
  biblioteca: string;
  modo: "automatico" | "metadatos" | "carpetas" | "archivos";
}

export default class TablaDocWebPart extends BaseClientSideWebPart<ITablaDocWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ITablaDocProps> = React.createElement(
      TablaDoc,
      {
        description: this.properties.description,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        backendSiteUrl: this.properties.backendSiteUrl,
        biblioteca: this.properties.biblioteca,
        modo: this.properties.modo || "automatico"
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
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('backendSiteUrl', {
                  label: strings.BackendSiteUrlFieldLabel
                }),
                PropertyFieldListPicker('biblioteca', {
                  label: strings.BibliotecaFieldLabel,
                  selectedList: this.properties.biblioteca,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  baseTemplate: 101,
                  webAbsoluteUrl: siteUrl,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  onGetErrorMessage: undefined,
                  deferredValidationTime: 0,
                  key: 'tablaDocListPickerFieldId'
                }),
                PropertyPaneDropdown('modo', {
                  label: strings.ModoFieldLabel,
                  options: [
                    { key: 'automatico', text: strings.ModoAutomatico },
                    { key: 'metadatos', text: strings.ModoMetadatos },
                    { key: 'carpetas', text: strings.ModoCarpetas },
                    { key: 'archivos', text: strings.ModoArchivos }
                  ]
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
