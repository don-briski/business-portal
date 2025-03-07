import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../service/user.service';
import { AuthService } from '../../../service/auth.service';
import { InvestmentService } from '../../../service/investment.service';
import { UntypedFormGroup, UntypedFormControl, Validators, AbstractControl, ValidationErrors, FormBuilder } from '@angular/forms';
import { ConfigurationService } from '../../../service/configuration.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { ShortTermPlacementService } from 'src/app/service/shorttermplacement.service';
import {StpTypes} from "./../stptypes";
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-short-term-placement-approval-page',
  templateUrl: './short-term-placement-approval-page.component.html',
  styleUrls: ['./short-term-placement-approval-page.component.scss']
})
export class ShortTermPlacementApprovalPageComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();
  public user: any;
  public ShortTermPlacementApprovalForm: UntypedFormGroup = null;

  public loader = false;
  public approvalStatuses = null;
  public shortTermPlacement = null;
  currencySymbol: string;

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
    this.setupShortTermPlacementApprovalForm();
    this.approvalStatuses = StpTypes.ShortTermPlacementApprovalStatusList.filter(e => e != "Pending");
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

  setupShortTermPlacementApprovalForm() {
    this.stpService.fetchShortTermPlacement(this.shortTermPlacementId)
    .pipe(takeUntil(this.unsubscriber$))
      .subscribe(res => {
        this.shortTermPlacement = res.body;
        this.ShortTermPlacementApprovalForm = new UntypedFormGroup({
          ShortTermPlacementId: new UntypedFormControl(this.shortTermPlacementId, [Validators.required]),
          Comment: new UntypedFormControl(null),
          Status: new UntypedFormControl(null, [Validators.required])
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



  updateShortTermPlacementApprovalForm(val: any) {
    // this.formSubmitted = true;
    if (this.ShortTermPlacementApprovalForm.valid) {
      this.loader = true;
      this.stpService.updateShortTermPlacementApproval(this.ShortTermPlacementApprovalForm.value)
      .pipe(takeUntil(this.unsubscriber$))
        .subscribe(res => {
          this.fetchShortTermPlacements.emit();
          Swal.fire('Success', "Ok" , 'success');
          this.closeModal();
          this.loader = false;
        }, err => {
          this.loader = false;
        });
    }
  }

  openModal(content) {
    this.modalService.open(content, {backdrop: 'static', size: 'lg', centered: true});
  }

  closeModal() {
    this.modalService.dismissAll();
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
