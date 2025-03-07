import { HttpResponse } from "@angular/common/http";
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  FormArray,
  FormControl,
  FormGroup,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import * as moment from "moment";
import { saveAs } from "file-saver";
import swal from "sweetalert2";
import * as _ from "lodash";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { InvestmentService } from "src/app/service/investment.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  IMPORT_ERROR_CONFIG,
  IMPORT_ERROR_DATA,
  IMPORT_ERROR_HEADER,
  handleImportError,
} from "../../shared/helpers/generic.helpers";
import { TableConfig, TableData, TableHeader } from "../../shared/shared.types";
import { InvestmentCertificateInfoSetup, InvestmentInfoSetupDto } from "src/app/model/configuration";

@Component({
  selector: "app-investmentconfiguration-page",
  templateUrl: "./investmentconfiguration-page.component.html",
  styleUrls: ["./investmentconfiguration-page.component.scss"],
})
export class InvestmentconfigurationPageComponent implements OnInit, OnDestroy {
  @ViewChild("importErrorsModal")
  private importErrorsModal: TemplateRef<HTMLElement>;
  private _unsubsriber$ = new Subject();
  investmentSetupBankList: any[] = [];
  loader = false;
  requestLoader = false;
  user: any;
  appOwner: any;
  investmentSetupForm: UntypedFormGroup;
  fileInputLabel: any;
  fileInput: any = null;
  downloading = false;
  uploading = false;
  bankAccountValidationLoader = false;
  investmentCodeSetupForm: UntypedFormGroup;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  importErrorConfig: TableConfig = IMPORT_ERROR_CONFIG;
  importErrorHeaders: TableHeader[] = IMPORT_ERROR_HEADER;
  importErrorData: TableData[] = IMPORT_ERROR_DATA;

  certSetupForm: UntypedFormGroup;
  savingCertificate = false;

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private userService: UserService,
    private invService: InvestmentService,
    private colorThemeService: ColorThemeService,
    private _fb: UntypedFormBuilder,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getInvestmentSetupTabData();
    this.fetchUserInfo(this.authService.decodeToken().nameid);
    this.getAppOwnerDetails();
    this.getInvestmentSetupInfo();
    this.investmentSetupFormInit();
    this._initCodeSetup();
    this.investmentCertSetupInit();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _initCodeSetup(): void {
    this.investmentCodeSetupForm = this._fb.group({
      appOwnerShortTermPlacementTypeCode: new UntypedFormControl(
        null,
        Validators.required
      ),
      appOwnerShortTermPlacementCode: new UntypedFormControl(
        null,
        Validators.required
      ),
    });
  }

  updateSetUpForm(): void {
    this.loader = true;

    this.configService
      .updateInvestmentSetupCode(this.investmentCodeSetupForm.value)
      .pipe(takeUntil(this._unsubsriber$))
      .subscribe((res) => {
        if (res.status === 200) {
          this._patchCodeForm(res.body);

          this.toast.fire({
            type: "success",
            title: "Codes Updated Successfully",
          });

          this.loader = false;
        }
      });
  }

  private _patchCodeForm(appOwner): void {
    this.investmentCodeSetupForm.patchValue({
      appOwnerShortTermPlacementTypeCode:
        appOwner?.appOwnerShortTermPlacementTypeCode,
      appOwnerShortTermPlacementCode: appOwner?.appOwnerShortTermPlacementCode,
    });
  }

  getInvestmentSetupTabData() {
    if (this.investmentSetupBankList.length == 0) {
      this.loader = true;
      this.configService.fetchBanks().subscribe((res) => {
        this.loader = false;
        this.investmentSetupBankList = res.body.data;
      });
    }
  }

