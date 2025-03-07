import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { UserService } from "../../../service/user.service";
import { AuthService } from "../../../service/auth.service";
import { InvestmentService } from "../../../service/investment.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";

@Component({
  selector: "app-short-term-placement-liquidation-page",
  templateUrl: "./short-term-placement-liquidation-page.component.html",
  styleUrls: ["./short-term-placement-liquidation-page.component.scss"],
})
export class ShortTermPlacementLiquidationPageComponent implements OnInit {
  unsubscriber$ = new Subject<void>();
  public user: any;
  public ShortTermPlacementLiquidationForm: UntypedFormGroup = null;

  public loader = false;
  public approvalStatuses = null;
  public shortTermPlacement = null;
  public stpGrossPayout = null;
  public stpNetPayout = null;
  public stpMaturityActions = [
    "FullLiquidation",
    "FullRollover",
    "PartialLiquidation",
  ];
  public maturityActionMap = {
    Manual: "PartialLiquidation",
    AutomaticFullLiquidation: "FullLiquidation",
    AutomaticFullRollOver: "FullRollover",
  };
  public selectedMaturityAction = null;

  @Input() shortTermPlacementId: number;
  @Output("fetchShortTermPlacements")
  fetchShortTermPlacements: EventEmitter<any> = new EventEmitter();
  currencySymbol: string;

  public StpTypes = {
    ShortTermPlacementTypeList: ["Core", "FixedDeposit"],

    ShortTermPlacementTenorPeriodList: ["Day", "Month", "Year"],

    ShortTermPlacementInterestCycleList: ["Daily", "Monthly", "Annually"],

    ShortTermPlacementApprovalStatusList: [
      "Approved",
      "Declined",
      "Pending",
      "Rework",
    ],

    ShortTermPlacementInterestTypeList: ["Compound", "Flat"],

    ShortTermPlacementStatusList: [
      "Inactive",
      "Active",
      "Matured",
      "Liquidated",
    ],

    ShortTermPlacementCompoundingCycleList: ["Annually", "Monthly", "Daily"],

    ShortTermPlacementMaturityActionList: [
      "Manual",
      "AutomaticFullLiquidation",
      "AutomaticFullRollOver",
    ],

    ShortTermPlacementManualLiquidationEnumList: [
      "FullLiquidation",
      "FullRollover",
      "PartialLiquidation",
    ],
  };

  StartDateNotification = "";
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
  ) {}

  ngOnInit() {
    this.getCurrencySymbol();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.tokenRefreshError.tokenNeedsRefresh
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe((res) => {
      if (!res) {
        // this.httpFailureError = true;
      }
    });

    this.fetchUserInfo();
    this.setupShortTermPlacementLiquidationForm();
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

  setupShortTermPlacementLiquidationForm() {
    this.stpService
      .fetchShortTermPlacement(this.shortTermPlacementId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.shortTermPlacement = res.body;
          if (this.shortTermPlacement.interestType == "Flat") {
            this.stpGrossPayout =
              this.shortTermPlacement.principal +
              this.shortTermPlacement.interestAccrued;
          } else {
            // Compound
            this.stpGrossPayout =
              this.shortTermPlacement.compoundingCurrentPrincipal;
          }
          this.stpNetPayout =
            this.stpGrossPayout -
            Number(this.shortTermPlacement.preLiquidationCharge);
          this.selectedMaturityAction =
            this.maturityActionMap[this.shortTermPlacement.maturityAction];

          this.ShortTermPlacementLiquidationForm = new UntypedFormGroup({
            ShortTermPlacementId: new UntypedFormControl(this.shortTermPlacementId, [
              Validators.required,
            ]),
            MaturityAction: new UntypedFormControl(this.selectedMaturityAction, [
              Validators.required,
            ]),
            LiquidationAmount: new UntypedFormControl(null, [Validators.min(1)]),
          });
        },
        (err) => {}
      );
  }

  fetchUserInfo() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.user = response.body;
        },
        (err) => {}
      );
  }

  liquidateShortTermPlacement(val: any) {
    if (val.LiquidationAmount > this.stpNetPayout) {
      Swal.fire("Error", "Amount cannot be greater than net payout", "error");
      return;
    }

    if (this.ShortTermPlacementLiquidationForm.valid) {
      this.loader = true;
      let data = this.ShortTermPlacementLiquidationForm.value;
      this.stpService.liquidateShortTermPlacement(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.fetchShortTermPlacements.emit();
          Swal.fire("Success", "Ok", "success");
          this.closeModal();
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          let errstr = "";
          err.errors.forEach((e) => {
            errstr += e + "\n";
          });

          Swal.fire("Error", errstr, "error");
        }
      );
    }
  }

  switchMaturityAction(val) {
    this.selectedMaturityAction = val;
    if (this.selectedMaturityAction != "PartialLiquidation") {
      this.ShortTermPlacementLiquidationForm.controls[
        "LiquidationAmount"
      ].patchValue(null);
    }
  }

  openModal(content) {
    this.modalService.open(content, {
      backdrop: "static",
      size: "lg",
      centered: true,
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  ymdDate(date: Date) {
    let y = date.getFullYear();
    let month = date.getMonth() + 1;
    let m = month > 10 ? month : `0${month}`;
    let day = date.getDate();
    let d = day > 10 ? day : `0${day}`;
    return `${y}-${m}-${d}`;
  }

  camelPad(str) {
    return (
      str
        // Look for long acronyms and filter out the last letter
        .replace(/([A-Z]+)([A-Z][a-z])/g, " $1 $2")
        // Look for lower-case letters followed by upper-case letters
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        // Look for lower-case letters followed by numbers
        .replace(/([a-zA-Z])(\d)/g, "$1 $2")
        .replace(/^./, function (str) {
          return str.toUpperCase();
        })
        // Remove any white space left around the word
        .trim()
    );
  }
}
