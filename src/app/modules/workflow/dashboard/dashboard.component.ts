import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { exhaustMap, takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { ReportDetailsDateFunctions } from 'src/app/model/ReportDetailsDateFunctions';
import { AuthService } from 'src/app/service/auth.service';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { ConfigurationService } from 'src/app/service/configuration.service';
import { UserService } from 'src/app/service/user.service';
import Swal from 'sweetalert2';
import { WorkflowMetricService } from '../services/workflow-metric.service';
import { WorkflowService } from '../services/workflow.service';
import { GetReqsQueryParams } from '../workflow.types';

@Component({
  selector: 'lnd-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  dashboardData: any[] = [];
  workflowMetricsData: any;
  currentUser: any;
  public loggedInUser: any;
  pendingApprovals: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  ownerInformation: any;
  constructor(
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private workflowMetricService: WorkflowMetricService,
    private workflowService: WorkflowService,
    private configurationService: ConfigurationService
  ) { }

  ngOnInit(): void {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', "Please log in", 'error');
    }

    this.getUserPromise().then(next => {
      $(document).ready(() => {
        $.getScript('assets/js/script.js');
      });
      this.getWorkflowMetricsData();
      this.getApplicationownerinformation();
    }).catch(err => {

    });
  }
  getWorkflowMetricsData() {
    this.workflowMetricService.getWorkflowMetrics()
      .pipe(takeUntil(this.unsubscriber$), exhaustMap((res: any) => {
        this.workflowMetricsData = res?.body;

        const data: GetReqsQueryParams = {
          pageNumber: 1,
          pageSize: 5,
          keyword: '',
          filter: 'InProgress',
        };
        return this.workflowService.getRequests(data)
      }))
      .subscribe(res => {
        this.pendingApprovals = res?.body?.items;
        this.workflowMetricsData.MyApprovals.Count.pending = res?.body?.totalCount || 0;
      })

    
  }
  getWorkflowMetricsFetchModel() {
    const DateFunctions = new ReportDetailsDateFunctions();
    const today = new Date();
    const todayRange = DateFunctions.getTodayRange();
    const monthRange = DateFunctions.getMonthRange();
    const yearRange = DateFunctions.getYearRange();

    const dates = {
      todayStartDate: todayRange[0],
      todayEndDate: todayRange[1],
      monthStartEndDate: monthRange[0],
      monthEndEndDate: monthRange[1],
      yearStartEndDate: yearRange[0],
      yearEndEndDate: yearRange[1]
    };
    return dates;
  }

  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(user => {
        this.currentUser = user.body;
        resolve(user);
      }, err => {
        reject(err.error);
      });
    });
  }

  getApplicationownerinformation() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      }
    );
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

}
