import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ConnectionService } from 'ng-connection-service';
import Swal from 'sweetalert2';

@Injectable()
export class NoInternetInterceptor implements HttpInterceptor {
  isConnected = true;
    constructor(
      private connectionService: ConnectionService) {
      this.connectionService.monitor().subscribe(isConnected => {
        this.isConnected = isConnected;
      });
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      // Check if there is no internet
      if (!this.isConnected) {
        Swal.fire('You are offline', 'Please check your internet', 'error');
      } else {
        return next.handle(request);
      }
    }
}
