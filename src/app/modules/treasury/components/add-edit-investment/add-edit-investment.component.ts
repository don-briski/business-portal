import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Step, StepStatus } from "src/app/modules/shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { InvestmentService } from "src/app/service/investment.service";
import { toFormDataV2 } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { InvestmentDetails } from "../../types/investment.type";
import {
  objectToCamelCase,
  removeNullUndefinedWithReduce,
} from "src/app/modules/shared/helpers/generic.helpers";
import { InvestmentCertificateInfoSetup } from "src/app/model/configuration";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { InvestmentCertificateComponent } from "src/app/library/investment-certificate/investment-certificate.component";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { InvestorType } from "../../types/Investor";

@Component({
  selector: "lnd-add-edit-investment",
  templateUrl: "./add-edit-investment.component.html",
  styleUrls: ["./add-edit-investment.component.scss"],
})
export class AddEditInvestmentComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  isEditing = false;
  stepStatusEnum = StepStatus;
  currentTab: number = 0;
  steps: Step[] = [];
  investorTypes = ["Individual", "Corporate"];
  investorType: InvestorType;
  states: CustomDropDown[] = [];
  investmentTypes: CustomDropDown[] = [];
  isLoading = false;
  isProcessing = false;
  currencySymbol: string;
  investmentInitialIsActive: boolean;
  banks: CustomDropDown[] = [];
  financeAccounts: CustomDropDown[] = [];
  formValue: { isValid: boolean; data: any };
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  investmentId: number;
  fetchingInvestment = false;
  investmentDetails: InvestmentDetails;
  generatingInvCert = false;
  investmentCertSetup?: InvestmentCertificateInfoSetup;
  currentTheme: ColorThemeInterface;

  constructor(
    private configureService: ConfigurationService,
    private invService: InvestmentService,
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigurationService,
    private modalService: NgbModal,
    private colorThemeService: ColorThemeService
  ) {
    this.investmentId = this.route.snapshot.params["id"];
    if (this.investmentId) {
      this.isEditing = true;
      this.getInvestment();
    }

    if (this.route.snapshot.queryParamMap.get("type")) {
      const payload = {
        id: this.route.snapshot.queryParamMap.get("type"),
        text: this.route.snapshot.queryParamMap.get("type"),
      };
      this.setInvestorType(payload);
    }
  }

  ngOnInit(): void {
    this.getCountries();
    this.loadTheme();
    this.currencySymbol = this.configureService.currencySymbol;
    this.getInvestmentSetupInfo();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getCountries() {
    this.configService.spoolCountries().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      const countryIdForNigeria = res.body.find(country => country?.name?.toLowerCase() === "nigeria")?.id;
      if (countryIdForNigeria) {
        this.fetchRequirements(countryIdForNigeria);
      }
    })
  }

  private fetchRequirements(countryId?:number) {
    this.isLoading = true;
    const sources = [
      this.configureService.spoolStatesByCountry(countryId),
      this.invService.fetchActiveInvestmentType(),
      this.configureService.getCurrencySymbol(),
      this.configureService.getAppOwnerInfo(),
      this.configureService.spoolBanks({ provider: "Paystack" }),
    ];

    forkJoin(sources)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.states = response[0]?.body?.map((state) => ({
            id: state.id,
            text: state.name,
          }));

          this.investmentTypes = response[1]?.body?.map((investmentType) => ({
            id: investmentType.investmentTypeId,
            text: investmentType.investmentName,
            additionalInfo: JSON.stringify({
              minInterest: investmentType?.minInterestRate,
              maxInterest: investmentType?.maxInterestRate,
              minAmount: investmentType?.minAmount,
              maxAmount: investmentType?.maxAmount,
              maxTenor: investmentType?.maxInvestmentTenor,
              minTenor: investmentType?.minInvestmentTenor,
              termsAndConditionsSetupInfo:
                investmentType?.termsAndConditionsSetupInfo,
            }),
          }));

          this.currencySymbol = response[2]?.body?.currencySymbol;

          this.investmentInitialIsActive =
            response[3]?.body?.financeInteractionData?.investmentInitialIsActive;

          this.financeAccounts =
            response[3]?.body?.financeInvestmentInitialAccounts.map(
              (account) => ({
                id: account.accountId,
                text: account.name,
              })
            );

          this.banks = response[4]?.body
            .map((bank) => ({
              id: `${bank?.bankId}.${bank?.sortCode}`,
              text: bank?.bankName,
            }))
            .sort((a, b) => a.text.localeCompare(b.text));

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  switchStep(tabId: number) {
    this.currentTab = tabId;
    this.steps.forEach((element, index) => {
      if (this.currentTab === index) {
        this.steps[this.currentTab].usePrimaryBg = true;
        this.steps[this.currentTab].status = StepStatus.current;
      } else {
        this.steps[index].usePrimaryBg = false;
        this.steps[index].status = StepStatus.pending;
      }
    });
  }

  next() {
    this.currentTab += 1;
    this.switchStep(this.currentTab);
  }

  previous() {
    this.currentTab -= 1;
    this.switchStep(this.currentTab);
  }

  setInvestorType(event: CustomDropDown) {
    this.investorType = event.id as InvestorType;
    if (this.investorType === InvestorType.individual) {
      this.steps = [
        {
          id: "individual",
          stage: "Bank & Personal Information",
          type: "Enter the customer's bank and personal details",
          usePrimaryBg: true,
        },
        {
          id: "corporate",
          stage: "Investment Information",
          type: "Please fill in the Investment details",
          status: StepStatus.pending,
        },
      ];
    }

    if (this.investorType === InvestorType.corporate) {
      this.steps = [
        {
          id: "tab1",
          stage: "Business and Bank information",
          type: "Please fill in the Business's information",
          usePrimaryBg: true,
        },
        {
          id: "tab2",
          stage: "Investment Information",
          type: "Please fill in investment details",
          status: StepStatus.pending,
        },
        {
          id: "tab3",
          stage: "Documents Upload",
          type: "Please upload supporting documents",
          status: StepStatus.pending,
        },
      ];
    }
  }

  setPayload(event) {
    this.formValue = event;
  }

  private getInvestment() {
    this.fetchingInvestment = true;
    this.invService
      .getInvestmentById(this.investmentId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.investmentDetails = res.body.data;
          this.fetchingInvestment = false;
        },
        error: () => {
          this.fetchingInvestment = false;
        },
      });
  }

  private cleanUp() {
    let payload = {
      ...this.formValue?.data,
      bankName: this.formValue?.data?.bank[0]?.text,
      bankSortCode: this.formValue?.data?.bank[0]?.id.split(".")[1],
      financeInteractionCashOrBankAccountId:
        this.formValue?.data?.financeInteractionCashOrBankAccountId?.[0]?.id,
      investmentTypeId: this.formValue?.data?.investmentTypeId?.[0]?.id,
      address: removeNullUndefinedWithReduce({
        ...this.formValue?.data?.address,
        localGovernmentArea:
          this.formValue?.data?.address?.localGovernmentArea[0]?.text,
        lgaId: this.formValue?.data?.address?.localGovernmentArea[0]?.id,
        state: this.formValue?.data?.address?.state[0]?.text,
        stateId: this.formValue?.data?.address?.state[0]?.id,
      }),
      investorType: this.investorType,
      contactAddress: `${this.formValue?.data?.address?.houseNumber} ${this.formValue?.data?.address?.street1} ${this.formValue?.data?.address?.state[0]?.text} ${this.formValue?.data?.address?.country}`,
    };

    if (payload?.bank) {
      delete payload.bank;
    }

    if (!payload?.investorId) {
      delete payload?.investorId;
    }

    if (this.isEditing) {
      payload["investmentId"] = this.investmentDetails?.investmentId;
    }
    return payload;
  }

  getCertificateInfo(): void {
    this.generatingInvCert = true;
    let payload = this.cleanUp();
    if (payload?.investorType === InvestorType.corporate) {
      payload.firstName = payload?.businessName;
    }
    this.invService
      .getInvestmentCertificatePreview(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          let certData = res.body?.data;
          certData["total"] = +(
            certData?.investmentAmount + certData?.totalAmountExpected
          );
          let selectedInvestmentType = this.investmentTypes.find(
            (invType) => invType.id === payload?.investmentTypeId
          );

          if (
            selectedInvestmentType?.additionalInfo &&
            typeof selectedInvestmentType?.additionalInfo === "string"
          ) {
            selectedInvestmentType.additionalInfo = JSON.parse(
              selectedInvestmentType.additionalInfo
            );
          }
          let investmentTermsAndConditions =
            selectedInvestmentType?.additionalInfo?.[
              "termsAndConditionsSetupInfo"
            ];
          if (
            investmentTermsAndConditions &&
            typeof investmentTermsAndConditions === "string"
          ) {
            investmentTermsAndConditions = objectToCamelCase(
              JSON.parse(investmentTermsAndConditions)
            );
          }

          if (investmentTermsAndConditions) {
            const investmentTypeInfo = {
              termsAndConditionsInfoSetup: investmentTermsAndConditions,
            };
            certData["investmentTypeInfo"] = investmentTypeInfo;
          }

          certData = {
            ...certData,
            investmentCertSetup: this.investmentCertSetup,
          };

          this.generatingInvCert = false;

          const modalRef = this.modalService.open(
            InvestmentCertificateComponent,
            { centered: true, windowClass: "myModal", size: "lg" }
          );

          modalRef.componentInstance.data = certData;
          modalRef.componentInstance.theme = this.currentTheme;
          modalRef.componentInstance.isModal = true;
        },
        error: () => {
          this.generatingInvCert = false;
        },
      });
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

  submit() {
    const payload = this.cleanUp();

    this.isProcessing = true;
    if (this.isEditing) {
      this.invService
        .editInvestment(toFormDataV2(payload, ["supportingDocument"]))
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.postSuccess();
          },
          error: () => {
            this.isProcessing = false;
          },
        });
    } else {
      this.invService
        .createInvestment(toFormDataV2(payload, ["supportingDocument"]))
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.postSuccess();
          },
          error: () => {
            this.isProcessing = false;
          },
        });
    }
  }

  private postSuccess() {
    this.toast.fire({
      type: "success",
      title: `Investment ${
        this.isEditing ? "Updated" : "Created"
      } Successfully`,
    });
    this.router.navigate(["treasury/investments"]);
    this.isProcessing = false;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
