import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { environment } from "src/environments/environment";

declare var gtag: Function;

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
    constructor(private router: Router) {}
  
    public initializeGoogleAnalytics() {
        const apiUrl = environment.apiUrl;
        const urlSegments = apiUrl.split('.');
        
        const isNotProd = urlSegments.includes('dev')
        if (isNotProd) return;
        
        
      this.onRouteChange();
  
      // dynamically add analytics scripts to document head
      try {
        const url = 'https://www.googletagmanager.com/gtag/js?id=';
        const gTagScript = document.createElement('script');      
        gTagScript.async = true;
        gTagScript.src = `${url}${environment.googleAnalyticsId}`;
        document.head.appendChild(gTagScript);
  
        const dataLayerScript = document.createElement('script');
        dataLayerScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${environment.googleAnalyticsId}', {'send_page_view': false});`;
        document.head.appendChild(dataLayerScript);
      } catch (e) {
        console.error('Error adding Google Analytics', e);
      }
    }

    public initializeHotJarAnalytics() {
        const apiUrl = environment.apiUrl;
        const urlSegments = apiUrl.split('.');
        
        const isNotProd = urlSegments.includes('dev')
        if (isNotProd) return;
      
  
      // dynamically add analytics scripts to document head
      try {
        const hotjarScript = document.createElement('script');
        hotjarScript.innerHTML = `
        (function (h, o, t, j, a, r) {
          h.hj =
            h.hj ||
            function () {
              (h.hj.q = h.hj.q || []).push(arguments);
            };
          h._hjSettings = { hjid: 2870050, hjsv: 6 };
          a = o.getElementsByTagName("head")[0];
          r = o.createElement("script");
          r.async = 1;
          r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
          a.appendChild(r);
        })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");`;
        document.head.appendChild(hotjarScript);
      } catch (e) {
        console.error('Error adding Hotjar Analytics', e);
      }
    }
    
  
    // track visited routes
    private onRouteChange() {    
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          gtag('config', environment.googleAnalyticsId, {
            page_path: event.urlAfterRedirects,
          });
        }
      });
    }
  
    // use gtag.js to send Google Analytics Events
    public event(action: string, eventCategory?: string, eventLabel?: string, value?: string) {
      gtag('event', action, {
        ...(eventCategory && { event_category: eventCategory }),
        ...(eventLabel && { event_label: eventLabel }),
        ...(value && { value: value }),
      });
    }
  }