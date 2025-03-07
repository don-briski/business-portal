import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { takeUntil } from 'rxjs/operators';

import { UserService } from '../../../service/user.service';
import { AuthService } from '../../../service/auth.service';
import { InvestmentService } from '../../../service/investment.service';
import { ConfigurationService } from '../../../service/configuration.service';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';
import { ShortTermPlacementService } from 'src/app/service/shorttermplacement.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-short-term-placement-activation-page',
  templateUrl: './short-term-placement-activation-page.component.html',
  styleUrls: ['./short-term-placement-activation-page.component.scss']
})
export class ShortTermPlacementActivationPageComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();
  public user: any;
  public ShortTermPlacementActivationForm: UntypedFormGroup = null;

  public loader = false;
  public approvalStatuses = null;
  public shortTermPlacement = null;

  public startDateNotification: string = null;
  public showStartDateNotification: boolean = false;


  @Input() shortTermPlacementId: number;
  @Output('fetchShortTermPlacements') fetchShortTermPlacements: EventEmitter<any> = new EventEmitter();

  public StpTypes = {

    ShortTermPlacementTypeList: [
        "Core",
        "FixedDeposit"
    ],

    ShortTermPlacementTenorPeriodList: [
        "Day",
        "Month",
        "Year"
    ],

    ShortTermPlacementInterestCycleList: [
        "Daily",
        "Monthly",
        "Annually"
    ],

    ShortTermPlacementApprovalStatusList: [
        "Approved",
        "Declined",
        "Pending",
        "Rework"
    ],

    ShortTermPlacementInterestTypeList: [
        "Compound",
        "Flat"
    ],

    ShortTermPlacementStatusList: [
        "Inactive",
        "Active",
        "Matured",
        "Liquidated"
    ],

    ShortTermPlacementCompoundingCycleList: [
        "Annually",
        "Monthly",
        "Daily"
    ],

    ShortTermPlacementMaturityActionList: [
        "Manual",
        "AutomaticFullLiquidation",
        "AutomaticFullRollOver"
    ],

    ShortTermPlacementManualLiquidationEnumList: [
        "FullLiquidation",
        "FullRollover",
        "PartialLiquidation"
    ]
  }
  currencySymbol: string;

  StartDateNotification = '';
  loggedInUser: any;
  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    private invService: InvestmentService,
    private stpService: ShortTermPlacementService,
    private configService: ConfigurationService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router
  ) { }

  ngOnInit() {
    this.getCurrencySymbol();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', 'Please log in', 'error');
    }
    this.tokenRefreshError.tokenNeedsRefresh
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (res) => {
        if (!res) {
         // this.httpFailureError = true;
        }
      }
    );

    this.fetchUserInfo();
    this.setupShortTermPlacementActivationForm();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
}

  setupShortTermPlacementActivationForm() {
    this.stpService.fetchShortTermPlacement(this.shortTermPlacementId)
    .pipe(takeUntil(this.unsubscriber$))
      .subscribe(res => {
        this.shortTermPlacement = res.body;
        this.ShortTermPlacementActivationForm = new UntypedFormGroup({
          ShortTermPlacementId: new UntypedFormControl(this.shortTermPlacementId, [Validators.required]),
          StartDate: new UntypedFormControl(null, [Validators.required])
        });
      }, err => {});
  }

  fetchUserInfo() {
    this.userService.getUserInfo(this.authService.decodeToken().nameid)
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      response => {
        this.user = response.body;
      },
      err => {
      },
    );
  }



  activateShortTermPlacement(val: any) {
    // this.formSubmitted = true;
    if (this.ShortTermPlacementActivationForm.valid) {
      this.loader = true;
      let data = this.ShortTermPlacementActivationForm.value;
      this.stpService.activateShortTermPlacement(data)
      .pipe(takeUntil(this.unsubscriber$))
        .subscribe(res => {
          this.fetchShortTermPlacements.emit();
          Swal.fire('Success', "Ok" , 'success');
          this.closeModal();
          this.loader = false;
        }, err => {
          let errstr = "";
          err.errors.forEach(e => {
            errstr += e + '\n';
          });
          this.loader = false;
          Swal.fire('Error', errstr, 'error');
      });

    }
    this.loader = false;
  }

  openModal(content) {
    this.modalService.open(content, {backdrop: 'static', size: 'lg', centered: true});
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  ymdDate(date: Date) {
    let y = date.getFullYear();
    let month = date.getMonth() + 1;
    let m = (month > 10) ? month : `0${month}`;
    let day = date.getDate();
    let d = (day > 10) ? day : `0${day}`;
    return `${y}-${m}-${d}`;
  }

  onStartDateChange(val) {
    try {
      var today = new Date();
      var startDate = new Date(val);
      if (startDate < today) {
        this.showStartDateNotification = true;
        this.startDateNotification = "Note that you have set this short term placement to some time in the past";
      } else {
        this.showStartDateNotification = false;
        this.startDateNotification = null;

      }
    } catch (error) {
      this.showStartDateNotification = false;
      this.startDateNotification = null;
    }
  }

  camelPad(str){ return str
    // Look for long acronyms and filter out the last letter
    .replace(/([A-Z]+)([A-Z][a-z])/g, ' $1 $2')
    // Look for lower-case letters followed by upper-case letters
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    // Look for lower-case letters followed by numbers
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/^./, function(str){ return str.toUpperCase(); })
    // Remove any white space left around the word
    .trim();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