  fetchUserInfo(id: number) {
    this.requestLoader = true;
    this.userService.getUserInfo(id).subscribe(
      (res) => {
        this.requestLoader = false;
        this.user = res.body;

        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  getAppOwnerDetails() {
    this.configService.getAppOwnerInfo().subscribe((res) => {
      this.appOwner = res.body;
      this._patchCodeForm(this.appOwner);
    });
  }

  bankChange(event: any) {
    const selectedOptions = event.target.options;
    const selectedIndex = selectedOptions.selectedIndex;
    const selectElementText = selectedOptions[selectedIndex].text;
    this.investmentSetupForm.get("bankSortCode").setValue(event.target.value);
    this.investmentSetupForm.get("bankName").setValue(selectElementText);
    this.validateBankAccountNumber();
  }

  validateBankAccountNumber() {
    if (
      this.investmentSetupForm.get("bankSortCode").value &&
      this.investmentSetupForm.get("bankAccountNumber").value
    ) {
      this.bankAccountValidationLoader = true;
      this.invService
        .verifyAccount({
          bankSortCode: this.investmentSetupForm.get("bankSortCode").value,
          accountNumber:
            this.investmentSetupForm.get("bankAccountNumber").value,
          userId: this.investmentSetupForm.get("userId").value,
        })
        .subscribe(
          (res: any) => {
            this.bankAccountValidationLoader = false;

            if (res.body && res.body.hasOwnProperty("account_name")) {
              this.investmentSetupForm
                .get("bankAccountName")
                .setValue(res.body ? res.body.account_name : "");
            }
          },
          (err) => {
            this.bankAccountValidationLoader = false;
          }
        );
    }
  }

  investmentSetupFormInit(data?: InvestmentInfoSetupDto) {
    this.investmentSetupForm = new UntypedFormGroup({
      investmentThresholdAmount: new UntypedFormControl(
        data?.investmentThresholdAmount || "",
        [Validators.required]
      ),
      ePaymentLimitAmount: new UntypedFormControl(
        data?.ePaymentLimitAmount || "",
        [Validators.required]
      ),
      bankSortCode: new UntypedFormControl(data?.bankSortCode || "", [
        Validators.required,
      ]),
      bankAccountNumber: new UntypedFormControl(data?.bankAccountNumber || "", [
        Validators.required,
      ]),
      userId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      bankName: new UntypedFormControl(data?.bankName || "", [
        Validators.required,
      ]),
      bankAccountName: new UntypedFormControl(data?.bankAccountName || "", [
        Validators.required,
      ]),
      bank: new UntypedFormControl(data?.bankSortCode, [Validators.required]),
      sendNotification: new UntypedFormControl(data?.sendNotification || false),
    });
  }

  investmentCertSetupInit(data?: InvestmentCertificateInfoSetup): void {
    this.certSetupForm = new UntypedFormGroup({
      signatoryName: new UntypedFormControl(data ? data.signatoryName : null),
      signatoryRole: new UntypedFormControl(data ? data.signatoryRole : null),
      displaySignatoryName: new UntypedFormControl(data ? data.displaySignatoryName : false)
    });

    this.certSetupForm.get('displaySignatoryName').valueChanges
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: any) => {
        if (res) {
          this.certSetupForm.get('signatoryName')
            .addValidators([Validators.required, Validators.maxLength(255)]);
          this.certSetupForm.get('signatoryRole')
            .addValidators([Validators.required, Validators.maxLength(255)]);
        } else {
          this.certSetupForm.get('signatoryName').clearValidators();
          this.certSetupForm.get('signatoryRole').clearValidators();
        }
        this.certSetupForm.updateValueAndValidity();
      })
  }

  getInvestmentSetupInfo() {
    this.configService
      .fetchInvestmentSetupInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.investmentSetupFormInit(res.body?.data?.investmentInfoSetupDto);
          this.investmentCertSetupInit(res.body?.data?.investmentCertificateInfoSetup);
        },
      });
  }

  updateInvestmentSetupInfo() {
    this.loader = true;
    this.configService
      .updateInvestmentSetup(this.investmentSetupForm.value)
      .subscribe(
        (_) => {
          this.loader = false;
          swal.fire("Success", "Update was successful", "success");
        },
        (err) => {
          this.loader = false;
          swal.fire("Error", err.error.Message, "error");
        }
      );
  }

  getFileName(response: HttpResponse<Blob>) {
    let filename: string;
    try {
      const contentDisposition: string = response.headers.get(
        "Content-Disposition"
      );
      filename = contentDisposition
        .split(";")[1]
        .split("filename")[1]
        .split("=")[1]
        .trim();
    } catch (e) {
      filename = "Bulk Investment Template.xlsx";
    }
    return filename;
  }

  downloadTemplate() {
    this.downloading = true;
    this.loader = true;
    this.invService
      .getInvTemplate()
      .pipe(takeUntil(this._unsubsriber$))
      .subscribe(
        (res) => {
          const fileName = `investment-upload-template-${moment().format(
            "YYYY-MM-DD-HH:mm:ss"
          )}`;
          saveAs(res.body, fileName);
          this.downloading = false;
        },
        () => (this.loader = false)
      );
  }

  onFileSelect(event) {
    let af = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!_.includes(af, file.type)) {
        swal.mixin({
          type: "info",
          title: "Only EXCEL Docs Allowed!",
          timer: 3000,
        });
      } else {
        this.fileInputLabel = file.name;
        this.fileInput = file;
      }
    }
  }

  removeFile() {
    this.fileInput = null;
    this.fileInputLabel = null;
  }

  openModal(content, options?) {
    this.modalService.open(content, options);
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  uploadEvents() {
    if (this.fileInput !== null) {
      this.uploading = true;
      const form = new FormData();
      form.append("File", this.fileInput, this.fileInput.name);
      this.invService
        .importInvestments(form)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              title: "Success",
              text: res.body,
            });
            this.uploading = false;
          },
          (err) => {
            this.uploading = false;
            this.importErrorData = handleImportError(err.error);
            if (this.importErrorData.length > 0) {
              this.openModal(this.importErrorsModal, {
                centered: true,
                size: "lg",
                scrollable: true,
              });
            }
          }
        );
    } else {
      swal.mixin({
        type: "info",
        text: "You have not selected any file to upload.",
      });
    }
  }

  toggleSwitch(value: boolean, type: string) {
    if (type === "certificate") {
      this.certSetupForm.get("displaySignatoryName").setValue(value);
    }
  }
  submitCertSetupForm(): void {
    this.savingCertificate = true;
    this.certSetupForm.disable();

    const data = this.certSetupForm.value;

    this.configService.updateInvestmentSignatorySetup(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.toast.fire({
            titleText: 'Signatory setup updated successfully.',
            type: 'success'
          });
          this.savingCertificate = false;
          this.certSetupForm.enable();
        },
        error: () => {
          this.savingCertificate = false;
          this.certSetupForm.enable();
        }
      })
  }

  ngOnDestroy(): void {
    this._unsubsriber$.next();
    this._unsubsriber$.complete();
  }
}
