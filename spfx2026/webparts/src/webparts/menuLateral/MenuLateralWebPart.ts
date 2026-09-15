import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import MenuLateral from './components/MenuLateral';
import { IMenuLateralProps } from './components/IMenuLateralProps';
import { spfi, SPFx, SPFI } from '@pnp/sp';

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/profiles";

export interface IMenuLateralWebPartProps {
  restrictedGroupId: string;     // texto en el property pane, se convierte a number al usarlo
  restrictedSiteSegment: string;
  restrictedLinkTitle: string;
  backendSiteUrl: string;
}

export default class MenuLateralWebPart extends BaseClientSideWebPart<IMenuLateralWebPartProps> {

  private sp: SPFI;

  public render(): void {
    const groupId = parseInt(this.properties.restrictedGroupId, 10);

    const element: React.ReactElement<IMenuLateralProps> = React.createElement(
      MenuLateral,
      {
        sp: this.sp,
        context: this.context,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        // Si el campo del panel de propiedades está vacío, usamos el sitio
        // actual como default — así cada instancia del webpart decide:
        // vacío = busca en este mismo sitio; completo = busca en el backend indicado.
        backendSiteUrl: (
          this.properties.backendSiteUrl || this.context.pageContext.web.absoluteUrl
        ).replace(/\/$/, ''),
        restrictedGroupId: isNaN(groupId) ? undefined : groupId,
        restrictedSiteSegment: this.properties.restrictedSiteSegment || undefined,
        restrictedLinkTitle: this.properties.restrictedLinkTitle || undefined,
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
          header: { description: 'Menú lateral' },
          groups: [
            {
              groupName: 'Regla de "Nuevo Pedido" (opcional)',
              groupFields: [
                PropertyPaneTextField('restrictedGroupId', {
                  label: 'ID del grupo restringido (default 1440)'
                }),
                PropertyPaneTextField('restrictedSiteSegment', {
                  label: 'Segmento de sitio restringido (default GestionMedicamentos)'
                }),
                PropertyPaneTextField('restrictedLinkTitle', {
                  label: 'Título del link a ocultar (default Nuevo Pedido)'
                }),
                PropertyPaneTextField('backendSiteUrl', {
                  label: 'URL del sitio backend',
                  description: 'Sitio SharePoint clásico donde está la navegación lateral, banner y grupos.',
                  placeholder: 'https://gadorlab.sharepoint.com/sites/QARRHH'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}