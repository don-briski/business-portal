import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { InvestmentService } from "../../../service/investment.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "../../../service/user.service";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import Swal from "sweetalert2";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { Router } from "@angular/router";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AccordionItem } from "../../shared/shared.types";
import {
  InterestRateType,
  InvestmentType,
} from "../../treasury/types/investment-type.interface";
import { lightenColor } from "../../shared/helpers/generic.helpers";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "app-investmentsetup-page",
  templateUrl: "./investmentsetup-page.component.html",
  styleUrls: ["./investmentsetup-page.component.scss"],
})
export class InvestmentsetupPageComponent implements OnInit {
  public user: any;
  public InvestmentTypeForm: UntypedFormGroup;
  public EditInvestmentTypeForm: UntypedFormGroup;
  public investmentTypes = [];
  loader = false;
  totalRecords = 0;
  filterNum = 10;
  totalPaginate = [];
  searchTerm = "";
  skipNum = 0;
  activePage = 1;
  defaultloader = false;
  httpFailureError = false;
  loggedInUser: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  isSingleView = false;
  investmentType: InvestmentType;
  accordionItems: AccordionItem;
  interestRateType = InterestRateType;
  lightenAmount = 170;
  currencySymbol: string;

  constructor(
    private authService: AuthService,
    private invService: InvestmentService,
    private userService: UserService,
    private modalService: NgbModal,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private readonly configService: ConfigurationService,
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.fetchUserInfo();
    this.CurrencySymbol();
  }

