import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { InvestmentService } from "../../../service/investment.service";
import * as $ from "jquery";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormBuilder,
} from "@angular/forms";
import Swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { InvestmentDto, } from "../../../model/investmentDto";
import { ActivatedRoute, Router } from "@angular/router";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { map, pluck, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import swal from "sweetalert2";
import { InvestmentCertificateComponent } from "src/app/library/investment-certificate/investment-certificate.component";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  FetchInvestmentsPayload,
  Investment,
  InvestmentFilterEnum,
  InvestmentTabName,
  InvestmentV2,
  PreviewInvestmentCertData,
} from "../types/investment.type";
import { SharedService } from "src/app/service/shared.service";
import { Filter } from "src/app/model/filter";
import { Pagination, SearchParams } from "../../shared/shared.types";
import { InvestmentCertificateInfoSetup } from "src/app/model/configuration";
import { Investor } from "../types/Investor";
import { CRMCustomerDetail, InvestmentDetail,} from "../../crm/crm.types";
import { clearCrmCustomer, setCrmCustomer} from "src/app/store/actions";
import { Store } from "@ngrx/store";


@Component({
  selector: "app-investments-page",
  templateUrl: "./investments-page.component.html",
  styleUrls: ["./investments-page.component.scss"],
})
export class InvestmentsPageComponent implements OnInit, OnDestroy {
  @ViewChild("financeAccount") financeAccount: ElementRef;
  invLoader = false;
  public previousInvestmentList: InvestmentDto[];
  public customerHistoryLoader = true;
  public currentuser: any;
  public searchTerm = "";
  public numTerm = 10;
  public skip = 0;
  public investmentList: InvestmentV2[] = [];
  public investmentDetails: any;
  public approvalForm: UntypedFormGroup;
  public rollOverForm: UntypedFormGroup;
  approvalInteractionForm: UntypedFormGroup;
  public liquidateForm: UntypedFormGroup;
  public preliquidateForm: UntypedFormGroup;
  public payOutForm: UntypedFormGroup;
  public searchInvestorForm: UntypedFormGroup;
  public submittingApprovalForm = false;
  public approvalComment = "";
  public preLiquidationWarning = false;
  public penalChargeAmount = 0;
  public liquidateLoader = false;
  public rolloverLoader = false;
  public investmentSetupList = [];
  public rollOverAmount = 0;
  public preLiquidationAmount = 0;
  public requests = 0;
  public isApproving: boolean = false;
  currencySymbol: string;
  searchrequestLoader: boolean;
  requestLoader: boolean;
  showConfirmPopup: boolean = false;
  showPopup: boolean = false;

  togglePopup = false;

  public DeactivationFormGroup = {
    InvestmentId: new UntypedFormControl("", [Validators.required]),

    Comment: new UntypedFormControl(""),

    TransactionPin: new UntypedFormControl("", [Validators.required]),
  };

  public DeactivationForm: UntypedFormGroup = new UntypedFormGroup(
    this.DeactivationFormGroup
  );

  public currentTheme: ColorThemeInterface;
  public investmentTypeList = [];
  public invTypeSelected: any;
  public amountTextInfo = "";
  public outOfRange: boolean = false;
  public StartDateNotification = "";
  public mergeState: string = "none";
  public splitTabSelected: boolean = false;

