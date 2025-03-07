import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from "@angular/common/http";
import { Observable, from } from "rxjs";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class JwtTokenInterceptor implements HttpInterceptor {
  // to move token interception here
  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.handleAccess(request, next));
  }

  setCorrelationUuid(request: HttpRequest<any>) {

    const exceptions = [
      'lendax-bucket.s3.eu-west-2.amazonaws.com'
    ]
    const urlHasException = exceptions.some(item => {
      return request.url.includes(item);
    })

    if (urlHasException) return request;
    const uuid = uuidv4();
    return request.clone({
      setHeaders: {
        "x-lenda-correlation-id": uuid,
      },
    });
  }

  private async handleAccess(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Promise<HttpEvent<any>> {
    request = this.setCorrelationUuid(request);
    return await next.handle(request).toPromise();
  }
}
