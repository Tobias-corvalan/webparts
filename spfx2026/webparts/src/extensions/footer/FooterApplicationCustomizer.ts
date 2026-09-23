import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Footer from './components/Footer';

const LOG_SOURCE: string = 'FooterApplicationCustomizer';

// Estas son las propiedades que se pueden configurar SIN tocar código,
// editando el ClientSideComponentProperties del elements.xml (o desde
// PnP PowerShell si se agrega la Custom Action a mano). Todas opcionales.
export interface IFooterApplicationCustomizerProperties {
  copyrightText?: string;
  logoUrl?: string;
  homeUrl?: string;
}

export default class FooterApplicationCustomizer
  extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {

  private _bottomPlaceholder: PlaceholderContent | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Inicializando footer de Gador');

    // Si el usuario navega entre páginas sin recargar el navegador (SPA),
    // este evento asegura que el placeholder se vuelva a crear si hiciera falta.
    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);

    this._renderPlaceHolders();

    return Promise.resolve();
  }

  private _renderPlaceHolders(): void {

    // Evita crear el placeholder dos veces si el evento de arriba se dispara
    // más de una vez (por ejemplo, al cambiar de página dentro del mismo sitio).
    if (this._bottomPlaceholder) {
      return;
    }

    this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
      PlaceholderName.Bottom,
      { onDispose: this._onDispose }
    );

    // Algunos layouts de página (muy pocos, páginas muy viejas o ciertos
    // modos de edición) no exponen el placeholder Bottom. En ese caso no
    // hay nada para hacer, pero tampoco tiene que romper la página.
    if (!this._bottomPlaceholder) {
      Log.error(
        LOG_SOURCE,
        new Error('No se pudo crear el placeholder "Bottom" en esta página.')
      );
      return;
    }

    if (this._bottomPlaceholder.domElement) {
      const element: React.ReactElement = React.createElement(Footer, {
        copyrightText: this.properties.copyrightText,
        logoUrl: this.properties.logoUrl,
        homeUrl: this.properties.homeUrl || this.context.pageContext.web.absoluteUrl
      });

      ReactDOM.render(element, this._bottomPlaceholder.domElement);
    }
  }

  private _onDispose(): void {
    Log.info(LOG_SOURCE, 'Footer de Gador removido de la página');
  }
}