  unsubscriber$ = new Subject<void>();
  totalRecords = 0;
  filterNum = 10;
  totalPaginate = [];
  activePage = 1;
  tabLoader = false;
  currentTab: InvestmentTabName = "Pool";
  rolloverList = [];
  amountAccrued = 0;
  httpFailureError = false;
  loggedInUser: any;
  certificateLoader = false;
  investmentTypeAlreadyExist: any;
  focused: boolean = false;
  loading: boolean = false;
  backDateLiquidation = false;
  continueLiquidation = false;
  loadingCert: boolean;
  ownerInformation: any;
  accounts: CustomDropDown[] = [];
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  selectedSearchColumn = "";
  keyword = "";
  fetchingInvLiqActivities = false;
  investment: Investment;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  investmentFilterEnum = InvestmentFilterEnum;
  filterModel: Filter;
  filterOptions: CustomDropDown[] = [
    { text: InvestmentFilterEnum.Pool, id: InvestmentFilterEnum.Pool },
    { text: InvestmentFilterEnum.Redraft, id: InvestmentFilterEnum.Redraft },
    { text: InvestmentFilterEnum.Rejected, id: InvestmentFilterEnum.Rejected },
  ];
  investmentActive = false;
  showTabArea = false;
  investmentCertSetup?: InvestmentCertificateInfoSetup;
  msg: string;
  newInvestors:Investor[] = null;
  title: string;
  content: string;
  investorTypePop: string;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private invService: InvestmentService,
    private modalService: NgbModal,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private store: Store,
  ) {}

  ngOnInit() {
    this.initSearchForm();
    this.getCurrencySymbol();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe((res) => {
      if (!res) {
        this.httpFailureError = true;
      }
    });
    this._getAccounts();
    this.getApplicationownerinformation();
    this.fetchUser();
    this.fetchInvestmentSetupList();
    // For deeplinking via finance reports
    this.getInvestmentIdFromQuery();
    this.fetchInvestmentType();
    this.getInvestmentSetupInfo();
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

  fetchInvestmentType() {
    this.invService
      .fetchActiveInvestmentType()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.investmentTypeList = res.body;
      });
  }
  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  getInvestmentIdFromQuery() {
    const id = this.route.snapshot.queryParams["invId"];
    if (id) {
      this.getInvestmentById(id);
    }
  }

  private _getAccounts(): void {
    this.configService
      .spoolInteractionAccounts("InvestmentLiquidation")
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.accounts = res.map((account) => ({
          id: account.accountId,
          text: account.name,
        }));
      });
  }

  sendInvestmentCertificate() {
    const payload = { investmentId: this.investmentDetails.investmentId };
    this.certificateLoader = true;
    this.invService
      .sendInvCertificate(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.certificateLoader = false;
          Swal.fire("Successful", "Investment certificate sent", "success");
        },
        (err) => {
          this.certificateLoader = false;
          Swal.fire("Error", err.error?.message, "error");
        }
      );
  }

  switchTabs(val?: InvestmentTabName) {
    if (this.currentTab !== val) {
      this.keyword = "";
      this.selectedSearchColumn = "";
    }

    val ? (this.currentTab = val) : null;
    this.activePage = 1;
    this.skip = 0;
    this.filterNum = 10;
    this.searchTerm = "";

    if (this.currentTab === "Pool") {
      this.getInvestments();
    } else if (this.currentTab === "Approved") {
      this.getInvestments(this.investmentFilterEnum.Approved);
    } else if (this.currentTab === "Terminated") {
      this.getInvestments(this.investmentFilterEnum.Terminated);
    } else if (this.currentTab === "Deactivated") {
      this.getInvestments(this.investmentFilterEnum.Deactivated);
    }
  }

  fetchInvestmentSetupList() {
    this.invService.fetchActiveInvestmentType().subscribe(
      (res) => {
        this.investmentSetupList = res.body;
      },
      (err) => {}
    );
  }

  openModal(content: TemplateRef<any>, size = "lg") {
    this.investmentDetails = null;
    this.modalService.open(content, {
      backdrop: "static",
      size: size,
      centered: true,
    });
  }

  editInvestment(id: number, investorType?: string) {
    this.router.navigate(["treasury/investments/edit", id], {
      queryParams: { type: investorType.toLocaleLowerCase() },
    });
  }

  getNotification(ev) {
    const message = this.investmentDetails
      ? "Investment was successfully updated."
      : "Investment was successfully created.";
    Swal.fire("Success", message, "success");
    this.switchTabs("Pool");
    this.closeModal();
  }

  closeModal(removeDetails = true) {
    this.rollOverAmount = 0;
    this.rolloverList = [];
    if (removeDetails) {
      this.investmentDetails = null;
    }

    this.modalService.dismissAll();
  }

  get preliquidateFormNotValid() {
    return (
      this.preliquidateForm.get("TransactionPin").invalid ||
      this.preliquidateForm.get("LiquidatedAmount").invalid ||
      this.preliquidateForm.get("PenalCharge").invalid ||
      this.preliquidateForm.get("InvestmentRate").invalid ||
      this.preliquidateForm.get("InvestmentTenor").invalid ||
      (this.rollOverAmount > 0 &&
        this.preliquidateForm.get("InvestmentTypeId").value == "") ||
      this.preliquidateForm.get("StartDate").invalid
    );
  }

  get payoutFormNotValid() {
    return (
      this.payOutForm.get("TransactionPin").invalid ||
      this.payOutForm.get("Amount").invalid ||
      this.payOutForm.get("InvestmentRate").invalid ||
      this.payOutForm.get("InvestmentTenor").invalid ||
      (this.rollOverAmount > 0 &&
        this.payOutForm.get("InvestmentTypeId").value == "") ||
      this.payOutForm.get("StartDate").invalid
    );
  }

  toggleLiquidate() {
    this.continueLiquidation = false;
    this.penalChargeAmount = 0;
    const status = "Liquidation";
    this.preLiquidationWarning = false;
    if (
      moment().isSameOrAfter(this.investmentDetails.createdAt) &&
      this.investmentDetails.currentAccruedAmount > 0
    ) {
      this.preLiquidationWarning = true;
      this.penalChargeAmount = parseFloat(
        (
          (parseFloat(this.investmentDetails?.investmentTypeInfo?.penalCharge) /
            100) *
          this.amountAccrued
        ).toFixed(2)
      );

      this.liquidateForm.controls["PenalCharge"].setValue(
        this.penalChargeAmount,
        { onlySelf: true, emitEvent: true }
      );
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    }

    $("input#checkboxPenalCharge").prop("checked", false);
    this.liquidateForm.controls["LiquidatedAmount"].setValue(
      (
        this.investmentDetails?.totalInvestmentEarning - this.penalChargeAmount
      ).toFixed(2),
      { onlySelf: true, emitEvent: true }
    );
    this.liquidateForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    this.liquidateForm.controls["Status"].setValue(status, {
      onlySelf: true,
      emitEvent: true,
    });
    this.liquidateForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    $(".investment-menu").toggle();
  }

  togglePayout() {
    $(".rollover-menu").toggle();
  }

  fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.currentuser = res.body;
          this.getInvestments();
          $(document).ready(() => {
            $.getScript("assets/js/script.js");
          });
        },
        (err) => {}
      );
  }

  initApprovalForm(investmentId: number) {
    this.approvalForm = new UntypedFormGroup({
      userId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      username: new UntypedFormControl(this.currentuser.person.displayName, [
        Validators.required,
      ]),
      status: new UntypedFormControl(""),
      comment: new UntypedFormControl(""),
      transactionPin: new UntypedFormControl("", [Validators.required]),
      investmentId: new UntypedFormControl(investmentId, [Validators.required]),
    });
  }

  submitApprovalForm(status: string) {
    this.approvalForm.get("status").setValue(status);
    this.submittingApprovalForm = true;
    this.invService.updateApprovalStatus(this.approvalForm.value).subscribe(
      (res) => {
        this.submittingApprovalForm = false;
        if (res.body.status === false) {
          Swal.fire("Failed", res.body.message, "error");
        } else {
          Swal.fire("Successful", "Action was successful.", "success");
          if (this.currentTab === "Pool") {
            this.getInvestments();
          } else {
            this.fetchApprovedInvestments();
          }
        }
        (window as any).viewLoan();
      },
      (err) => {
        this.submittingApprovalForm = false;
      }
    );
  }

  closeAside() {
    $(".investment-menu").hide();
    $(".rollover-menu").hide();
    (window as any).viewLoan();
  }

  toggleAside(data?: string) {
    if (data === "merge") {
      this.mergeState = "merge";
      (window as any).viewLoan();
    } else if (data === "split") {
      this.mergeState = "split";
      $(".investment-menu").hide();
      $(".rollover-menu").hide();
      $(".inv-sel").removeClass("active show");
      $(".inv-def").addClass("active");
      (window as any).viewLoan();
    } else {
      this.mergeState = "none";
      $(".investment-menu").hide();
      $(".rollover-menu").hide();
      $(".inv-sel").removeClass("active show");
      $(".inv-def").addClass("active");
      (window as any).viewLoan();
    }
  }

  openAside(): void {
    this.toggleAside("merge");
  }

  triggerModal(type: string, content?: any): void {
    this.store.dispatch(clearCrmCustomer())
    if (type === 'New Investment') {
      this.showPopup = true;
    }
  }

  closePopup(){
    this.showPopup = false;
  }

  closeConfirmPopup(){
    this.showConfirmPopup = false;
  }

  closeInvestmentModal(): void {
    this.modalService.dismissAll();
    this.searchInvestorForm.reset();
    this.newInvestors = [];
  }

  searchInvestor(): void {
    this.loading = true;
    this.msg = "Searching...";
    const payload = {
      selectedSearchColumn: "Email Address",
      keyword: this.searchInvestorForm.value.searchValue,
    };
    this.invService
      .getInvestorsByFullName(payload)
      .pipe(pluck("body", "items"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.newInvestors = res;
        this.msg = "";
        if (this.newInvestors.length === 0) {
          this.msg = "No Investor Found";
        }
        this.loading = false;
      });
  }

  initSearchForm(): void {
    this.searchInvestorForm = this.fb.group({
      searchValue: ["", [Validators.required, Validators.email]],
    });
  }

  getFullName(item: any): string {
    if (!item) return "";
    return [item.firstName, item.middleName, item.lastName]
      .filter((name) => name)
      .join(" ");
  }

  launchInvestmentForm(type?: string, item?: InvestmentDetail): void {
    if (!item || !type) return;

    this.investorTypePop = item?.investorType.toLowerCase() || '';
    Swal.fire({
      type: "info",
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Customer`,
      text: `You are about to launch a ${type.charAt(0).toUpperCase() + type.slice(1)} Investment Form.`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, Cancel",
      confirmButtonText: "Yes, Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.navigateToInvestmentPage(type, item);
      }
    });
  }

  navigateToInvestmentPage(type: string, item?: InvestmentDetail) {
    if (!type) return;

    const inputEmail = this.searchInvestorForm.get("searchValue").value;
   const trasformCustomerData: CRMCustomerDetail = {
    firstName: item?.firstName,
    lastName: item?.lastName,
    email: item?.emailAddress ?? inputEmail,
    businessName: item?.firstName,
    phoneNumber: item?.phoneNumber,
    bvn: item?.bvn,
    InvestorId: item?.personId,
   }
    this.store.dispatch(setCrmCustomer(trasformCustomerData));

    this.router.navigateByUrl(`/treasury/investments/create?type=${type}`);
    this.closeConfirmPopup();
  }


  clearLoanTopUpData(options = { clearForm: true }) {
    if (options.clearForm) this.searchInvestorForm.reset();
  }

  onSplitSelect(): void {
    this.splitTabSelected = true;
  }
  saveLiquidationForm(content) {
    if (this.liquidateForm.valid) {
      this.preLiquidationAmount =
        this.liquidateForm.get("LiquidatedAmount").value;
      this.initPreliquidateForm();
      this.modalService.open(content, { backdrop: "static", centered: true });
      $(".investment-menu").toggle();
      (window as any).viewLoan();
    }
  }

  saveRollOverForm(content) {
    if (this.rollOverForm.valid) {
      this.preLiquidationAmount = this.rollOverForm.get("Amount").value;
      this.initPayOutForm();
      this.modalService.open(content, { backdrop: "static", centered: true });
      $(".rollover-menu").toggle();
      (window as any).viewLoan();
    }
  }

  recalculateLiquidationDetails() {
    if (
      moment(this.liquidateForm.get("liquidationDate").value).isBetween(
        moment(this.investmentDetails.startDate).startOf("day"),
        moment(this.investmentDetails.investmentExpiryDate).endOf("day"),
        null,
        "[]"
      )
    ) {
      this.invLoader = true;
      this.invService
        .fetchLiquidationDetailByDate({
          InterestDate: this.liquidateForm.get("liquidationDate").value,
          InvestmentId: this.investmentDetails.investmentId,
        })
        .subscribe(
          (res) => {
            this.invLoader = false;
            this.amountAccrued = res.body.interest;
            this.continueLiquidation = true;
            this.penalChargeAmount = 0;
            if (this.amountAccrued > 0) {
              this.preLiquidationWarning = true;
              this.penalChargeAmount = parseFloat(
                (
                  (parseFloat(
                    this.investmentDetails?.investmentTypeInfo?.penalCharge
                  ) /
                    100) *
                  this.amountAccrued
                ).toFixed(2)
              );
            }

            $("input#checkboxPenalCharge").prop("checked", false);
            this.liquidateForm.controls["PenalCharge"].setValue(
              this.penalChargeAmount,
              { onlySelf: true, emitEvent: true }
            );
            this.liquidateForm.updateValueAndValidity({
              onlySelf: true,
              emitEvent: true,
            });
            this.liquidateForm.controls["LiquidatedAmount"].setValue(
              (
                this.investmentDetails?.initialDeposit +
                this.amountAccrued -
                this.penalChargeAmount
              ).toFixed(2),
              { onlySelf: true, emitEvent: true }
            );
            this.liquidateForm.updateValueAndValidity({
              onlySelf: true,
              emitEvent: true,
            });
          },
          (err) => {
            this.invLoader = false;
          }
        );
    } else {
      Swal.fire(
        "Error",
        `Date must be between ${moment(this.investmentDetails.startDate).format(
          "DD/MM/yyyy"
        )} and ${moment(this.investmentDetails.investmentExpiryDate).format(
          "DD/MM/yyyy"
        )}.`,
        "error"
      );
    }
  }

  initLiquidationForm(id, date?) {
    this.liquidateForm = new UntypedFormGroup({
      LiquidatedAmount: new UntypedFormControl(0, [
        Validators.required,
        this.checkAmount.bind(this),
      ]),
      PenalCharge: new UntypedFormControl(0, [Validators.required]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      InvestmentId: new UntypedFormControl(id, [Validators.required]),
      Status: new UntypedFormControl("", [Validators.required]),
      liquidationDate: new UntypedFormControl(
        date ? date : moment().format("YYYY-MM-DD"),
        [Validators.required]
      ),
    });
  }

  removePenalCharge(ev) {
    if (this.liquidateForm.get("PenalCharge").value > 0) {
      const val = this.liquidateForm.get("LiquidatedAmount").value;
      const penalCharge = this.liquidateForm.get("PenalCharge").value;
      this.initLiquidationForm(
        this.investmentDetails.investmentId,
        this.liquidateForm.get("liquidationDate").value
      );
      this.liquidateForm.controls["PenalCharge"].setValue(0, {
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.controls["LiquidatedAmount"].setValue(val, {
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.controls["Status"].setValue("Liquidation", {
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.rollOverAmount = 0;
      this.preLiquidationWarning = false;
    } else {
      const val = this.liquidateForm.get("LiquidatedAmount").value;
      this.initLiquidationForm(this.investmentDetails.investmentId);
      this.liquidateForm.controls["PenalCharge"].setValue(
        this.penalChargeAmount,
        { onlySelf: true, emitEvent: true }
      );
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.controls["LiquidatedAmount"].setValue(val, {
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.controls["Status"].setValue("Liquidation", {
        onlySelf: true,
        emitEvent: true,
      });
      this.liquidateForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
      this.rollOverAmount = 0;
      this.preLiquidationWarning = true;
    }
  }

  investmentChange(id) {
    this.preliquidateForm.controls["InvestmentTypeId"].setValue(id);
    this.preliquidateForm.controls["InvestmentTypeId"].updateValueAndValidity();
    this.preliquidateForm.controls["InvestmentRate"].setValidators([
      Validators.required,
      this.checkInvestmentRate.bind(this),
    ]);
    this.preliquidateForm.controls["InvestmentRate"].updateValueAndValidity();
    this.preliquidateForm.controls["InvestmentTenor"].setValidators([
      Validators.required,
      this.checkInvestmentTenor.bind(this),
    ]);
    this.preliquidateForm.controls["InvestmentTenor"].updateValueAndValidity();
  }

  initPreliquidateForm() {
    this.preliquidateForm = new UntypedFormGroup({
      LiquidatedAmount: new UntypedFormControl(this.preLiquidationAmount, [
        Validators.required,
      ]),
      PenalCharge: new UntypedFormControl(
        this.liquidateForm.get("PenalCharge").value,
        [Validators.required]
      ),
      ProposedPenalCharge: new UntypedFormControl(this.penalChargeAmount, [
        Validators.required,
      ]),
      InterestAccrued: new UntypedFormControl(
        this.investmentDetails.currentAccruedAmount,
        [Validators.required]
      ),
      Period: new UntypedFormControl(this.investmentDetails.dayCount, [
        Validators.required,
      ]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      InvestmentId: new UntypedFormControl(
        this.investmentDetails.investmentId,
        [Validators.required]
      ),
      financeInteractionCashOrBankAccountIdObj: new UntypedFormControl(null),
      financeInteractionCashOrBankAccountId: new UntypedFormControl(null),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      InvestmentTypeId: new UntypedFormControl(
        this.investmentTypeAlreadyExist
          ? this.investmentDetails.investmentTypeId
          : "",
        []
      ),
      RollOverAmount: new UntypedFormControl(this.rollOverAmount, []),
      StartDate: new UntypedFormControl("", Validators.required),
      liquidationDate: new UntypedFormControl(
        this.liquidateForm.get("liquidationDate").value,
        []
      ),
      RollOverDetails: new UntypedFormControl(
        JSON.stringify(this.investmentDetails),
        [Validators.required]
      ),
      Status: new UntypedFormControl("Liquidation", [Validators.required]),
      InvestmentTenor: new UntypedFormControl(
        this.investmentTypeAlreadyExist
          ? this.investmentDetails.investmentTenor
          : 0,
        [this.checkInvestmentTenor.bind(this)]
      ),
      InvestmentRate: new UntypedFormControl(
        this.investmentTypeAlreadyExist
          ? this.investmentDetails.investmentRate
          : 0,
        [this.checkInvestmentRate.bind(this)]
      ),
    });

    if (this.rollOverAmount > 0) {
      this.preliquidateForm.get("StartDate").setValidators(Validators.required);
    } else {
      this.preliquidateForm.get("StartDate").clearValidators();
    }

    this.preliquidateForm
      .get("financeInteractionCashOrBankAccountIdObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.preliquidateForm
            .get("financeInteractionCashOrBankAccountId")
            .setValue(res[0]?.id);
        }
      });
  }

  checkInvestmentTenor(control: AbstractControl): ValidationErrors | null {
    if (this.preliquidateForm && this.rollOverAmount > 0) {
      const invTypeSelected = this.rolloverList.find(
        (x) =>
          x.investmentTypeId ===
          this.preliquidateForm.get("InvestmentTypeId").value
      );
      if (invTypeSelected) {
        if (
          invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) &&
          parseInt(control.value, 0) <= invTypeSelected.maxInvestmentTenor
        ) {
          return null;
        } else {
          return {
            OutOfRange: `Min: ${invTypeSelected.minInvestmentTenor} - Max: ${invTypeSelected.maxInvestmentTenor}`,
          };
        }
      } else {
        return { OutOfRange: `This field is required.` };
      }
    } else {
      return null;
    }
  }

  checkInvestmentRate(control: AbstractControl): ValidationErrors | null {
    if (this.preliquidateForm && this.rollOverAmount > 0) {
      const invTypeSelected = this.rolloverList.find(
        (x) =>
          x.investmentTypeId ===
          this.preliquidateForm.get("InvestmentTypeId").value
      );
      if (invTypeSelected) {
        if (
          invTypeSelected.minInterestRate <= parseInt(control.value, 0) &&
          parseInt(control.value, 0) <= invTypeSelected.maxInterestRate
        ) {
          return null;
        } else {
          return {
            OutOfRange: `Min: ${invTypeSelected.minInterestRate} - Max: ${invTypeSelected.maxInterestRate}`,
          };
        }
      } else {
        return { OutOfRange: `This field is required.` };
      }
    } else {
      return null;
    }
  }

  checkInvRate(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        this.invTypeSelected.minInterestRate <= parseInt(control.value, 0) &&
        parseInt(control.value, 0) <= this.invTypeSelected.maxInterestRate
      ) {
        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInterestRate} - Max: ${this.invTypeSelected.maxInterestRate}`,
        };
      }
    } else {
      return { OutOfRange: `This field is required.` };
    }
  }

  checkInvTenor(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        this.invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) &&
        parseInt(control.value, 0) <= this.invTypeSelected.maxInvestmentTenor
      ) {
        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInvestmentTenor} - Max: ${this.invTypeSelected.maxInvestmentTenor}`,
        };
      }
    } else {
      return null;
    }
  }

  initPayOutForm() {
    this.payOutForm = new UntypedFormGroup({
      Amount: new UntypedFormControl(this.preLiquidationAmount, [
        Validators.required,
      ]),
      PenalCharge: new UntypedFormControl(this.penalChargeAmount, [
        Validators.required,
      ]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      InvestmentId: new UntypedFormControl(
        this.investmentDetails.investmentId,
        [Validators.required]
      ),
      InterestAccrued: new UntypedFormControl(
        this.investmentDetails.currentAccruedAmount,
        [Validators.required]
      ),
      Period: new UntypedFormControl(this.investmentDetails.dayCount, [
        Validators.required,
      ]),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      InvestmentTypeId: new UntypedFormControl(
        this.investmentTypeAlreadyExist
          ? this.investmentDetails.investmentTypeId
          : "",
        []
      ),
      RollOverAmount: new UntypedFormControl(this.rollOverAmount, []),
      RollOverDetails: new UntypedFormControl(
        JSON.stringify(this.investmentDetails),
        [Validators.required]
      ),
      Status: new UntypedFormControl("Payout", [Validators.required]),
      StartDate: new UntypedFormControl(""),
      InvestmentTenor: new UntypedFormControl(
        this.rollOverAmount === 0 ? this.investmentDetails.investmentTenor : "",
        [this.checkInvestmentPayoutTenor.bind(this)]
      ),
      InvestmentRate: new UntypedFormControl(
        this.rollOverAmount === 0 ? this.investmentDetails.investmentRate : "",
        [this.checkInvestmentPayoutRate.bind(this)]
      ),
      FinanceInteractionCashOrBankAccountIdObj: new UntypedFormControl(null),
      FinanceInteractionCashOrBankAccountId: new UntypedFormControl(null),
    });

    if (this.rollOverAmount > 0) {
      this.payOutForm.get("StartDate").setValidators(Validators.required);
    } else {
      this.payOutForm.get("StartDate").clearValidators();
    }

    this.payOutForm
      .get("FinanceInteractionCashOrBankAccountIdObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.payOutForm
            .get("FinanceInteractionCashOrBankAccountId")
            .setValue(res[0]?.id);
        }
      });
  }

  investmentPayOutChange(id) {
    this.payOutForm.controls["InvestmentTypeId"].setValue(id);
    this.payOutForm.controls["InvestmentTypeId"].updateValueAndValidity();
    this.payOutForm.controls["InvestmentRate"].setValidators([
      Validators.required,
      this.checkInvestmentPayoutRate.bind(this),
    ]);
    this.payOutForm.controls["InvestmentRate"].updateValueAndValidity();
    this.payOutForm.controls["InvestmentTenor"].setValidators([
      Validators.required,
      this.checkInvestmentPayoutTenor.bind(this),
    ]);
    this.payOutForm.controls["InvestmentTenor"].updateValueAndValidity();
  }

  checkInvestmentPayoutTenor(
    control: AbstractControl
  ): ValidationErrors | null {
    if (this.payOutForm && this.rollOverAmount > 0) {
      const invTypeSelected = this.rolloverList.find(
        (x) =>
          x.investmentTypeId === this.payOutForm.get("InvestmentTypeId").value
      );
      if (invTypeSelected) {
        if (
          invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) &&
          parseInt(control.value, 0) <= invTypeSelected.maxInvestmentTenor
        ) {
          return null;
        } else {
          return {
            OutOfRange: `Min: ${invTypeSelected.minInvestmentTenor} - Max: ${invTypeSelected.maxInvestmentTenor}`,
          };
        }
      } else {
        return { OutOfRange: `This field is required.` };
      }
    } else {
      return null;
    }
  }

  checkInvestmentPayoutRate(control: AbstractControl): ValidationErrors | null {
    if (this.payOutForm && this.rollOverAmount > 0) {
      const invTypeSelected = this.rolloverList.find(
        (x) =>
          x.investmentTypeId === this.payOutForm.get("InvestmentTypeId").value
      );
      if (invTypeSelected) {
        if (
          invTypeSelected.minInterestRate <= parseInt(control.value, 0) &&
          parseInt(control.value, 0) <= invTypeSelected.maxInterestRate
        ) {
          return null;
        } else {
          return {
            OutOfRange: `Min: ${invTypeSelected.minInterestRate} - Max: ${invTypeSelected.maxInterestRate}`,
          };
        }
      } else {
        return { OutOfRange: `This field is required.` };
      }
    } else {
      return null;
    }
  }

  savePayOutForm(noApprovalNeeded = false) {
    if (this.payOutForm.valid) {
      this.payOutForm.value["noApprovalNeeded"] = noApprovalNeeded;

      this.rolloverLoader = true;
      this.invService.savePayout({ ...this.payOutForm.value }).subscribe(
        (res) => {
          const msg = noApprovalNeeded
            ? "Liquidation successful"
            : "Liquidation request sent successfully.";
          this.closeModal();
          this.rolloverLoader = false;
          Swal.fire("Successful", msg, "success");
          this.fetchApprovedInvestments();
        },
        (err) => {
          this.rolloverLoader = false;
        }
      );
    }
  }

  savePreliquidationForm(noApprovalNeeded = false) {
    if (this.preliquidateForm.valid) {
      this.preliquidateForm.removeControl(
        "financeInteractionCashOrBankAccountIdObj"
      );
      this.preliquidateForm.value["noApprovalNeeded"] = noApprovalNeeded;

      this.liquidateLoader = true;
      this.invService.saveLiquidation(this.preliquidateForm.value).subscribe(
        (res) => {
          const msg = noApprovalNeeded
            ? "Liquidation successful"
            : "Liquidation request sent successfully.";
          this.closeModal();
          this.liquidateLoader = false;
          Swal.fire("Successful", msg, "success");
          this.fetchApprovedInvestments();
        },
        (err) => {
          this.liquidateLoader = false;
        }
      );
    }
  }

  checkRolloverInvestmentList() {
    this.rolloverList = [];
    this.investmentSetupList.forEach((key) => {
      if (
        this.rollOverAmount >= key.minAmount &&
        this.rollOverAmount <= key.maxAmount
      ) {
        this.rolloverList.push(key);
      }
    });
    this.investmentTypeAlreadyExist = this.rolloverList.find(
      (x) => x.investmentTypeId == this.investmentDetails.investmentTypeId
    );
  }

  checkAmount(control: AbstractControl): ValidationErrors | null {
    const val = this.liquidateForm
      ? this.liquidateForm.get("PenalCharge").value
      : 0;
    const diff = parseFloat(
      (
        this.investmentDetails.initialDeposit +
        this.amountAccrued -
        val
      ).toFixed(2)
    );
    this.rollOverAmount = diff - control.value > 0 ? diff - control.value : 0;
    if (this.rollOverAmount > 0) {
      this.checkRolloverInvestmentList();
    }
    return control.value > diff
      ? { NotEarned: "Sorry you have not earned up to this amount" }
      : null;
  }

  greaterThanZero(control: AbstractControl): ValidationErrors | null {
    return control.value <= 0
      ? { LessThanZero: "This amount is invalid." }
      : null;
  }

  initRollOverForm(id) {
    this.rollOverForm = new UntypedFormGroup({
      Amount: new UntypedFormControl(
        this.investmentDetails.totalInvestmentEarning,
        [Validators.required, this.checkAmountRollover.bind(this)]
      ),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      InvestmentId: new UntypedFormControl(id, [Validators.required]),
    });
  }

  checkAmountRollover(control: AbstractControl): ValidationErrors | null {
    const diff = this.investmentDetails.totalInvestmentEarning;
    this.rollOverAmount = diff - control.value > 0 ? diff - control.value : 0;
    this.rolloverList = [];
    if (this.rollOverAmount > 0) {
      this.investmentSetupList.forEach((key) => {
        if (
          this.rollOverAmount >= key.minAmount &&
          this.rollOverAmount <= key.maxAmount
        ) {
          this.rolloverList.push(key);
        }
      });
      this.investmentTypeAlreadyExist = this.rolloverList.find(
        (x) => x.investmentTypeId == this.investmentDetails.investmentTypeId
      );
    }
    return control.value > diff
      ? { NotEarned: "Sorry you have not earned up to this amount" }
      : null;
  }

  private _setPagination(res: any): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  fetchApprovedInvestments() {
    $("#tab-request").removeClass("active show");
    $("#tab-terminated").removeClass("active show");
    $("#tab-activated").addClass("active show");
    $("#navApproved").addClass("active-tab");
    $("#navRequest").removeClass("active-tab");
    $("#navTerminated").removeClass("active-tab");

    $("#navDeactivated").removeClass("active-tab");
    $("#tab-deactivated").removeClass("active show");
    this.tabLoader = true;
    this.totalPaginate = [];
    this.investmentList = [];
    this.totalRecords = 0;
    let model: any = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (this.searchTerm) {
      model.search = this.searchTerm;
    }

    this.invService
      .fetchRunningInvestmentsPaginated(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res: any) => {
          this.tabLoader = false;
          this.investmentList = res.body.data.items;
          if (this.investmentDetails) {
            this.investmentDetails = this.investmentList.find(
              (x) => x.investmentId === this.investmentDetails.investmentId
            );
          }

          this._setPagination(res.body.data);
          $(".itemPaginatedJumpModal").toggle(false);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  getInvestments(
    filter: InvestmentFilterEnum | InvestmentFilterEnum[] = [
      InvestmentFilterEnum.Pool,
      InvestmentFilterEnum.Redraft,
      InvestmentFilterEnum.Rejected,
    ],
    keyword?: string,
    option?: CustomDropDown
  ) {
    this.tabLoader = true;
    let payload: FetchInvestmentsPayload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.keyword,
      selectedSearchColumn: this.selectedSearchColumn,
      filter,
    };

    if (option) {
      payload.filter = option.id as InvestmentFilterEnum;
      this.filterModel?.setData({
        filters: [[option]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });
    }

    if (keyword) {
      payload["keyword"] = keyword;
    }

    this.invService
      .getInvestments(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.investmentList = res.body.items;
          this._setPagination(res.body);
          this.tabLoader = false;
        },
        () => {
          this.tabLoader = false;
        }
      );
  }

  fetchTerminatedInvestments() {
    $("#tab-request").removeClass("active show");
    $("#tab-activated").removeClass("active show");
    $("#tab-terminated").addClass("active show");
    $("#navApproved").removeClass("active-tab");
    $("#navTerminated").addClass("active-tab");
    $("#navRequest").removeClass("active-tab");

    $("#navDeactivated").removeClass("active-tab");
    $("#tab-deactivated").removeClass("active show");
    this.tabLoader = true;
    this.totalPaginate = [];
    this.investmentList = [];
    this.totalRecords = 0;
    let model: any = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (this.searchTerm) {
      model.search = this.searchTerm;
    }

    this.invService
      .fetchTerminatedInvestmentsPaginated(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res: any) => {
          this.tabLoader = false;
          this.investmentList = res.body.data.items;
          if (this.investmentDetails) {
            this.investmentDetails = this.investmentList.find(
              (x) => x.investmentId === this.investmentDetails.investmentId
            );
          }

          this._setPagination(res.body.data);
          $(".itemPaginatedJumpModal").toggle(false);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  getCertificateInfo(): void {
    const status = this.investmentDetails.status;
    if (
      status === "Pool" ||
      status === "Redraft" ||
      status === "AwaitingApproval"
    ) {
      this.investmentDetails["investmentTypeId"] =
        this.investmentDetails.investmentTypId ||
        this.investmentDetails.investmentTypeId;
      this.previewInvestmentCert();
      return;
    }

    this.openInvCertModal(this.investmentDetails);
  }

  openInvCertModal(data: PreviewInvestmentCertData) {
    const modalRef = this.modalService.open(InvestmentCertificateComponent, {
      centered: true,
      windowClass: "myModal",
    });

    data = {
      ...data,
      investmentCertSetup: this.investmentCertSetup,
    };

    modalRef.componentInstance.data = data;
    modalRef.componentInstance.theme = this.currentTheme;
    modalRef.componentInstance.isModal = true;
  }

  previewInvestmentCert() {
    this.loadingCert = true;
    this.invService
      .getInvestmentCertificatePreview(this.investmentDetails)
      .subscribe(
        (res) => {
          let certData = res.body?.data;
          certData["total"] = +(
            certData?.investmentAmount + certData?.totalAmountExpected
          );
          certData["investmentTypeInfo"] =
            this.investmentDetails?.investmentTypeInfo;
          this.loadingCert = false;
          this.openInvCertModal(certData);
        },
        () => {
          this.loadingCert = false;
        }
      );
  }

  fetchDeactivatedInvestments() {
    $("#tab-request").removeClass("active show");
    $("#navRequest").removeClass("active-tab");

    $("#tab-activated").removeClass("active show");
    $("#navApproved").removeClass("active-tab");

    $("#tab-terminated").addClass("active show");
    $("#navTerminated").addClass("active-tab");

    $("#navDeactivated").addClass("active-tab");
    $("#tab-deactivated").addClass("active show");

    this.fetchAllInvestment("Deactivated");
  }

  fetchAllInvestment(status) {
    this.tabLoader = true;
    this.totalPaginate = [];
    this.investmentList = [];
    this.totalRecords = 0;
    let model: any = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      investmentStatus: ["Deactivated"],
    };

    if (this.searchTerm) {
      model.search = this.searchTerm;
    }

    this.invService
      .fetchAllInvestment(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res: any) => {
          this.tabLoader = false;
          this.investmentList = res.body.data.items;
          if (this.investmentDetails) {
            this.investmentDetails = this.investmentList.find(
              (x) => x.investmentId === this.investmentDetails.investmentId
            );
          }
          this._setPagination(res.body.data);
          $(".itemPaginatedJumpModal").toggle(false);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  getInvestmentById(id: number) {
    this.tabLoader = false;
    this.showTabArea = false;
    this.invService
      .getInvestmentById(id)
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((data) => {
        this.amountAccrued = 0;
        if (data.status === "Pool" || data.status === "Redraft") {
          this.amountAccrued = data.currentAccruedAmount;
          this.investmentActive = false;
        } else {
          this.investmentActive = true;
        }
        this.showTabArea = true;
        this.investmentDetails = data;
        this.initLiquidationForm(data.investmentId);
        this.initRollOverForm(data.investmentId);
        this.initApprovalForm(data.investmentId);
        this.tabLoader = false;
        this.toggleAside("split");
      });
  }

  viewInvestment(id: number, element?) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.getInvestmentById(id);
      }
    });
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  filterInvestment(ev) {
    this.filterNum = ev;
    if (this.currentTab === "Approved") {
      this.fetchApprovedInvestments();
    } else if (this.currentTab === "Terminated") {
      this.fetchTerminatedInvestments();
    } else if (this.currentTab === "Deactivated") {
      this.fetchAllInvestment("Deactivated");
    }
  }

  SearchTable(val) {
    this.searchTerm = val;
    if (this.currentTab === "Approved") {
      this.getInvestments(this.investmentFilterEnum.Approved, this.searchTerm);
    } else if (this.currentTab === "Terminated") {
      this.getInvestments(
        this.investmentFilterEnum.Terminated,
        this.searchTerm
      );
    } else if (this.currentTab === "Deactivated") {
      this.fetchAllInvestment("Deactivated");
    }
  }

  NextFetch(items) {
    if (items !== "") {
      this.getItemsPaginatedPageJumpModal();
      this.activePage = items > 0 ? Math.ceil(this.totalRecords / items) : 1;
      this.skip = items;
      if (this.currentTab === "Approved") {
        this.fetchApprovedInvestments();
      } else if (this.currentTab === "Terminated") {
        this.fetchTerminatedInvestments();
      } else if (this.currentTab === "Deactivated") {
        this.fetchAllInvestment("Deactivated");
      }
    }
  }

  toggleDeactivationModal(id, content) {
    this.loading = false;
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
      size: "lg",
    });
  }

  submitDeactivationForm(val: any) {
    if (this.DeactivationForm.valid) {
      this.loading = true;

      this.DeactivationForm.controls["InvestmentId"].patchValue(
        this.investmentDetails.investmentId
      );
      this.invService
        .deactivateInvestment(this.DeactivationForm.value)
        .subscribe(
          (res) => {
            this.loading = false;
            this.fetchApprovedInvestments();

            swal
              .fire({
                type: "success",
                text: "Investment Deactivated",
                title: "Successful",
                confirmButtonColor: "#558E90",
              })
              .then((result) => {
                this.closeModal();
                this.toggleAside();
              });
          },
          (err) => {
            this.loading = false;
          }
        );
    }
  }

  fetchCustomerPreviousInvestments() {
    this.previousInvestmentList = [];
    this.customerHistoryLoader = true;
    this.invService
      .fetchCustomerPreviousInvestments(
        this.investmentDetails.investmentId,
        this.investmentDetails.investorId
      )
      .subscribe(
        (res: any) => {
          this.customerHistoryLoader = false;
          this.previousInvestmentList = res.body;
        },
        (err) => {
          this.customerHistoryLoader = false;
        }
      );
  }

  getInterestTotal(ev: any) {
    let sumVal = 0;
    ev.forEach((key) => {
      sumVal += key.interestAccrued;
    });
    return sumVal;
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Investment code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.getInvestments();
    });
  }

  onOptionSelected(option: { id: string; text: string }) {
    this.getInvestments(null, null, option);
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.keyword = event.keyword;
    this.switchTabs(this.currentTab);
  }

  getInvestmentSetupInfo() {
    this.configService
      .fetchInvestmentSetupInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.investmentCertSetup =
            res.body?.data?.investmentCertificateInfoSetup;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
