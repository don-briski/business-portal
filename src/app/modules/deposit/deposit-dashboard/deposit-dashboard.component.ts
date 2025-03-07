import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { AuthService } from 'src/app/service/auth.service';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { ConfigurationService } from 'src/app/service/configuration.service';
import { TokenRefreshErrorHandler } from 'src/app/service/TokenRefreshErrorHandler';
import { UserService } from 'src/app/service/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deposit-dashboard',
  templateUrl: './deposit-dashboard.component.html',
  styleUrls: ['./deposit-dashboard.component.scss']
})
export class DepositDashboardComponent implements OnInit, OnDestroy{
  
  dashboardData: any[] = [];
  ownerInformation = {};
  currentuser: any;
  public loggedInUser: any;
  
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  constructor(
    private configurationService: ConfigurationService, 
    private userService: UserService,
    public authService: AuthService, 
    private router: Router,
    private colorThemeService: ColorThemeService
  ) { }

  ngOnInit(): void {
    
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', 'Please log in', 'error');
    }

    this.getUserPromise().then(next => {
      $(document).ready(() => {
        $.getScript('assets/js/script.js');
      });
      this.getDashboardData();
      this.getOwnerInformation();
    }).catch(err => {

    });
  }


  
  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }


  getDashboardData() {
    
  }

  getOwnerInformation() {
    this.configurationService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    }, error => { });
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(user => {
        this.currentuser = user.body;
        resolve(user);
      }, err => {
        reject(err.error);
      });
    });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

}
