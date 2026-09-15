import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import Navbar from './components/Navbar';
import { INavbarProps } from './components/INavbarProps';
import { spfi, SPFx, SPFI } from '@pnp/sp';

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/profiles";

export interface INavbarWebPartProps {
  backendSiteUrl: string;
}

export default class NavbarWebPart extends BaseClientSideWebPart<INavbarWebPartProps> {

  private sp: SPFI;

  public render(): void {
    const element: React.ReactElement<INavbarProps> = React.createElement(
      Navbar,
      {
        siteUrl: this.context.pageContext.web.absoluteUrl,

        // Ya NO sale de context.pageContext.site.absoluteUrl (ese sería el
        // sitio moderno donde vive el webpart). Ahora lo carga el usuario a
        // mano desde el panel de propiedades, apuntando al sitio clásico
        // que tiene la Navegación Global de verdad.
        // Si el campo del panel de propiedades está vacío, usamos el sitio
        // actual como default — así cada instancia del webpart decide:
        // vacío = busca en este mismo sitio; completo = busca en el backend indicado.
        backendSiteUrl: (
          this.properties.backendSiteUrl || this.context.pageContext.web.absoluteUrl
        ).replace(/\/$/, ''),

        sp: this.sp
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context));
    return Promise.resolve();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
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
          header: { description: 'Navbar Gador' },
          groups: [
            {
              groupName: 'General',
              groupFields: [
                PropertyPaneTextField('backendSiteUrl', {
                  label: 'URL del sitio backend (ej: https://tuempresa.sharepoint.com/sites/QARRHH)'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}