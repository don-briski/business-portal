import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenSessionComponent } from '../util/token-session/token-session.component';
import Swal from 'sweetalert2';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(public dialog: MatDialog) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const account = 'auth';
    return next.handle(request).pipe(catchError(err => {
      if ([401].indexOf(err.status) !== -1) {
        this.loadModal();

        return throwError(err);
      } else if ([403].indexOf(err.status) !== -1) {
        const error: string = err.error || err.error.message || err.statusText || err || err.message;
        Swal.fire({ type: 'error', title: 'Error', text: error });
        return throwError(err);
      } else if ([504].indexOf(err.status) !== -1) {
        const errorMessage = 'Your request is taking longer than usual to get a response.';
        Swal.fire({ type: 'info', title: 'Request time out', text: errorMessage, allowEscapeKey: false, allowOutsideClick: false, confirmButtonText: 'View transaction progress' }).then((result) => {
          window.location.reload();
        })
        return throwError(err);
      } else {
        const error: string = err.Message || err.error.Message || err.error.message ||err.error || err.statusText || err;

        if((request.url.search(account) === -1) && typeof error === "string") {
          Swal.fire({ type: 'error', title: 'Error', text: error });
        }

        if((request.url.search(account) === -1) && typeof error === "object" && err.status === 500) {

          Swal.fire({ type: 'error', title: 'Error', text: 'Something went wrong!!!' });
        }

        if (err?.error?.errors?.length > 0) {
          let errors = "";
          err?.error?.errors?.forEach(error => errors +=`<p class="mb-2">${error}</p>`);
          Swal.fire({ type: 'error', title: 'Error', html:`${errors}` });
        }
        return throwError(err);
      }

    }));
  }

  loadModal() {
    // Open password dialog component
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '35%';
    dialogConfig.disableClose = true;
    Swal.close();
    if (this.dialog.openDialogs.length === 0) {
      this.dialog.open(TokenSessionComponent, dialogConfig);
    }
  }
}
