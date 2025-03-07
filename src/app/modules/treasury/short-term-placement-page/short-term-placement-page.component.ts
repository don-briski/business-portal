import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
import { StpTypes } from "./../stptypes";
import { FinancialInstitutionService } from 'src/app/service/financialinstitution.service';

@Component({
  selector: 'app-short-term-placement-page',
  templateUrl: './short-term-placement-page.component.html',
  styleUrls: ['./short-term-placement-page.component.scss']
})
export class ShortTermPlacementPageComponent implements OnInit {
  public user: any;
  public ShortTermPlacementForm: UntypedFormGroup = null;

  public shortTermPlacement = null;
  public loader = false;
  public selectedInterestType = "Flat";
  public selectedType = null;

  public formSubmitted = false;
  @Input() edit: any;
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
  financialInstitutions = [];
  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    private stpService: ShortTermPlacementService,
    private configService: ConfigurationService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private finService: FinancialInstitutionService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', 'Please log in', 'error');
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe(
      (res) => {
        if (!res) {
          // this.httpFailureError = true;
        }
      }
    );
    this.getAllFinancialInstitutions();
    this.fetchUserInfo();
    this.setupShortTermPlacementForm();
  }

  setupShortTermPlacementForm() {
    if (this.edit) {
      this.stpService.fetchShortTermPlacement(this.shortTermPlacementId)
        .subscribe(res => {
          this.shortTermPlacement = res.body;

          this.ShortTermPlacementForm = new UntypedFormGroup({
            ShortTermPlacementId: new UntypedFormControl(this.shortTermPlacement.shortTermPlacementId, [Validators.required]),
            Type: new UntypedFormControl(this.shortTermPlacement.type, [Validators.required]),
            TenorPeriod: new UntypedFormControl(this.shortTermPlacement.tenorPeriod, [Validators.required]),
            Tenor: new UntypedFormControl(this.shortTermPlacement.tenor, [Validators.required, Validators.min(1)]),

            InterestRate: new UntypedFormControl(this.shortTermPlacement.interestRate, [Validators.required]),
            InterestType: new UntypedFormControl(this.shortTermPlacement.interestType, [Validators.required]),

            Principal: new UntypedFormControl(this.shortTermPlacement.principal, [Validators.required, Validators.min(1)]),
            MaturityAction: new UntypedFormControl(this.shortTermPlacement.maturityAction),
            PreLiquidationCharge: new UntypedFormControl(this.shortTermPlacement.preLiquidationCharge),

            FinancialInstitutionId: new UntypedFormControl(this.shortTermPlacement.financialInstitutionId)
          });
          this.switchSTPType(this.shortTermPlacement.type);
          this.switchShortTermPlacementInterestType(this.shortTermPlacement.interestType);
        }, err => { });
    } else {
      this.ShortTermPlacementForm = new UntypedFormGroup({
        Type: new UntypedFormControl(null, [Validators.required]),
        TenorPeriod: new UntypedFormControl(null, [Validators.required]),
        Tenor: new UntypedFormControl(null, [Validators.required, Validators.min(1)]),

        InterestRate: new UntypedFormControl(null, [Validators.required]),
        InterestType: new UntypedFormControl(null, [Validators.required]),

        Principal: new UntypedFormControl(null, [Validators.required, Validators.min(1)]),
        MaturityAction: new UntypedFormControl('Manual'),
        PreLiquidationCharge: new UntypedFormControl(0),

        FinancialInstitutionId: new UntypedFormControl(null)
      });
    }
  }

  fetchUserInfo() {
    this.userService.getUserInfo(this.authService.decodeToken().nameid).subscribe(
      response => {
        this.user = response.body;

      },
      err => {

      },
    );
  }

  switchShortTermPlacementInterestType(val) {
    this.selectedInterestType = val;
  }

  switchSTPType(val) {
    this.selectedType = val;
    if (val == 'Core') {
      this.ShortTermPlacementForm.controls['PreLiquidationCharge'].setValue(null);
    }
  }

  saveShortTermPlacementForm(val: any) {
    this.formSubmitted = true;
    if (this.edit) {
      if (this.ShortTermPlacementForm.valid) {
        this.loader = true;
        this.stpService.editShortTermPlacement(this.ShortTermPlacementForm.value)
          .subscribe(res => {
            this.loader = false;
            this.fetchShortTermPlacements.emit();
            Swal.fire('Success', "Ok", 'success');
            this.closeModal();
          }, err => {
            this.loader = false;
            let errstr = "";
            err.error.errors.forEach(e => {
              errstr += e + '\n';
            });
            Swal.fire('Error', errstr, 'error');
          });
      }
    } else {
      if (this.ShortTermPlacementForm.valid) {
        this.loader = true;
        this.stpService.addShortTermPlacement(this.ShortTermPlacementForm.value)
          .subscribe(res => {
            this.loader = false;
            this.fetchShortTermPlacements.emit();
            Swal.fire('Success', "Ok", 'success');
            this.closeModal();
          }, err => {
            this.loader = false;
            let errstr = "";
            err.error.errors.forEach(e => {
              errstr += e + '\n';
            });
            Swal.fire('Error', errstr, 'error');
          });
      }
    }

  }

  openModal(content) {
    this.modalService.open(content, { backdrop: 'static', size: 'lg', centered: true });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  getAllFinancialInstitutions() {
    this.finService.getAll().subscribe(res => {
      this.financialInstitutions = res.body;
    }, err => {});
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
}
