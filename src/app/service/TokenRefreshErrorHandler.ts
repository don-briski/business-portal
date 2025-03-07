import { Output, EventEmitter, Injectable, Directive } from '@angular/core';
import { TokenSessionComponent } from '../util/token-session/token-session.component';

@Directive()
@Injectable()
export class TokenRefreshErrorHandler {
  @Output() tokenNeedsRefresh: EventEmitter<any> = new EventEmitter();

  public handleError(error) {
    // server side
    // if (error.status === 403) {
    //   this.tokenNeedsRefresh.emit(true);
    // } else {
    //   this.tokenNeedsRefresh.emit(false);
    //   //  return error;
    // }
  }
}
