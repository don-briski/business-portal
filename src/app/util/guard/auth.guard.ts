import { Injectable, Output, EventEmitter, Directive } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute, CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Base64 } from 'js-base64';
import { RolecheckModalComponent } from '../rolecheck-modal/rolecheck-modal.component';

@Directive()
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  path: ActivatedRouteSnapshot[];
  route: ActivatedRouteSnapshot;
  @Output() pageRefreshEvent: EventEmitter<any> = new EventEmitter();
  @Output() destination: EventEmitter<any> = new EventEmitter();
  constructor(private authService: AuthService, private router: Router, private modalService: NgbModal, config: NgbModalConfig) {
    config.backdrop = 'static';
    // config.keyboard = false;
  }

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    // is user token available?
    this.authService.previousUrl = state.url;
    const token = sessionStorage.getItem('token');
    if (token) {
      // Role check
      const type = sessionStorage.getItem('type');
      const roleString = Base64.decode(type);
      const role: any[] = roleString.split(':');
      if (role[0] !== 'Staff') {
        this.modalService.open(RolecheckModalComponent, { centered: true });
        return false;
      }
      // has token expired?
      // allow access but token refresh event will catch the 403 error
      if (!this.authService.loggedIn(token)) {
        this.destination.emit(state.url);
        this.pageRefreshEvent.emit(false);
        return true;
      }
    }

    if (this.authService.loggedIn(token)) {
      return true;
    }

      this.router.navigate(['/account/login']);
    // const appOwnerKey = sessionStorage.getItem('appOwnerPublicKey');
    // this.router.navigateByUrl(`/account/login/${appOwnerKey}`, /* Removed unsupported properties by Angular migration: queryParams. */ {});
    return false;
  }

}
