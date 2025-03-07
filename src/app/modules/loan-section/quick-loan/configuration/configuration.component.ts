import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { QuickLoanService } from "src/app/service/quick-loan.service";
import { UserService } from "src/app/service/user.service";
import swal from "sweetalert2";
import { ApplicableFee } from "../../loan.types";
import { nonZero } from "src/app/util/validators/validators";

@Component({
  selector: "lnd-configuration",
  templateUrl: "./configuration.component.html",
  styleUrls: ["./configuration.component.scss"],
})
export class ConfigurationComponent implements OnInit {
  currentTheme: ColorThemeInterface;
  currentUser: User;
  ownerInformation: AppOwnerInformation;
  unsubscriber$ = new Subject<void>();
  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  public loggedInUser: any;
  configForm: UntypedFormGroup;
  isSaving: boolean;
  isLoading: boolean;
  tenorSelection = new SelectionModel(true, []);
  tenors = [1, 2, 3, 6, 9, 12, 15, 18, 24];
  config: any;
  dailySummaryEmails: any[] = [];
  recipientEmail: string;
  emailError: string;
  feelines: any[] = [];
  repaymentMethodsArray: any;
  feesArray: any[] = [];
  public feeTypeArray: Array<string> = ["Percentage", "Flat Rate"];
  public feeApplicationArray: Array<string> = [
    // "Deducted Upfront",
    "Capitalized",
  ];
  currentUserBranchId: any;
  constructor(
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService,
    private userService: UserService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private quickLoanService: QuickLoanService,
    private loanOperationService: LoanoperationsService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.getOwnerInformation();
    this.initForm();
    this.getConfigData();
    this.getConstants();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      contactPhoneNumber: new UntypedFormControl(null, [Validators.required]),
      termsAndConditions: new UntypedFormControl(null, [
        Validators.required,
        Validators.maxLength(150),
      ]),
      dailySummaryRecipients: new UntypedFormControl(null, [Validators.required]),
      applicableTenors: new UntypedFormControl(null, [Validators.required]),
      repaymentMethods: new UntypedFormControl(null),
      minimumLoanAmount: new UntypedFormControl(0, [
        Validators.required,
        nonZero.bind(this),
      ]),
      maximumLoanAmount: new UntypedFormControl(0, [
        Validators.required,
        nonZero.bind(this),
      ]),
      riskLimitAmount: new UntypedFormControl(0, [Validators.required,nonZero.bind(this)]),
      dsr: new UntypedFormControl(0, [Validators.required]),
      maximumPayCheck: new UntypedFormControl(0, [Validators.required]),
      minimumPayCheck: new UntypedFormControl(0, [Validators.required]),
      interestRate: new UntypedFormControl(0, Validators.required),
      code: new UntypedFormControl(0),
      serviceCode: new UntypedFormControl(null, Validators.required),
      applicableFees: new UntypedFormControl(null),
    });

    this.runValidations();
  }

  private runValidations() {
    this.configForm
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res?.minimumLoanAmount > res?.maximumLoanAmount) {
          this.configForm
            .get("minimumLoanAmount")
            .setErrors({
              isGreater: true,
              msg: "Minimum Loan Amount must be less than Maximum Loan Amount",
            });
        } else {
          res?.minimumLoanAmount !== 0 && this.configForm.get("minimumLoanAmount").setErrors(null);
        }

        if (res?.minimumLoanAmount > res?.riskLimitAmount) {
          this.configForm
            .get("minimumLoanAmount")
            .setErrors({
              isGreater: true,
              msg: "Minimum Loan Amount must be less than Risk Limit Amount",
            });
        } else {
          res?.minimumLoanAmount !== 0 && this.configForm.get("minimumLoanAmount").setErrors(null);
        }

        if (res?.maximumLoanAmount < res?.minimumLoanAmount) {
          this.configForm
            .get("maximumLoanAmount")
            .setErrors({
              isLesser: true,
              msg: "Maximum Loan Amount must be greater than Minimum Loan Amount",
            });
        } else {
          res?.maximumLoanAmount !== 0 && this.configForm.get("maximumLoanAmount").setErrors(null);
        }

        if (res?.maximumLoanAmount < res?.riskLimitAmount) {
          this.configForm
            .get("maximumLoanAmount")
            .setErrors({
              isLesser: true,
              msg: "Maximum Loan Amount must be greater than Risk Limit Amount",
            });
        } else {
          res?.maximumLoanAmount !== 0 && this.configForm.get("maximumLoanAmount").setErrors(null);
        }

        if (res?.riskLimitAmount < res?.minimumLoanAmount) {
          this.configForm
            .get("riskLimitAmount")
            .setErrors({
              isLesser: true,
              msg: "Risk Limit Amount must be greater than Minimum Loan Amount",
            });
        } else {
          res?.riskLimitAmount !== 0 && this.configForm.get("riskLimitAmount").setErrors(null);
        }

        if (res?.riskLimitAmount > res?.maximumLoanAmount) {
          this.configForm
            .get("riskLimitAmount")
            .setErrors({
              isGreater: true,
              msg: "Risk Limit Amount must be less than Max Loan Amount",
            });
        } else {
          res?.riskLimitAmount !== 0 && this.configForm.get("riskLimitAmount").setErrors(null);
        }

      });
  }

  getConfigData(): void {
    this.isLoading = true;

    this.quickLoanService
      .getQuickLoanConfig()
      .pipe(takeUntil(this.unsubscriber$), pluck("body"))
      .subscribe(
        (res) => {
          this.config = res?.data;
          this.configForm.patchValue(res?.data);
          this.dailySummaryEmails = [
            ...(this.config?.dailySummaryRecipients ?? []),
          ];
          const dailySummaryRecipients = this.config?.dailySummaryRecipients
            ?.map((x) => x?.email)
            .join(", ");
          this.configForm
            .get("dailySummaryRecipients")
            .patchValue(dailySummaryRecipients);
          const applicableTenors = this.config?.applicableTenors;
          this.tenorSelection.select(...(applicableTenors ?? []));
          this.config?.applicableFees?.forEach((item) => {
            this.feelines.push({
              feeID: item.feeID,
              feeName: item.feeName,
              feeType: item.feeType,
              feeAmount: item.feeAmount,
              feeApplication: item?.feeApplication,
            });
          });
          this.isLoading = false;
        },
        (err) => {
          this.isLoading = false;
        }
      );
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getOwnerInformation(): void {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      })
      .catch((err) => {});
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentUser = user?.body;
          // this.currentUserId = this.currentUser.userId;
          this.currentUserBranchId = this.currentUser?.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  submitForm(): void {
    this.isSaving = true;
    const data = this.configForm.value;

    if (typeof data?.dailySummaryRecipients === "string") {
      data["dailySummaryRecipients"] = data?.dailySummaryRecipients
        .split(", ")
        .map((email: string) => ({ email }));
    } else {
      data["dailySummaryRecipients"] = data?.dailySummaryRecipients.map(
        (recipient: { email: string }) => ({ email: recipient.email.trim() })
      );
    }

    data["applicableFees"] = this.feelines;
    if (this.config) data["id"] = this.config.id;

    this.quickLoanService
      .updateQuickLoanConfig(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.getConfigData();
          this.toast.fire({
            title: "Configuration updated successfully",
            type: "success",
          });
          this.isSaving = false;
          this.feelines = [];
        },
        (err) => {
          this.isSaving = false;
        }
      );
  }

  toggleTenor(tenor: any): void {
    this.tenorSelection.toggle(tenor);
    this.configForm
      .get("applicableTenors")
      .patchValue(this.tenorSelection.selected);
  }

  removeEmail(index: number): void {
    this.dailySummaryEmails.splice(index, 1);
    this.configForm
      .get("dailySummaryRecipients")
      .patchValue(
        this.dailySummaryEmails?.length > 0 ? this.dailySummaryEmails : null
      );
  }

  addEmail(): void {
    this.emailError = null;
    const mailReg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const isValidEmail = this.recipientEmail.match(mailReg);
    if (isValidEmail) {
      this.dailySummaryEmails.push({ email: this.recipientEmail });
      this.configForm
        .get("dailySummaryRecipients")
        .patchValue(this.dailySummaryEmails);
      this.recipientEmail = null;
      this.emailError = null;
    } else {
      this.emailError = "The email entered is not valid.";
    }
  }

  removeFeeRow(i: number): void {
    this.feelines.splice(i, 1);
  }

  addFeeRow() {
    this.feelines.push({
      feeID: null,
      feeName: null,
      feeApplication: null,
      feeType: null,
      feeAmount: "0",
    });
  }

  getConstants() {
    this.configurationService
      .spoolFeesforSelect(this.currentUserBranchId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.feesArray = [];
          response.body.forEach((element) => {
            this.feesArray.push({ id: element.feeId, text: element.feeName });
          });
        },
        (error) => {}
      );
  }

  selected(type: string, data: any, index: number) {
    if (type === "fee") {
      this.feelines[index].feeID = data.id;
      this.feelines[index].feeName = data.text;
    } else if (type === "feeType") {
      this.feelines[index].feeType = data?.id;
    } else if (type === "feeApplication") {
      this.feelines[index].feeApplication = data?.id;
    }
  }

  setSelected(type: string, row: any[], currentindex: number): any[] {
    const selectedArray = [];
    if (type === "feeName") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.feeID) {
            selectedArray.push({ id: line.feeID, text: line.feeName });
            this.feelines[index].feeID = line.feeID;
            this.feelines[index].feeName = line.feeName;
          }
        }
      });
    } else if (type === "feeType") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.feeType) {
            selectedArray.push({ id: line.feeType, text: line.feeType });
            this.feelines[index].feeType = line.feeType;
          }
        }
      });
    } else if (type === "feeApplication") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.feeType) {
            selectedArray.push({
              id: line.feeApplication,
              text: line.feeApplication,
            });
            this.feelines[index].feeApplication = line.feeApplication;
          }
        }
      });
    }
    return selectedArray;
  }
}
