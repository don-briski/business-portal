import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { pluck, take, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { WrappedService } from "src/app/service/wrapped.service";
import html2canvas from "html2canvas";

@Component({
  selector: "lnd-yearly-review-dialog",
  templateUrl: "./yearly-review-dialog.component.html",
  styleUrls: ["./yearly-review-dialog.component.scss"],
})
export class YearlyReviewDialogComponent implements OnInit {
  @ViewChild("preview") preview: ElementRef;
  currentTheme: ColorThemeInterface & { textColor?: string };
  unsubscriber$ = new Subject<void>();
  currentStep = 1;
  lendaLogo = "";
  lendaWhiteBgLogo = "";
  appOwnerLogo = "";
  appOwnerName = "";
  currencySymbol: string | null = null;
  name = "";
  disbursementAmount = 0;
  disbursementCount = 0;
  loginCount = 0;
  approvedLoansCount = 0;
  approvedLoansAmount = 0;
  approvedInvestmentCount = 0;
  approvedInvestmentAmount = 0;
  investmentsCreatedCount = 0;
  investmentsCreatedSum = 0;
  investmentsCustomersCreatedCount = 0;
  liquidatedInvestmentCount = 0;
  liquidatedInvestmentAmount = 0;
  runningInvestmentsApprovedCount = 0;
  runningInvestmentsApprovedAmount = 0;
  rejectedLoansCount = 0;
  rejectedLoansAmount = 0;
  topUpLoansCount = 0;
  topUpLoansAmmount = 0;
  loanApplications = 0;
  loanApplicationSum = 0;
  showFormal = true;
  showCasual = false;
  customersCreated = 0;
  year = new Date().getFullYear() - 1;
  showPreview = false;
  isDownloading = false;
  badges = [];
  currentUserPermissions = null;
  requiredPermissions = [
    "Create Loan Application",
    "Review Claimed Applications",
    "Disburse Loan",
  ];
  availablePermissions = [];
  reviewAndPermission = [
    {
      name: "Create",
      permission: "Create Loan Application",
    },
    {
      name: "Approval",
      permission: "Review Claimed Applications",
    },
    {
      name: "Reject",
      permission: "Review Claimed Applications",
    },
    {
      name: "Disbursement",
      permission: "Disburse Loan",
    },
  ];
  selectedStep = null;
  percentagePerforming = null;
  constructor(
    private colorThemeService: ColorThemeService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private wrappedService: WrappedService
  ) {
    this.lendaLogo = this.data.lendastackLogo;
    this.appOwnerLogo = this.data.logo;
    this.appOwnerName = this.data.appOwnerName;
    this.name = this.data.name;
    this.currencySymbol = this.data.currencySymbol;
    this.currentUserPermissions = this.data.permissions;
  }

  ngOnInit(): void {
    this.loadTheme();
    this.getAllMetrics();
    this.requiredPermissions.forEach((permission: string) => {
      if (this.currentUserPermissions.includes(permission)) {
        const availablePermissions = this.reviewAndPermission.filter(
          (x) => x.permission === permission
        );
        this.availablePermissions.push(...availablePermissions);
      }
    });
  }
  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
        if (this.currentTheme.theme === "Light Mode") {
          this.currentTheme = { ...this.currentTheme, textColor: "#000" };
        } else if (this.currentTheme.theme === "Dark") {
          this.currentTheme = { ...this.currentTheme };
        }
      });
  }

  checkPermission(step: number, isNextStep: boolean): void {
    if (
      (step === 3 || step === 5) &&
      !this.currentUserPermissions.includes("")
    ) {
      this.currentStep = isNextStep ? 5 : 3;
    }
  }

  nextStepOld(): void {

    if (this.currentStep < 4) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.togglePermissionStep(true);
      }
    } else {
      this.togglePermissionStep(true);
    }
  }


  nextStep(): void {
    let nextStep = this.currentStep + 1;
    const shouldSkipStep = (step: number): boolean => {
      switch (step) {
        case 2:
          return this.loginCount === 0;
        case 3:
          return this.loanApplications === 0;
        case 4:
          return this.approvedLoansCount === 0;
        case 5:
          return this.rejectedLoansCount === 0;
        case 6:
          return this.disbursementAmount === 0;
        case 7:
          return this.customersCreated === 0;
        case 8:
          return this.approvedInvestmentCount === 0;
        case 9:
          return this.runningInvestmentsApprovedAmount === 0;
        case 10:
          return this.liquidatedInvestmentCount === 0;
        default:
          return false;
      }
    };
    while (nextStep < 12 && shouldSkipStep(nextStep)) {
      nextStep++;
    }

    this.currentStep = nextStep;
  }

  toggleViewMode(viewMode: string): void {

    if (viewMode === "formal") {
      this.showFormal = true;
      this.lendaLogo = this.data.lendastackLogo;
      this.showCasual = false;
    } else {
      this.showFormal = false;
      this.lendaLogo = this.data.logo;
      this.showCasual = true;
    }
    this.currentStep++;
  }

  previewSocial(): void {
    this.showPreview = true;
  }

  togglePermissionStep(isNextStep: boolean): void {
    if (this.selectedStep) {
      let currentPermissionIndex = this.availablePermissions.findIndex(
        (c) => c.name === this.selectedStep.name
      );
      if (currentPermissionIndex === 0 && !isNextStep) {
        this.currentStep--;
        this.selectedStep = null
        return
      }
      if (currentPermissionIndex === this.availablePermissions.length - 1 && isNextStep) {
        this.currentStep++;
        this.selectedStep = null
        return
      }
      if (currentPermissionIndex !== this.availablePermissions.length) {
        isNextStep ? currentPermissionIndex++ : currentPermissionIndex--;
        this.selectedStep = this.availablePermissions[currentPermissionIndex];
      } else {
        isNextStep ? this.currentStep++ : this.currentStep--;
      }
    } else {
      this.selectedStep = this.availablePermissions[0]
    }
  }

  goToStart(): void {
    this.currentStep -= 1;
  }

  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.lendaLogo = this.data.lendastackLogo;
      this.showFormal = true;
      this.showCasual = false;
      return;
    }
  
    let prevStep = this.currentStep - 1;
    
    const shouldSkipStep = (step: number): boolean => {
      switch (step) {
        case 2:
          return this.loginCount === 0;
        case 3:
          return this.loanApplications === 0;
        case 4:
          if(this.showCasual) {
            return this.approvedLoansAmount === 0;
          }
          return this.approvedLoansCount === 0;
        case 5:
          return this.rejectedLoansCount === 0;
        case 6:
          return this.disbursementAmount === 0;
        case 7:
          return this.customersCreated === 0;
        case 8:
          return this.approvedInvestmentCount === 0;
        case 9:
          return this.runningInvestmentsApprovedAmount === 0;
        case 10:
          return this.liquidatedInvestmentCount === 0;
        default:
          return false;
      }
    };
  
    while (prevStep > 1 && shouldSkipStep(prevStep)) {
      prevStep--;
    }
  
    this.currentStep = prevStep;
  }


  shareOnLinkedIn(): void {
    const wrapperElement = document.querySelector('.wrapper') as HTMLElement;// Select the wrapper

    if (!wrapperElement) {
      console.error('Wrapper element not found');
      return;
    }

    html2canvas(wrapperElement).then((canvas) => {
      const imageData = canvas.toDataURL('image/png');

      const imageBlob = this.dataURItoBlob(imageData);


      const imageUrl = URL.createObjectURL(imageBlob);

      const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        imageUrl
      )}`;
      window.open(linkedInShareUrl, '_blank', 'width=600,height=400');
    });
  }

  // Helper function to convert data URI to Blob
  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  determineBadges(): string[] {
    const earnedBadges: string[] = [];

    // Application Ace badge
    if (this.loanApplications >= 500) {
      earnedBadges.push('application-ace.svg');
    }

    // Approval Pro badge
    if (this.approvedLoansCount >= 500) {
      earnedBadges.push('approval-pro.svg');
    }

    // Diligent Evaluator badge - based on total reviewed applications
    if ((this.approvedLoansCount + this.rejectedLoansCount) >= 500) {
      earnedBadges.push('diligent-evaluation.svg');
    }

    // Disbursement Dynamo badge
    if (this.disbursementCount >= 500) {
      earnedBadges.push('disbursement-dynamo.svg');
    }

    // Network Builder badge
    if (this.customersCreated >= 500) {
      earnedBadges.push('network-builder.svg');
    }

    // Engagement Expert badge
    if (this.loginCount >= 500) {
      earnedBadges.push('engagement-expert.svg');
    }

    return earnedBadges;
  }

  getAllMetrics(): void {
    this.wrappedService
      .getGeneralMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.loginCount = res.mostAccessModuleCount;
      });
      this.wrappedService
      .getLoanDisbursementMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.disbursementAmount = res.totalDisbursedVolume;
        this.disbursementCount = res.totalDisbursedCount;
      });
      this.wrappedService
      .getLoanCreationMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.loanApplications = res.loansCreatedCount;
        this.loanApplicationSum = res.loansCreatedSum;
        this.customersCreated = res.customersCreatedCount;

        const performance = (res.totalNumberOfPerformingLoans / this.loanApplications) * 100
        this.percentagePerforming = (performance).toFixed(2);


      });

      this.wrappedService
      .getLoanUnderwriterMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.approvedLoansAmount = res.totalVolumeOfLoansApproved;
        this.approvedLoansCount = res.totalCountOfLoansApproved;
        this.rejectedLoansAmount = res.totalVolumeOfLoansRejected;
        this.rejectedLoansCount = res.totalCountOfLoansRejected;

      });

      this.wrappedService
      .getInvestmentApprovalMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.approvedInvestmentAmount = res.totalValueOfInvestmentsApproved;
        this.approvedInvestmentCount = res.totalCountOfInvestmentsApproved;
        this.runningInvestmentsApprovedCount = res.totalCountOfRunningInvestmentsApproved;
        this.runningInvestmentsApprovedAmount = res.totalValueOfRunningInvestmentsApproved;

      });

      this.wrappedService
      .getInvestmentCreatedMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.investmentsCreatedSum = res.investmentsCreatedSum;
        this.investmentsCreatedCount = res.investmentsCreatedCount;
        this.investmentsCustomersCreatedCount = res.investmentsCustomersCreatedCount;

      });

      this.wrappedService
      .getLiquidatedInvestmentMetrics()
      .pipe(pluck("data"), take(1))
      .subscribe((res) => {
        this.liquidatedInvestmentCount = res.totalNumberofLiquidatedInvestments;
        this.liquidatedInvestmentAmount = res.sumofLiquidatedInvestments;

      });

  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  saveImage() {
    this.isDownloading = true;
    html2canvas(this.preview.nativeElement, { useCORS: true })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `${this.year} activity review.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      })
      .finally(() => {
        this.isDownloading = false;
      });
  }
}