  CurrencySymbol() {
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

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  lightenColor(color: string) {
    return lightenColor(color, this.lightenAmount);
  }

  fetchUserInfo() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
          this.investmentSetupInit();
          this.fetchInvestmentTypes();
          $(document).ready(() => {
            $.getScript("assets/js/script.js");
          });
        },
        (err) => {}
      );
  }

  viewInvestmentType(investmentType: InvestmentType, element?: HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show") {
        this.investmentType = investmentType;
        if (this.investmentType.termsAndConditionsSetupInfo) {
          this.investmentType.termsAndConditionsSetupInfo = JSON.parse(this.investmentType.termsAndConditionsSetupInfo);
        }
        this.accordionItems = {
          invDetails: [
            {
              title: "Investment Name",
              value: this.investmentType?.investmentName,
            },
            {
              title: "Investment Code",
              value: this.investmentType?.investmentCode,
            },
          ],
          fees: [
            {
              title: 'Witholding Tax',
              value: this.investmentType?.withHoldingTax,
              type: 'percentage'
            },
            {
              title: "Penal Charge",
              value: this.investmentType?.penalCharge,
              type: 'percentage'
            },
          ],
          params: [
            {
              title: "Minimum Amount",
              value: this.investmentType?.minAmount,
              type: 'currency',
            },
            {
              title: "Maximum Amount",
              value: this.investmentType?.maxAmount,
              type: 'currency',
            },
            {
              title: "Minimum Interest Rate",
              value: (this.investmentType as any)?.minInterestRate,
              type: 'percentage',
            },
            {
              title: "Maximum Interest Rate",
              value: (this.investmentType as any)?.maxInterestRate,
              type: 'percentage',
            },
            {
              title: "Minimum Interest Tenor",
              value: this.investmentType?.minInvestmentTenor,
              type: 'number',
            },

            {
              title: "Maximum Interest Tenor",
              value: this.investmentType?.maxInvestmentTenor,
              type: 'number',
            },
            {
              title: "Interest Rate Type",
              value:
                this.investmentType?.interestRateType === "Flat"
                  ? ["Flat"]
                  : ["Compound"],
              type: "list",
            },
          ],
          termsAndConditionsSetupInfo: [
            {
              title: 'Show terms and conditions',
              value: this.investmentType?.termsAndConditionsSetupInfo?.DisplayTermsAndConditions ? 'Yes' : 'No',
              showValueAsPill: true
            }
          ]
        };
      }
    }, 300);
  }
  openInvestmentTypeModal(content) {
    this.modalService.open(content, { size: "lg", centered: true });
  }

  openEditInvestmentTypeModal(val: any, content: any) {
    this.EditInvestmentTypeForm = new UntypedFormGroup({
      InvestmentName: new UntypedFormControl(val.investmentName, [
        Validators.required,
      ]),
      InvestmentCode: new UntypedFormControl(val.investmentCode, [
        Validators.required,
      ]),
      InterestRateType: new UntypedFormControl(val.interestRateType, [
        Validators.required,
      ]),
      MinNetInterest: new UntypedFormControl(val.minNetInterest, [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      MaxNetInterest: new UntypedFormControl(val.maxNetInterest, [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      MinAmount: new UntypedFormControl(val.minAmount, [Validators.required]),
      MaxAmount: new UntypedFormControl(val.maxAmount, [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      WithHoldingTax: new UntypedFormControl(val.withHoldingTax, [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      PenalCharge: new UntypedFormControl(val.penalCharge, [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      Status: new UntypedFormControl(val.status, [Validators.required]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      InvestmentTypeId: new UntypedFormControl(val.investmentTypeId, [
        Validators.required,
      ]),
      MaxInvestmentTenor: new UntypedFormControl(val.maxInvestmentTenor, [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      MinInvestmentTenor: new UntypedFormControl(val.minInvestmentTenor, [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      ApprovalRequired: new UntypedFormControl(val.approvalRequired, []),
    });
    this.modalService.open(content, { size: "lg", centered: true });
  }

  isGreaterThanZero(control: AbstractControl): ValidationErrors | null {
    if (control.value > 0) {
      return null;
    } else {
      return { GreaterThanZero: "Provide a value greater than zero." };
    }
  }

  isNotLessThanZero(control: AbstractControl): ValidationErrors | null {
    if (control.value >= 0) {
      return null;
    } else {
      return {
        LesserThanZero: "Provide a value greater than or equal to zero.",
      };
    }
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  investmentSetupInit() {
    this.InvestmentTypeForm = new UntypedFormGroup({
      InvestmentName: new UntypedFormControl("", [Validators.required]),
      InvestmentCode: new UntypedFormControl("", [Validators.required]),
      InterestRateType: new UntypedFormControl("", [Validators.required]),
      MinNetInterest: new UntypedFormControl("", [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      MaxNetInterest: new UntypedFormControl("", [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      MinAmount: new UntypedFormControl(0, [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      MaxAmount: new UntypedFormControl("", [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      WithHoldingTax: new UntypedFormControl("", [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      PenalCharge: new UntypedFormControl("", [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      Status: new UntypedFormControl("", [Validators.required]),
      MaxInvestmentTenor: new UntypedFormControl("", [
        Validators.required,
        this.isGreaterThanZero.bind(this),
      ]),
      MinInvestmentTenor: new UntypedFormControl("", [
        Validators.required,
        this.isNotLessThanZero.bind(this),
      ]),
      ApprovalRequired: new UntypedFormControl(false, []),
    });
  }

  saveInvestmentTypeForm(val: any) {
    if (this.InvestmentTypeForm.valid) {
      this.loader = !this.loader;
      this.invService
        .addInvestmentType(this.InvestmentTypeForm.value)
        .subscribe(
          (res) => {
            // fetch investments
            this.investmentSetupInit();
            this.fetchInvestmentTypes();
            this.loader = !this.loader;
            Swal.fire(
              "Success",
              "Investment type was successfully created",
              "success"
            );
            this.closeModal();
          },
          (err) => {
            this.loader = !this.loader;
          }
        );
    }
  }

  saveEditInvestmentTypeForm(val: any) {
    if (this.EditInvestmentTypeForm.valid) {
      this.loader = !this.loader;
      this.invService
        .editInvestmentType(this.EditInvestmentTypeForm.value)
        .subscribe(
          (res) => {
            // fetch investments
            this.EditInvestmentTypeForm.reset();
            this.fetchInvestmentTypes();
            this.loader = !this.loader;
            Swal.fire(
              "Success",
              "Investment type was successfully updated",
              "success"
            );
            this.closeModal();
          },
          (err) => {
            this.loader = !this.loader;
          }
        );
    }
  }

  fetchInvestmentTypes(search = "", num = 10, skip = 0) {
    this.totalPaginate = [];
    this.investmentTypes = [];
    this.totalRecords = 0;
    this.defaultloader = true;
    this.invService.fetchInvestmentType({ search, num, skip }).subscribe(
      (res) => {
        this.defaultloader = false;
        this.investmentTypes = res.body.data;
        if (res.body.length > 0) {
          this.totalRecords = res.body.length;
          const check1 = Math.ceil(this.totalRecords / this.filterNum);
          for (let index = 0; index < check1; index++) {
            this.totalPaginate.push(this.filterNum * index);
          }
        }
      },
      (err) => {
        this.defaultloader = false;
      }
    );
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  filterInvestmentTypes(ev) {
    this.filterNum = ev;
    this.fetchInvestmentTypes("", this.filterNum);
  }

  SearchTable(val) {
    this.searchTerm = val;
    this.fetchInvestmentTypes(this.searchTerm, this.filterNum);
  }

  NextFetch(items) {
    if (items !== "") {
      this.getItemsPaginatedPageJumpModal();
      // this.activePage = items + 1;
      this.activePage = items > 0 ? Math.ceil(this.totalRecords / items) : 1;
      this.skipNum = items;
      this.fetchInvestmentTypes();
    }
  }
}
