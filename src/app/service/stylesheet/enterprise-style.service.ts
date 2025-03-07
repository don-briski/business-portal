import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseStyleService {
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadStylesheet(subdomain: string): void {
    const linkElement = this.renderer.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = `assets/css/enterprise/${subdomain}.min.css`;
    this.renderer.appendChild(document.head, linkElement);
  }
}
