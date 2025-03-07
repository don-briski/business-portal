import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormBuilder,
  FormGroup,
  FormControl,
} from "@angular/forms";
import { LoanoperationsService } from "../../../service/loanoperations.service";

import Swal from "sweetalert2";
import swal from "sweetalert2";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EncryptService } from "src/app/service/encrypt.service";
import { SmsSetupInterface } from "../models/sms-setup.interface";
import { GenericSmsEvent } from "../models/sms-events.interface";
import { SmsProviders } from "../models/sms-providers.enum";
import {
  AfricasTalkingInterface,
  MultiTexterSmsInterface,
} from "../models/sms-provider-info.interface";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { toFormData } from "src/app/util/finance/financeHelper";
import { DecideSetup } from "../models/decideSetup.interface";
import { TabBarService } from "../../shared/components/tab-bar/tab-bar.service";
import { Tab, User } from "../../shared/shared.types";
import {
  RemitaSetup,
  RemitaIntegrationNameEnum,
  RemitaData,
  Integration,
  IntegrationNameEnum,
} from "src/app/model/configuration";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { TransactionPinComponent } from "src/app/library/transaction-pin/transaction-pin.component";
import { PaystackInfo, VerifyBankAccount } from "../models/configuration";
@Component({
  selector: "app-settings-page",
  templateUrl: "./settings-page.component.html",
  styleUrls: ["./settings-page.component.scss"],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  @ViewChild("confirmPin") confirmPin: TransactionPinComponent;
  @ViewChild("newPin") newPin: TransactionPinComponent;
  public user: User;
  profilePicture: any = 'assets/images/placeholder.jpg';
  profilePicturePreview: any = 'assets/images/placeholder.jpg';
  public password = null;
  public newTransactionKey = null;
  public confirmTransactionKey = null;
  public profileForm: UntypedFormGroup;
  selectedPictureName: string;
  public passwordForm: UntypedFormGroup;
  validatingPw = false;
  public paystackForm: UntypedFormGroup;
  public africaIsTalkingForm: UntypedFormGroup;
  public multitexterForm: UntypedFormGroup;
  public remitaInflightForm: UntypedFormGroup;
  public remitaDirectDebitForm: UntypedFormGroup;
  public firstCentralForm: UntypedFormGroup;
  public creditRegistryForm: UntypedFormGroup;
  public businessInfoForm: UntypedFormGroup;
  public notificationForm: UntypedFormGroup;
  public questionForm: UntypedFormGroup;
  public ApiAccessForm: UntypedFormGroup;
  public EditApiAccessForm: UntypedFormGroup;
  public youVerifyForm = new FormGroup({
    apiSecretKey: new FormControl("", [Validators.required]),
    isActive: new FormControl(false),
    integrationId: new FormControl(0),
  });
  public loader = false;
  public keyLoader = false;
  public bankAccountValidationLoader = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  public passwordLoader = false;
  requestLoader: boolean;
  public root = "https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/";
  businessLogo: any = "assets/images/logo-blue.png";
  httpFailureError = false;
  loggedInUser: any;
  appOwner: any;
  fileData: File = null;
  fileUploadProgress: string = null;
  fileSelected = false;
  profileImageSelected = false;
  statusLoader = false;
  selectedTheme: string = "";
  defaultBvnLoader = false;
  specificView = "profile";
  bankDetailsTabBanks: any[] = [];
  decideInfo: DecideSetup;

  appOwnerIntegrationData: any;
  okraData: any;
  okraInnerData: any;
  aliasError = false;
  public okraForm: UntypedFormGroup;
  apiLists: any[] = [];
  dropdownSettings: {};
  apiKeyScope = [];
  apiLoader = false;
  public calendlyForm: UntypedFormGroup;
  calendlyEmail: string;
  calendlyLoader = false;
  bvnIntegrationPartners = {
    youVerify: "YouVerify",
    paystack: "Paystack",
  };
  bvnInput = "";
  templateLoader: boolean;
  smsProviders = SmsProviders;
  presetThemes = [
    {
      name: "Exotic",
      style: { background: "linear-gradient(45deg, #244E97 40%, #FF015B 65%)" },
      primaryColor: "#244E97",
      secondaryColor: "#FF015B",
      accentColor: "#FF015B",
    },
    {
      name: "Blue Sunset",
      style: { background: "linear-gradient(45deg, #36688D 40%, #BDA589 65%)" },
      primaryColor: "#36688D",
      secondaryColor: "#BDA589",
      accentColor: "#BDA589",
    },
    {
      name: "Sunset",
      style: { background: "linear-gradient(45deg, #6465a5 40%, #f05837 65%)" },
      primaryColor: "#6465a5",
      secondaryColor: "#f05837",
      accentColor: "#E35933",
    },
    {
      name: "Green",
      style: { background: "linear-gradient(45deg, #16A57E 40%, #0F795C 65%)" },
      primaryColor: "#16a57e",
      secondaryColor: "#0f795c",
      accentColor: "#fff",
    },
  ];
  customSecColor: any = "#d8d8d8";
  customPriColor: any = "#d8d8d8";
  presetThemePrimaryColor: string;
  presetThemeSecondaryColor: string;
  customBg = {
    background: `linear-gradient(45deg, ${this.customSecColor} 40%, ${this.customPriColor} 65%)`,
  };

  currentTheme: ColorThemeInterface;
  subs$ = new Subject<void>();
  showButtons: boolean;
  savingThemeStatus: boolean = false;
  is2FaSetutup: boolean;
  twoFacStep1: boolean = true;
  twoFacStep2: boolean;
  twoFacStep3: boolean;
  twoFacForm: UntypedFormGroup;
  sendingOTP: boolean;
  sentOTP: boolean;
  activatingOTP: boolean;
  appOwner2FASetup = {
    isActive: false,
    isActiveForStaff: false,
    isActiveForCustomer: false,
  };
  updating2faConfig: boolean;
  twoFactorResendTimer: number;
  appInactivityTimeoutSeconds: number;
  timeoutLoader: boolean = false;
  timeoutRangeError: string = "";
  remitaCurrentTabId = "inflight-collections-remita";
  tabs: Tab[] = [
    {
      id: "inflight-collections-remita",
      text: "Inflight Collections - Remita",
    },
    {
      id: "automatic-direct-debit-remita",
      text: "Automatic Direct Debit - Remita",
    },
  ];
  isUpdatingRemitaInflightInfo = false;
  isUpdatingRemitaDirectDebitInfo = false;
  isUpdatingRemitaInflightStatus = false;
  isUpdatingRemitaDirectDebitStatus = false;
  isGettingRemitaInflightInfo = false;
  isGettingRemitaDirectDebitInfo = false;
  remitaBanks: CustomDropDown[] = [];
  isFetchingRemitaBanks = false;
  activeRemitaInflightBank: CustomDropDown;
  activeRemitaDirectDebitBank: CustomDropDown;
  smsTemplateSyntaxStrings: string[] = [];
  paystackInfo: PaystackInfo | any;
  integrations: Integration[] = [];
  loadingState: { text: string; key: string; isLoading: boolean };
  dojahSetup: Integration;
  kudaInfo: Integration;
  seerbitSetup: Integration;
  termiiConfig: Integration;
  monoConfig: Integration;
  multiTexterConfig: Integration;
  africaTalkingConfig: Integration;
  youVerifyConfig: Integration;

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private userService: UserService,
    private tabBarService: TabBarService,
    private router: Router,
    private route: ActivatedRoute,
    private loanoperationService: LoanoperationsService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private encrypt: EncryptService,
    private colorThemeService: ColorThemeService,
    private readonly loanOperationsService: LoanoperationsService
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.route.paramMap.subscribe((params: ParamMap) => {
      if (params.get("page") !== "" && params.get("page") !== null) {
        this.specificView = params.get("page");
      }
    });

    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe((res) => {
      if (!res) {
        // this.httpFailureError = true;
      }
    });
    this.fetchUserInfo();
    this.getAppOwnerDetails();
    this.getAppOwnerInfo();
    this.paystackFormInit();
    this.africaIsTalkingFormInit();
    this.multitexterFormInit();
    this.initRemitaInflightForm();
    this.initRemitDirectDebitForm();
    this.firstCentralFormInit();
    this.creditRegistryFormInit();
    this.businessInfoFormInit();
    this.passwordFormInit();
    this.notificationFormInit();
    this.initApiAccessForm();
    this.init2FAForm();

    this.dropdownSettings = {
      singleSelection: false,
      lazyLoading: true,
      text: "Select Api Scope",
      selectAllText: "Select All Scope",
      unSelectAllText: "UnSelect All",
      enableSearchFilter: true,
      classes: "custom-class-example",
    };
    this.getRemitaInflightInfo();
    this.getRemitaDirectDebitInfo();
    this.listenForRemitaTabSwitch();
    this.getRemitaBanks();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  listenForRemitaTabSwitch() {
    this.tabBarService.tabSwitched.pipe(takeUntil(this.subs$)).subscribe({
      next: (id) => {
        this.remitaCurrentTabId = id.tabId;
      },
    });
  }

  checkRange(value: number) {
    if (value < 60 || value > 600) {
      this.timeoutRangeError = "Value is Out of Range!";
    } else {
      this.timeoutRangeError = "";
    }
  }

  updateTimeoutSettings(): void {
    this.timeoutLoader = true;
    this.configService
      .updateTimeoutSettings({
        appInactivityTimeoutSeconds: this.appInactivityTimeoutSeconds,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.configService.timeoutUpdated$.next(true);
          this.timeoutLoader = false;
          this.toast.fire({
            type: "success",
            title: "Timeout Updated Successfully",
            timer: 3000,
          });
        },
        (error) => (this.timeoutLoader = false)
      );
  }

  getAppOwnerInfo(): void {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.decideInfo = res.body.decideInfo;
        this.appInactivityTimeoutSeconds = res.body.appInactivityTimeoutSeconds;
        this.smsTemplateSyntaxStrings = res.body.smsTemplateSyntaxStrings;
      });
  }

  spoolApiKeyScope() {
    this.configService.spoolApiKeyScore().subscribe(
      (res: any) => {
        res.body.data.forEach((ele, key) => {
          this.apiKeyScope.push({ id: key, itemName: ele });
        });
      },
      (err) => {
        this.toast.fire({
          type: "error",
          title: err.error.message,
        });
      }
    );
  }

  spoolUserApiList() {
    this.configService.spoolUserApiList().subscribe(
      (res: any) => {
        this.apiLists = res.body.data;
      },
      (err) => {
        this.toast.fire({
          type: "error",
          title: err.error.message,
        });
      }
    );
  }

  // Reasons

  initCalendlyForm() {
    this.calendlyEmail =
      this.appOwner?.calendlyIntegrationInfo !== null &&
      this.appOwner?.calendlyIntegrationInfo
        ? this.appOwner.calendlyIntegrationInfo.emailMessage
        : `Hello [name],<br/>
    Kindly schedule a meeting with us using this [link]. <br/>Thank you.`;
    this.calendlyForm = new UntypedFormGroup({
      Url: new UntypedFormControl(
        this.appOwner?.calendlyIntegrationInfo !== null &&
        this.appOwner?.calendlyIntegrationInfo
          ? this.appOwner.calendlyIntegrationInfo.url
          : "",
        [Validators.required]
      ),
      EmailMessage: new UntypedFormControl(this.calendlyEmail, [
        Validators.required,
      ]),
      Token: new UntypedFormControl(
        this.appOwner?.calendlyIntegrationInfo !== null &&
        this.appOwner?.calendlyIntegrationInfo
          ? this.appOwner.calendlyIntegrationInfo.token
          : "",
        []
      ),
    });
  }

  saveCalendlyForm() {
    this.calendlyLoader = true;
    this.configService.saveCalendlyForm(this.calendlyForm.value).subscribe(
      (res) => {
        Swal.fire("Successful", res.body.message, "success");
        this.calendlyLoader = false;
      },
      (err) => {
        Swal.fire("Successful", err.error, "success");
        this.calendlyLoader = false;
      }
    );
  }

  initApiAccessForm() {
    this.ApiAccessForm = new UntypedFormGroup({
      Name: new UntypedFormControl("", [Validators.required]),
      Description: new UntypedFormControl(""),
      ScopeData: new UntypedFormControl("", [Validators.required]),
      IsActive: new UntypedFormControl("", [Validators.required]),
    });
  }

  initEditApiAccessForm(data: any) {
    this.EditApiAccessForm = new UntypedFormGroup({
      Id: new UntypedFormControl(data.id, [Validators.required]),
      Name: new UntypedFormControl(data.name, [Validators.required]),
      Description: new UntypedFormControl(data.description),
      ScopeData: new UntypedFormControl(JSON.parse(data.scopeData), [
        Validators.required,
      ]),
      IsActive: new UntypedFormControl(data.isActive, [Validators.required]),
    });
  }

  saveEditApiAccessKey() {
    this.apiLoader = true;
    if (this.EditApiAccessForm.valid) {
      let data = this.EditApiAccessForm.value;
      data.branchId = this.user.branchId;

      this.configService.saveEditApiAccessKeyForm(data).subscribe(
        (res) => {
          this.spoolUserApiList();
          this.modalService.dismissAll();
          this.apiLoader = false;
          this.toast.fire({
            type: "success",
            title: "Api update was successful",
          });
        },
        (err) => {
          this.apiLoader = false;
          this.toast.fire({
            type: "error",
            title: err.error.message,
          });
        }
      );
    }
  }

  saveApiAccessKey() {
    this.apiLoader = true;
    if (this.ApiAccessForm.valid) {
      let data = this.ApiAccessForm.value;
      data.branchId = this.user.branchId;
      this.configService.saveApiAccessKeyForm(data).subscribe(
        (res) => {
          this.spoolUserApiList();
          this.modalService.dismissAll();
          this.initApiAccessForm();
          this.apiLoader = false;
          this.toast.fire({
            type: "success",
            title: "Api key was successfully created",
          });
        },
        (err) => {
          this.apiLoader = false;
          this.toast.fire({
            type: "error",
            title: err.error.message,
          });
        }
      );
    }
  }

  notificationFormInit() {
    this.notificationForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      Duration: new UntypedFormControl("", [Validators.required]),
    });
  }

  notificationFormSave(val) {
    this.keyLoader = true;
    this.configService
      .updateNotification(this.notificationForm.value)
      .subscribe(
        (res) => {
          this.keyLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.keyLoader = false;
        }
      );
  }

  fetchUserInfo() {
    this.requestLoader = true;
    this.userService.getUserInfo(this.loggedInUser?.nameid, {fromDb: true}).subscribe(
      (res) => {
        this.requestLoader = false;
        this.user = res.body;
        this.profilePicture = this.getUserProfilePicture();
        this.profilePicturePreview = this.getUserProfilePicture();
        this.getAllAppOwnerIntegration(this.user.appOwnerKey);
        this.profileFormInit();
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  profileFormInit() {
    this.profileForm = new UntypedFormGroup({
      FirstName: new UntypedFormControl(this.user.person.firstName, [
        Validators.required,
      ]),
      LastName: new UntypedFormControl(this.user.person.lastName, [
        Validators.required,
      ]),
      MiddleName: new UntypedFormControl(this.user.person.middleName, []),
      PhoneNumber: new UntypedFormControl(this.user.person.phoneNumber, [
        Validators.required,
      ]),
      ProfilePic: new UntypedFormControl(this.user.person.profilePic, []),
      EmailAddress: new UntypedFormControl(this.user.person.emailAddress, [
        Validators.required,
        Validators.email,
      ]),
      DateOfBirth: new UntypedFormControl(this.user.person.dateOfBirth, [
        Validators.required,
      ]),
      UserId: new UntypedFormControl(this.user.userId, [Validators.required]),
      PersonId: new UntypedFormControl(this.user.person.personId, [
        Validators.required,
      ]),
    });
  }

  submitQueryRequest(type, message) {
    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: message,
        title: "Background Event",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.requestLoader = true;

          const model = {
            Type: type,
            UserId: this.user.userId,
          };

          this.loanoperationService.ForceBackgroundEvent(model).subscribe(
            (res) => {
              this.requestLoader = false;
              swal.fire({
                type: "success",
                text: res.body.value.feedbackmessage,
                title: "Finished!",
              });
            },
            (err) => {
              this.requestLoader = false;
            }
          );
        }
      });
  }

  passwordFormInit() {
    this.passwordForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      currentPassword: new UntypedFormControl("", [Validators.required]),
      Password: new UntypedFormControl("", [Validators.required]),
      ConfirmPassword: new UntypedFormControl("", [Validators.required]),
    });
  }

  paystackFormInit() {
    this.paystackForm = new UntypedFormGroup({
      secretKey: new UntypedFormControl("", [Validators.required]),
      publicKey: new UntypedFormControl("", [Validators.required]),
    });
  }
  public africaIsTalkingFormInit(): void {
    this.africaIsTalkingForm = new UntypedFormGroup({
      userName: new UntypedFormControl("", [Validators.required]),
      apiKey: new UntypedFormControl("", [Validators.required]),
      senderId: new UntypedFormControl("", [Validators.required]),
    });
  }
  public multitexterFormInit(): void {
    this.multitexterForm = new UntypedFormGroup({
      userName: new UntypedFormControl("", [Validators.required]),
      apiKey: new UntypedFormControl("", [Validators.required]),
      password: new UntypedFormControl("", [Validators.required]),
      senderName: new UntypedFormControl("", [Validators.required]),
      useApiKey: new UntypedFormControl(false),
    });
  }

  initRemitaInflightForm(initialData?: RemitaData) {
    this.remitaInflightForm = this.fb.group({
      remitaInfo: this.fb.group({
        userName: new UntypedFormControl(
          initialData?.remitaInfo?.userName || "",
          Validators.required
        ),
        merchantID: new UntypedFormControl(
          initialData?.remitaInfo?.merchantID || "",
          Validators.required
        ),
        serviceTypeID: new UntypedFormControl(
          initialData?.remitaInfo?.serviceTypeID || "",
          Validators.required
        ),
        apiKey: new UntypedFormControl(
          initialData?.remitaInfo?.apiKey || "",
          Validators.required
        ),
        apiToken: new UntypedFormControl(
          initialData?.remitaInfo?.apiToken || "",
          Validators.required
        ),
        isActive: new UntypedFormControl(initialData?.remitaInfo?.isActive),
      }),
      bankDetails: this.fb.group({
        accountNumber: new UntypedFormControl(
          initialData?.bankDetails?.accountNumber || "",
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(10),
            Validators.pattern("^[0-9]*$"),
          ]
        ),
        bankCode: new UntypedFormControl(
          initialData?.bankDetails?.bankCode || "",
          Validators.required
        ),
        accountName: new UntypedFormControl(
          initialData?.bankDetails?.accountName || "",
          Validators.required
        ),
        bankName: new UntypedFormControl(
          initialData?.bankDetails?.bankName || "",
          Validators.required
        ),
      }),
    });
  }
  initRemitDirectDebitForm(initialData?: RemitaData) {
    this.remitaDirectDebitForm = this.fb.group({
      remitaInfo: this.fb.group({
        userName: new UntypedFormControl(
          initialData?.remitaInfo?.userName || "",
          Validators.required
        ),
        merchantID: new UntypedFormControl(
          initialData?.remitaInfo?.merchantID || "",
          Validators.required
        ),
        serviceTypeID: new UntypedFormControl(
          initialData?.remitaInfo?.serviceTypeID || "",
          Validators.required
        ),
        apiKey: new UntypedFormControl(
          initialData?.remitaInfo?.apiKey || "",
          Validators.required
        ),
        apiToken: new UntypedFormControl(
          initialData?.remitaInfo?.apiToken || "",
          Validators.required
        ),
        isActive: new UntypedFormControl(initialData?.remitaInfo?.isActive),
      }),
      bankDetails: this.fb.group({
        accountNumber: new UntypedFormControl(
          initialData?.bankDetails?.accountNumber || "",
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(10),
            Validators.pattern("^[0-9]*$"),
          ]
        ),
        bankCode: new UntypedFormControl(
          initialData?.bankDetails?.bankCode || "",
          Validators.required
        ),
        accountName: new UntypedFormControl(
          initialData?.bankDetails?.accountName || "",
          Validators.required
        ),
        bankName: new UntypedFormControl(
          initialData?.bankDetails?.bankName || "",
          Validators.required
        ),
      }),
    });
  }
  firstCentralFormInit() {
    this.firstCentralForm = new UntypedFormGroup({
      userName: new UntypedFormControl("", [Validators.required]),
      password: new UntypedFormControl("", [Validators.required]),
    });
  }
  creditRegistryFormInit() {
    this.creditRegistryForm = new UntypedFormGroup({
      emailAddress: new UntypedFormControl("", [Validators.required]),
      password: new UntypedFormControl("", [Validators.required]),
      subscriberId: new UntypedFormControl("", [Validators.required]),
    });
  }
  businessInfoFormInit() {
    this.businessInfoForm = new UntypedFormGroup({
      appOwnerId: new UntypedFormControl("", [Validators.required]),
      appOwnerEmail: new UntypedFormControl("", [Validators.required]),
      appOwnerName: new UntypedFormControl("", [Validators.required]),
      appOwnerAlias: new UntypedFormControl("", [Validators.required]),
      appOwnerPersonCode: new UntypedFormControl("", [Validators.required]),
      appOwnerPhone: new UntypedFormControl("", [Validators.required]),
      appOwnerShippingAddress: new UntypedFormControl(""),
      appOwnerBillingAddress: new UntypedFormControl(""),
      logoUrl: new UntypedFormControl(""),

      appOwnerBankCode: new UntypedFormControl(""),
      appOwnerBankName: new UntypedFormControl(""),
      appOwnerAccountNumber: new UntypedFormControl(""),
      appOwnerAccountName: new UntypedFormControl(""),
      ofiCode: new UntypedFormControl(null, [
        Validators.pattern("(?=[9])(?=[^0-9]*[0-9]).{6}"),
      ]),
    });
  }

  cancelFile() {
    this.fileData = null;
    if (this.appOwner.logoUrl !== null) {
      this.businessLogo = this.appOwner.logoUrl;
    } else {
      this.businessLogo = "assets/images/logo-blue.png";
    }
    this.fileSelected = false;
  }
  selectBank(sortCode: any) {
    let bank;
    bank = this.bankDetailsTabBanks.find((x) => x.sortCode == sortCode);
    this.businessInfoForm.get("appOwnerBankCode").setValue(bank.sortCode);
    this.businessInfoForm.get("appOwnerBankName").setValue(bank.bankName);
  }
  validateAccountName() {
    this.passwordLoader = true;
    const sortCode = this.businessInfoForm.get("appOwnerBankCode").value;
    const accountNumber = this.businessInfoForm.get(
      "appOwnerAccountNumber"
    ).value;
    const id = this.loggedInUser.nameid;
    const payload: VerifyBankAccount = { sortCode, accountNumber };
    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.passwordLoader = false;
          this.businessInfoForm
            .get("appOwnerAccountName")
            .setValue(res.body.data.accountName);
          this.updateBusinessInfo();
        },
        (err) => {
          this.passwordLoader = false;
          this.toast.fire({
            type: "error",
            title: "Invalid account details.",
          });
        }
      );
  }

  copyToClipboard(val: string, text: string = "Link copied to clipboard.") {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.toast.fire({
      type: "success",
      title: text,
    });
  }

  updatePaystackStatus() {
    this.statusLoader = true;
    const status = !this.paystackInfo.isActive;
    this.configService.updatePaystackStatus(status).subscribe(
      () => {
        this.statusLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAllIntegrations();
      },
      (err) => {
        this.statusLoader = false;
      }
    );
  }

  updateYouVerifyStatus(isActive: boolean) {
    this.statusLoader = true;
    const updateData = {
      ...this.youVerifyForm.value,
      isActive,
    };
    this.configService
      .updateIntegration(updateData)
      .subscribe(
        (res) => {
          this.statusLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.youVerifyForm.patchValue(updateData)
        },
        (err) => {
          this.statusLoader = false;
        }
      );
  }

  getRemitaBanks() {
    this.isFetchingRemitaBanks = true;

    this.loanOperationsService
      .getBanksAsJson()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.remitaBanks = res.body.map((bank) => ({
            id: bank.BankCode,
            text: bank.BankName,
          }));

          this.isFetchingRemitaBanks = false;
        },
        error: () => {
          this.isFetchingRemitaBanks = false;
        },
      });
  }

  onSelectRemitaBank(
    value: CustomDropDown,
    applyTo: "remita-inflight" | "remita-direct-debit"
  ) {
    if (applyTo === "remita-inflight") {
      this.remitaInflightForm.get("bankDetails.bankCode").setValue(value.id);
      this.remitaInflightForm.get("bankDetails.bankName").setValue(value.text);
    } else if (applyTo === "remita-direct-debit") {
      this.remitaDirectDebitForm.get("bankDetails.bankCode").setValue(value.id);
      this.remitaDirectDebitForm
        .get("bankDetails.bankName")
        .setValue(value.text);
    }
  }

  onDeselectRemitaBank(applyTo: "remita-inflight" | "remita-direct-debit") {
    if (applyTo === "remita-inflight") {
      this.remitaInflightForm.get("bankDetails").reset();
    } else if (applyTo === "remita-direct-debit") {
      this.remitaDirectDebitForm.get("bankDetails").reset();
    }
  }

  getRemitaInflightInfo() {
    this.isGettingRemitaInflightInfo = true;
    this.configService
      .getRemitaInfo(RemitaIntegrationNameEnum.InflightCollectionsRemita)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          const data = res.body.data?.remitaData;
          this.initRemitaInflightForm(data);
          if (data) {
            this.activeRemitaInflightBank = {
              id: data?.bankDetails?.bankCode,
              text: data?.bankDetails?.bankName,
            };
          }
          this.isGettingRemitaInflightInfo = false;
        },
        error: () => {
          this.isGettingRemitaInflightInfo = false;
        },
      });
  }

  getRemitaDirectDebitInfo() {
    this.isGettingRemitaDirectDebitInfo = true;
    this.configService
      .getRemitaInfo(RemitaIntegrationNameEnum.AutomaticDirectDebitRemita)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          const data = res.body.data?.remitaData;
          this.initRemitDirectDebitForm(data);
          if (data) {
            this.activeRemitaDirectDebitBank = {
              id: data?.bankDetails?.bankCode,
              text: data?.bankDetails?.bankName,
            };
          }
          this.isGettingRemitaDirectDebitInfo = false;
        },
        error: () => {
          this.isGettingRemitaDirectDebitInfo = false;
        },
      });
  }

  updateRemitaInflightInfo() {
    this.isUpdatingRemitaInflightInfo = true;
    this.configService
      .updateRemitaInfo({
        integrationName: RemitaIntegrationNameEnum.InflightCollectionsRemita,
        data: this.remitaInflightForm.value,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.toast.fire({
            type: "success",
            title: "Update was successful!",
          });

          this.getRemitaInflightInfo();
          this.isUpdatingRemitaInflightInfo = false;
        },
        () => {
          this.isUpdatingRemitaInflightInfo = false;
        }
      );
  }

  updateRemitaDirectDebitInfo() {
    this.isUpdatingRemitaDirectDebitInfo = true;
    this.configService
      .updateRemitaInfo({
        integrationName: RemitaIntegrationNameEnum.AutomaticDirectDebitRemita,
        data: this.remitaDirectDebitForm.value,
      })
      .subscribe(
        () => {
          this.toast.fire({
            type: "success",
            title: "Update was successful!",
          });

          this.getRemitaDirectDebitInfo();
          this.isUpdatingRemitaDirectDebitInfo = false;
        },
        () => {
          this.isUpdatingRemitaDirectDebitInfo = false;
        }
      );
  }

  updateRemitaInflightStatus(status: boolean) {
    this.isUpdatingRemitaInflightStatus = true;
    this.configService
      .updateRemitaStatus({
        activate: status,
        integrationName: RemitaIntegrationNameEnum.InflightCollectionsRemita,
      })
      .subscribe(
        () => {
          this.isUpdatingRemitaInflightStatus = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getRemitaInflightInfo();
        },
        () => {
          this.isUpdatingRemitaInflightStatus = false;
        }
      );
  }

  updateRemitaDirectDebitStatus(status: boolean) {
    this.isUpdatingRemitaDirectDebitStatus = true;
    this.configService
      .updateRemitaStatus({
        activate: status,
        integrationName: RemitaIntegrationNameEnum.AutomaticDirectDebitRemita,
      })
      .subscribe(
        (res) => {
          this.isUpdatingRemitaDirectDebitStatus = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getRemitaDirectDebitInfo();
        },
        (err) => {
          this.isUpdatingRemitaDirectDebitStatus = false;
        }
      );
  }

  updateFirstCentralStatus(status: boolean) {
    this.statusLoader = true;
    this.configService.updatePFCStatus(status).subscribe(
      (res) => {
        this.statusLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAppOwnerDetails();
      },
      (err) => {
        this.statusLoader = false;
      }
    );
  }
  updateCreditRegStatus(status: boolean) {
    this.statusLoader = true;
    this.configService.updateCreditRegistrytatus(status).subscribe(
      (res) => {
        this.statusLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAppOwnerDetails();
      },
      (err) => {
        this.statusLoader = false;
      }
    );
  }

  setCustomColors(customColors) {
    const primaryColor = customColors.PrimaryColor.toLowerCase();
    const secondaryColor = customColors.SecondaryColor.toLowerCase();

    const primaryIndex = this.presetThemes.findIndex(
      (theme) => primaryColor == theme.primaryColor
    );
    const secondaryIndex = this.presetThemes.findIndex(
      (theme) => secondaryColor == theme.secondaryColor
    );

    if (primaryIndex === -1 && secondaryIndex === -1) {
      this.customPriColor = primaryColor;
      this.customSecColor = secondaryColor;
    } else {
      this.customSecColor = "#d8d8d8";
      this.customPriColor = "#d8d8d8";
    }
  }

  getAppOwnerDetails() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.appOwner = res.body;
        if (this.appOwner?.appOwnerCustomColors)
          this.appOwner.appOwnerCustomColors = JSON.parse(
            this.appOwner?.appOwnerCustomColors
          );
        if (this.appOwner?.bankInformation)
          this.appOwner.bankInformation = JSON.parse(
            this.appOwner?.bankInformation
          );
        if (this.appOwner?.appOwnerRemitaInfo)
          this.appOwner.appOwnerRemitaInfo = JSON.parse(
            this.appOwner?.appOwnerRemitaInfo
          );

        if (this.appOwner?.smsSetupInfo)
          this.appOwner.smsSetupInfo = JSON.parse(this.appOwner?.smsSetupInfo);
        if (this.appOwner?.appOwnerYouVerifyInfo)
          this.appOwner.appOwnerYouVerifyInfo = JSON.parse(
            this.appOwner?.appOwnerYouVerifyInfo
          );
        if (this.appOwner?.appOwnerFirstCentralInfo)
          this.appOwner.appOwnerFirstCentralInfo = JSON.parse(
            this.appOwner?.appOwnerFirstCentralInfo
          );
        if (this.appOwner?.appOwnerCreditRegistryInfo)
          this.appOwner.appOwnerCreditRegistryInfo = JSON.parse(
            this.appOwner?.appOwnerCreditRegistryInfo
          );
        if (this.appOwner?.calendlyIntegrationInfo)
          this.appOwner.calendlyIntegrationInfo = JSON.parse(
            this.appOwner?.calendlyIntegrationInfo
          );

        this.setCustomColors(this.appOwner.appOwnerCustomColors);
        this.appOwner.remitaInfo = this.appOwner.appOwnerRemitaInfo;
        this.appOwner.firstCentralInfo = this.appOwner.appOwnerFirstCentralInfo;
        this.appOwner.creditRegistryInfo =
          this.appOwner.appOwnerCreditRegistryInfo;

        this.appOwner2FASetup = this.appOwner?._appOwner2FASetup;

        // Set business logo
        if (this.appOwner.logoUrl !== null) {
          this.businessLogo = this.appOwner.logoUrl;
        }

        // Set business info
        if (this.appOwner !== null) {
          this.businessInfoForm.controls.appOwnerId.setValue(
            this.appOwner.appOwnerId
          );
          this.businessInfoForm.controls.appOwnerAlias.setValue(
            this.appOwner.appOwnerAlias
          );
          this.businessInfoForm.controls.appOwnerName.setValue(
            this.appOwner.appOwnerName
          );
          this.businessInfoForm.controls.appOwnerEmail.setValue(
            this.appOwner.appOwnerEmail
          );
          this.businessInfoForm.controls.appOwnerPersonCode.setValue(
            this.appOwner.appOwnerPersonCode
          );
          this.businessInfoForm.controls.appOwnerPhone.setValue(
            this.appOwner.appOwnerPhone
          );
          this.businessInfoForm.controls.appOwnerShippingAddress.setValue(
            this.appOwner.appOwnerShippingAddress
          );
          this.businessInfoForm.controls.appOwnerBillingAddress.setValue(
            this.appOwner.appOwnerBillingAddress
          );
          this.businessInfoForm.controls.logoUrl.setValue(
            this.appOwner.logoUrl
          );

          this.businessInfoForm.controls.appOwnerBankCode.setValue(
            this.appOwner.bankInformation &&
              this.appOwner.bankInformation.AppOwnerBankCode
          );
          this.businessInfoForm.controls.appOwnerAccountNumber.setValue(
            this.appOwner.bankInformation &&
              this.appOwner.bankInformation.AppOwnerAccountNumber
          );
          this.businessInfoForm.controls.appOwnerAccountName.setValue(
            this.appOwner.bankInformation &&
              this.appOwner.bankInformation.AppOwnerAccountName
          );
          this.businessInfoForm.controls.appOwnerBankName.setValue(
            this.appOwner.bankInformation &&
              this.appOwner.bankInformation.AppOwnerBankName
          );
          this.businessInfoForm.controls.ofiCode.setValue(
            this.appOwner?.ofiCode
          );

          this.onchangeAlias(this.appOwner.appOwnerAlias);
        }

        // Set sms setup info
        if (
          this.appOwner?.smsSetupInfo !== null &&
          this.appOwner?.smsSetupInfo
        ) {
          const data: SmsSetupInterface = this.appOwner.smsSetupInfo;

          this.multitexterForm.controls.userName.setValue(
            data?.SmsProviderInfo?.MultitexterSmsProviderInfo?.UserName
          );
          this.multitexterForm.controls.apiKey.setValue(
            data?.SmsProviderInfo?.MultitexterSmsProviderInfo?.ApiKey
          );
          this.multitexterForm.controls.senderName.setValue(
            data?.SmsProviderInfo?.MultitexterSmsProviderInfo?.SenderName
          );
          this.multitexterForm.controls.useApiKey.setValue(
            data?.SmsProviderInfo?.MultitexterSmsProviderInfo?.UseApiKey
          );
          this.multitexterForm.controls.password.setValue(
            data?.SmsProviderInfo?.MultitexterSmsProviderInfo?.Password
          );

          if (data.SendSmsEvents.LoanApproved === null) {
            let defaultData = new GenericSmsEvent();
            defaultData.Template = "";
            this.appOwner.smsSetupInfo.SendSmsEvents.LoanApproved = defaultData;
          }
          if (data.SendSmsEvents.LoanDisbursed === null) {
            let defaultData = new GenericSmsEvent();
            defaultData.Template = "";
            this.appOwner.smsSetupInfo.SendSmsEvents.LoanDisbursed =
              defaultData;
          }
          if (data.SendSmsEvents.LoanSettled === null) {
            let defaultData = new GenericSmsEvent();
            defaultData.Template = "";
            this.appOwner.smsSetupInfo.SendSmsEvents.LoanSettled = defaultData;
          }

          if (data.SendSmsEvents.LoanRepaymentDue === null) {
            let defaultData = new GenericSmsEvent();
            defaultData.Template = "";
            this.appOwner.smsSetupInfo.SendSmsEvents.LoanRepaymentDue =
              defaultData;
          }

          if (data.SendSmsEvents.LoanPaymentMade === null) {
            let defaultData = new GenericSmsEvent();
            defaultData.Template = "";
            this.appOwner.smsSetupInfo.SendSmsEvents.LoanPaymentMade =
              defaultData;
          }
        }

        // Set First Central Info
        if (
          this.appOwner.appOwnerFirstCentralInfo !== null &&
          this.appOwner?.appOwnerFirstCentralInfo
        ) {
          this.firstCentralForm.controls.userName.setValue(
            this.appOwner?.appOwnerFirstCentralInfo?.UserName
          );
          this.firstCentralForm.controls.password.setValue(
            this.appOwner?.appOwnerFirstCentralInfo?.Password
          );
        }

        // Set Credit Registry info
        if (
          this.appOwner.appOwnerCreditRegistryInfo !== null &&
          this.appOwner?.appOwnerCreditRegistryInfo
        ) {
          this.creditRegistryForm.controls.emailAddress.setValue(
            this.appOwner.appOwnerCreditRegistryInfo.EmailAddress
          );
          this.creditRegistryForm.controls.password.setValue(
            this.encrypt.decryptUsingAES256(
              this.appOwner.appOwnerCreditRegistryInfo.Password
            )
          );
          this.creditRegistryForm.controls.subscriberId.setValue(
            this.appOwner.appOwnerCreditRegistryInfo.SubscriberId
          );
        }

        this.initCalendlyForm();
      });
  }

  updatePaystackInfo() {
    this.passwordLoader = true;
    this.configService
      .updatePaystackKeys({
        ...this.paystackForm.value,
        isActive: this.paystackInfo.isActive,
      })
      .subscribe(
        (res) => {
          this.passwordLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getAppOwnerDetails();
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
  }

  toggleSms() {
    const data = this.appOwner?.smsSetupInfo as SmsSetupInterface;
    let message;
    if (data.IsActive) {
      message = "Sms status is now active";
    } else {
      message = "Sms status is now inactive";
    }
    this.updateSmsInfo(data, message);
  }
  changeProvider(provider: string) {
    const data = this.appOwner?.smsSetupInfo as SmsSetupInterface;
    data.ActiveSmsProviders = provider;
    let message = "Sms provider changed.";
    this.updateSmsInfo(data, message);
  }

  saveTemplates() {
    this.templateLoader = true;
    const data = this.appOwner?.smsSetupInfo as SmsSetupInterface;
    let message = "Sms templates updated.";
    this.updateSmsInfo(data, message);
  }

  updateSmsIntegration(channel: SmsProviders) {
    this.passwordLoader = true;
    const data = this.appOwner?.smsSetupInfo as SmsSetupInterface;
    let message;
    if (channel === SmsProviders.AfricasTalking) {
      const formData = this.africaIsTalkingForm
        .value as AfricasTalkingInterface;
      data.SmsProviderInfo.AfricasTalkingSmsProviderInfo = formData;
      message = `Africa's talking integration successful.`;
    } else if (channel === SmsProviders.MultiTexter) {
      const formData = this.multitexterForm.value as MultiTexterSmsInterface;
      data.SmsProviderInfo.MultitexterSmsProviderInfo = formData;
      message = `Multitexter integration successful.`;
    }

    this.updateSmsInfo(data, message);
  }

  updateSmsInfo(data: SmsSetupInterface, message: string) {
    this.passwordLoader = true;
    this.configService.updateSmsSetup(data).subscribe(
      (res) => {
        this.passwordLoader = false;
        this.templateLoader = false;
        this.toast.fire({
          type: "success",
          title: message,
        });
        this.getAppOwnerDetails();
      },
      (err) => {
        this.passwordLoader = false;
        this.templateLoader = false;
      }
    );
  }

  updateYouVerifyInfo() {
    this.passwordLoader = true;
    this.configService.updateIntegration(this.youVerifyForm.value).subscribe(
      (res) => {
        this.passwordLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
      },
      () => {
        this.passwordLoader = false;
      }
    );
  }

  updateFirstCentralInfo() {
    this.passwordLoader = true;
    this.configService
      .updateFirstCentralInfo(this.firstCentralForm.value)
      .subscribe(
        (res) => {
          this.passwordLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
  }
  updateCreditRegistryInfo() {
    this.passwordLoader = true;
    this.configService
      .updateCreditRegistryInfo(this.creditRegistryForm.value)
      .subscribe(
        (res) => {
          this.passwordLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
  }

  updateTrasactionKeyValue(value: any, type: "confirm" | "new"): void {
    if (type === "new") {
      this.newTransactionKey = value;
    } else {
      this.confirmTransactionKey = value;
    }
  }

  updateTransactionKey() {
    if (
      !this.password ||
      !this.newTransactionKey ||
      this.newTransactionKey !== this.confirmTransactionKey
    )
      return;
    this.keyLoader = true;
    const model = {
      currentPassword: this.password,
      key: this.newTransactionKey,
      userId: this.loggedInUser?.nameid,
    };
    this.userService.updateKey(model).subscribe(
      (res) => {
        this.keyLoader = false;
        this.toast.fire({
          type: "success",
          title: "Your transaction pin has been updated",
        });
        this.password = null;
        this.newTransactionKey = null;
        this.confirmTransactionKey = null;
        this.newPin.clearValue();
        this.confirmPin.clearValue();
      },
      (err) => {
        this.keyLoader = false;
      }
    );
  }

  updateBusinessInfo() {
    const businessInfoForm = this.businessInfoForm.value;

    const model = toFormData(businessInfoForm);

    if (this.fileSelected && this.fileData !== null) {
      model.append("LogoFile", this.fileData, this.fileData.name);
    }
    this.loader = true;
    this.configService.udateAppOwnerDetails(model).subscribe(
      (res) => {
        this.loader = false;
        this.fileSelected = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAppOwnerDetails();
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  checkPwValidity() {
    this.validatingPw = true;
    this.authService
      .validatePassword(this.passwordForm.get("Password").value)
      .subscribe({
        next: (res) => {
          this.validatingPw = false;
          this.savePasswordForm();
        },
        error: (err) => {
          this.validatingPw = false;
        },
      });
  }

  savePasswordForm() {
    this.passwordLoader = true;
    if (this.passwordForm.valid) {
      const data = this.passwordForm.value;
      const payload = {
        userId: +data["UserId"],
        newPassword: data["Password"],
        oldPassword: data["currentPassword"],
      };
      this.userService.updatePassword(payload).subscribe(
        (res) => {
          this.user = res.body;
          this.passwordFormInit();
          this.passwordLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
    }
  }

  saveProfileForm(val: any) {
    this.loader = true;
    if (this.profileForm.valid) {
      this.userService.profileUpdate(this.profileForm.value).subscribe(
        (res) => {
          this.user = res.body;
          this.userService.userUpdated.next(this.user);
          this.profilePicture = this.getUserProfilePicture();
          this.profilePicturePreview = this.getUserProfilePicture();
          this.selectedPictureName = null;

          // Clear user so it can be refetched when next it's needed.
          this.userService.currentUser = null;
          this.loader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.loader = false;
        }
      );
    }
  }

  getUserProfilePicture() {
    return this.user?.person?.profilePic ? `${this.user?.person?.profilePic}?timestamp=${Date.now()}` : 'assets/images/placeholder.jpg';
  }

  fileUploader(files: FileList) {
    this.profileImageSelected = true; 
    const fileData = files[0] as File;
    this.previewProfileImage(fileData);

    this.profileForm.controls.ProfilePic.setValue(fileData, {
      onlySelf: true,
      emitEvent: true,
    });
    this.profileForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  previewProfileImage(fileData: File) {
    // Show preview
    
    const mimeType = fileData.type;
    if (mimeType.match(/image\/*/) == null) {
      this.profilePicturePreview = this.getUserProfilePicture();
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileData);
    reader.onload = (_event) => {
      this.profilePicturePreview = reader.result;
    };
  }

  cancelProfilePicture() {
    this.profileImageSelected = false;
    this.profilePicturePreview = this.getUserProfilePicture();
    
    this.profileForm.controls.ProfilePic.setValue(null, {
      onlySelf: true,
      emitEvent: true,
    });
    this.profileForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  // Track File upload progress
  fileProgress(fileInput: any) {
    this.fileSelected = true;
    this.fileData = fileInput.target.files[0] as File;
    this.preview();
  }
  // Preview Selected image
  preview() {
    // Show preview
    const mimeType = this.fileData.type;
    if (mimeType.match(/image\/*/) == null) {
      this.businessLogo = "assets/images/logo-blue.png";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(this.fileData);
    reader.onload = (_event) => {
      this.businessLogo = reader.result;
    };
  }
  

  copyKey(val: string) {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.toast.fire({
      type: "success",
      title: "Copied to clipboard.",
    });
  }

  getAllAppOwnerIntegration(appOwnerKey) {
    this.configService.getAllAppOwnerIntegration(appOwnerKey).subscribe(
      (res) => {
        this.appOwnerIntegrationData = res.body.data;
        this.okraData = null;
        this.okraInnerData = null;

        if (
          this.appOwnerIntegrationData == null ||
          this.appOwnerIntegrationData.length == 0
        ) {
          this.okraForm = new UntypedFormGroup({
            AppOwnerKey: new UntypedFormControl(appOwnerKey, [
              Validators.required,
            ]),
            StatementLimitInMonths: new UntypedFormControl("", [
              Validators.required,
            ]),
          });
          return;
        }

        // for okra data
        let okraDataArray = this.appOwnerIntegrationData.filter(
          (x: any) => x.name == "Okra"
        );
        if (okraDataArray.length > 0) {
          this.okraData = okraDataArray[0];

          this.okraInnerData = JSON.parse(this.okraData.data);
          this.okraForm = new UntypedFormGroup({
            AppOwnerKey: new UntypedFormControl(
              this.okraInnerData.AppOwnerKey,
              [Validators.required]
            ),
            StatementLimitInMonths: new UntypedFormControl(
              this.okraInnerData.StatementLimitInMonths,
              [Validators.required]
            ),
          });
        }
      },
      (err) => {
        this.okraData = null;
        this.okraInnerData = null;

        if (this.appOwnerIntegrationData == null) {
          this.okraForm = new UntypedFormGroup({
            AppOwnerKey: new UntypedFormControl(appOwnerKey, [
              Validators.required,
            ]),
            StatementLimitInMonths: new UntypedFormControl(
              this.okraInnerData.StatementLimitInMonths,
              [Validators.required]
            ),
          });
          return;
        }
      }
    );
  }

  updateOkraStatus(status: boolean) {
    this.statusLoader = true;
    if (this.okraData == null) {
      this.updateOkraInfo();
      return;
    }

    this.configService.updateOkraStatus(status).subscribe(
      (res) => {
        this.statusLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAllAppOwnerIntegration(this.user.appOwnerKey);
      },
      (err) => {
        this.statusLoader = false;
      }
    );
  }

  updateOkraInfo() {
    this.passwordLoader = true;

    if (this.okraData == null) {
      this.configService.integrateOkra(this.okraForm.value).subscribe(
        (res) => {
          this.passwordLoader = false;
          this.statusLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getAllAppOwnerIntegration(this.user.appOwnerKey);
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
    } else {
      this.configService.updateOkraData(this.okraForm.value).subscribe(
        (res) => {
          this.passwordLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getAllAppOwnerIntegration(this.user.appOwnerKey);
        },
        (err) => {
          this.passwordLoader = false;
        }
      );
    }
  }

  onchangeAlias(alias) {
    const reg = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}/;

    let url = `${alias}.example.com`;
    this.aliasError = !reg.test(url);
  }

  switchView(viewName) {
    this.specificView = viewName;
    if (viewName == "apiAccessManagement") {
      this.spoolUserApiList();
      this.spoolApiKeyScope();
    }

    if (this.specificView === "integrations") {
      this.getAllIntegrations();
    }
  }

  openModal(modal: any, type: any = "lg") {
    this.modalService.open(modal, { centered: true, size: type });
  }

  openEditModal(modal: any, data: any) {
    this.initEditApiAccessForm(data);
    this.modalService.open(modal, { centered: true });
  }

  deleteKey(data: any) {
    Swal.fire({
      title: "Are you sure?",
      text: 'This action will remove "' + data.name + '" permanently.',
      type: "warning",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((res) => {
      if (res.value) {
        this.configService.deleteApiAccessKey(data.id).subscribe(
          () => {
            this.spoolUserApiList();
            Swal.fire({
              type: "success",
              text: "Successfully deleted!",
            });
          },
          (err) => {
            this.toast.fire({
              type: "error",
              title: err.error.message,
            });
          }
        );
      }
    });
  }

  getBankDetailsTabData = () => {
    if (this.bankDetailsTabBanks.length == 0) {
      this.configService.spoolBanks().subscribe((res) => {
        this.bankDetailsTabBanks = res.body;
      });
    }
  };

  setDefaultBvnValidationPartner(partner) {
    this.defaultBvnLoader = true;
    this.configService.setDefaultBvnValidationPartner(partner).subscribe(
      (res) => {
        this.defaultBvnLoader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
        this.getAppOwnerDetails();
      },
      (err) => {
        this.defaultBvnLoader = false;
        this.toast.fire({
          type: "error",
          title: "Update was successful",
        });
      }
    );
  }

  checkBVN() {
    this.configService.checkBVNv2(this.bvnInput).subscribe(
      (res) => {
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
      },
      (err) => {
        this.toast.fire({
          type: "error",
          title: "Update was successful",
        });
      }
    );
  }

  changeColor(color: string, type: string) {
    this.showButtons = true;
    const colorTheme: ColorThemeInterface = {
      primaryColor: this.customPriColor,
      secondaryColor: this.customSecColor,
    };
    if (type === "primary") {
      colorTheme.primaryColor = color;
    } else if (type === "secondary") {
      colorTheme.secondaryColor = color;
    }
    this.colorThemeService.setTheme(colorTheme);
  }

  setPresetTheme(name: string) {
    this.showButtons = true;
    this.selectedTheme = name;
    const item = this.presetThemes.find((x) => x.name === name);
    const selectedColor: ColorThemeInterface = {
      primaryColor: item.primaryColor,
      secondaryColor: item.secondaryColor,
      accentColor: item.accentColor,
      theme: item.name,
    };
    this.presetThemePrimaryColor = item.primaryColor;
    this.presetThemeSecondaryColor = item.secondaryColor;

    this.colorThemeService.saveSelectedPresetTheme(selectedColor);
    this.colorThemeService.setTheme(selectedColor, true);
  }

  setBaseTheme(type: "dark" | "lite") {
    this.colorThemeService.setBaseTheme(type);
  }

  isThemeBaseSelected(): string {
    return sessionStorage.getItem("dt-theme");
  }

  resetTheme() {
    this.saveTheme();
    this.colorThemeService.resetTheme();
  }

  saveTheme(): void {
    this.savingThemeStatus = true;
    this.appOwner = {
      ...this.appOwner,
      appOwnerCustomColors: this.currentTheme,
    };

    this.configService.updateColorTheme(this.currentTheme).subscribe((res) => {
      this.showButtons = false;
      this.savingThemeStatus = false;

      this.setCustomColors(this.appOwner.appOwnerCustomColors);
    });
  }

  toggle2FAStep(step: number): void {
    if (step === 1) {
      this.twoFacStep1 = true;
      this.twoFacStep2 = false;
      this.twoFacStep3 = false;
    } else if (step === 2) {
      this.twoFacStep1 = false;
      this.twoFacStep2 = true;
      this.twoFacStep3 = false;
    } else if (step === 3) {
      this.twoFacStep1 = false;
      this.twoFacStep2 = false;
      this.twoFacStep3 = true;
    }
  }

  init2FAForm(): void {
    this.twoFacForm = this.fb.group({
      option: new UntypedFormControl("Email"),
      phoneNumber: new UntypedFormControl(null),
      otp: new UntypedFormControl(null),
      isEmail: new UntypedFormControl(true),
      isSms: new UntypedFormControl(false),
    });

    this.watch2faForm();
  }

  watch2faForm(): void {
    this.twoFacForm
      .get("isSms")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        let option = "";
        if (res) {
          option = "Sms";
        } else {
          option = "Email";
        }
        this.twoFacForm.get("option").patchValue(option);
      });
  }

  requestOTP(): void {
    this.sendingOTP = true;
    this.sentOTP = false;

    const form = this.twoFacForm.value;

    const model = {
      userId: this.loggedInUser?.nameid,
      option: form?.option,
      phoneNumber: form?.phoneNumber,
    };

    this.authService
      .requestActivationOTP(model)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.sentOTP = true;
          this.sendingOTP = false;
          this.twoFactorResendTimer = 60;

          let timer = setInterval(() => {
            this.twoFactorResendTimer--;
          }, 1000);

          setTimeout(() => {
            this.sentOTP = false;
            clearInterval(timer);
          }, 60000);
        },
        (err: any) => {
          this.sendingOTP = false;
          const error: string = err?.error?.message;
          Swal.fire({ type: "error", title: "Error", text: error });
        }
      );
  }
  activateOTP(): void {
    this.activatingOTP = true;
    const form = this.twoFacForm.value;

    const model = {
      userId: this.loggedInUser?.nameid,
      option: form?.option,
      otpCode: form?.otp,
      setOptionAsDefault: true,
    };

    this.authService
      .confirmOTPActivation(model)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.toggle2FAStep(3);
          this.activatingOTP = false;
          this.fetchUserInfo();
        },
        (err: any) => {
          this.activatingOTP = false;
          const error: string =
            err.error ||
            err.error.message ||
            err.statusText ||
            err ||
            err.message;
          Swal.fire({ type: "error", title: "Error", text: error });
        }
      );
  }
  update2faConfig(): void {
    this.updating2faConfig = true;
    if (!this.appOwner2FASetup.isActive) {
      delete this.appOwner2FASetup["options"];
    }

    this.configService
      .configure2fa(this.appOwner2FASetup)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.updating2faConfig = false;
          this.toast.fire({
            type: "success",
            text: "Two factor authentication settings saved.",
          });
        },
        (err) => {
          this.updating2faConfig = false;
        }
      );
  }

  getAllIntegrations() {
    this.loadingState = {
      text: "Retrieving Integrations",
      key: "integrations",
      isLoading: true,
    };
    this.configService
      .getAllIntegrations()
      .pipe(pluck("body"), takeUntil(this.subs$))
      .subscribe(
        (integrations) => {
          this.integrations = integrations;
          this.setIntegrationConfig();
        },
        () => {
          this.loadingState.isLoading = false;
        }
      );
  }

  private setIntegrationConfig() {
    this.integrations.forEach((integration) => {
      if (integration.integrationName === IntegrationNameEnum.Paystack) {
        this.paystackInfo = integration;
        this.paystackForm.setValue({
          secretKey: this.paystackInfo?.apiSecretKey || "",
          publicKey: this.paystackInfo?.apiPublicKey || "",
        });
      } else if (
        integration.integrationName === IntegrationNameEnum.AfricasTalking
      ) {
        this.africaTalkingConfig = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Multitexter
      ) {
        this.multiTexterConfig = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Dojah
      ) {
        this.dojahSetup = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Kuda
      ) {
        this.kudaInfo = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Seerbit
      ) {
        this.seerbitSetup = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Termii
      ) {
        this.termiiConfig = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.Mono
      ) {
        this.monoConfig = integration;
      } else if (
        integration.integrationName === IntegrationNameEnum.YouVerify
      ) {
        this.youVerifyConfig = integration;
        this.youVerifyForm.patchValue({
          apiSecretKey: this.youVerifyConfig.apiSecretKey,
          isActive: this.youVerifyConfig.isActive,
          integrationId: this.youVerifyConfig.id,
        });
      }
    });
    this.loadingState.isLoading = false;
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
