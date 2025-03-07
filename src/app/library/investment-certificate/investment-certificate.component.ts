import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { TableConfig, TableData, TableHeader, TableSummation } from "src/app/modules/shared/shared.types";
import { PreviewInvestmentCertData } from "src/app/modules/treasury/types/investment.type";
import {
  InvestmentCertInfo,
} from "src/app/modules/treasury/types/investment-certificate";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import { accumulator } from "src/app/util/finance/financeHelper";
import { printFile } from "src/app/util/helpers/print.helper";

@Component({
  selector: "app-investment-certificate",
  templateUrl: "./investment-certificate.component.html",
  styleUrls: ["./investment-certificate.component.scss"],
})
export class InvestmentCertificateComponent implements OnInit, OnDestroy {
  @Input() data: PreviewInvestmentCertData;

  @Input()
  isModal: boolean;

  @Input()
  currentTheme: ColorThemeInterface;
  @ViewChild("InvCertPaper") InvCertPaper: ElementRef;

  year: any;
  ownerInformation: any;
  investmentInfo: InvestmentCertInfo[] = [];
  invCertConfig:TableConfig;
  invCertHeaders: TableHeader[] = [];
  invCertData: TableData[] = [];
  totalNetInterest = 0;
  totalWHT = 0;
  totalGrossInterest = 0;
  summationData:TableSummation[] = [];
  printStatus:string;
  private subs$ = new Subject<void>()

  showTnC = false;
  termsnConditions: {id: number; description: string}[] = []
  constructor(
    public activeModal: NgbActiveModal,
    private configService: ConfigurationService,
    private sharedService:SharedService
  ) {}

  ngOnInit(): void {
    this.sharedService.printStatus$
      .pipe(takeUntil(this.subs$))
      .subscribe((status) => {
        if (status === "Print") {
          this.printStatus = "Download PDF";
        }
      });

    this.year = moment().format("yyyy");
    this.getApplicationownerinformation();
    this.invCertHeaders.push( { name: "Date" },
    { name: "Tenor (Days)" },
    { name: "Gross", type:"amount" },
    { name: `WHT (${this.data?.investmentTypeInfo?.withHoldingTax || this.data?.withHoldingTax}%)` , type:"amount"},
    { name: `Net Interest (${this.data?.investmentRate}%)`,type:"amount" })
    this.investmentInfo = [
      { title: "Investor", value: this.data?.investorName },
      { title: "Investment", value: this.data.investmentAmount, type:"amount" },
      { title: "Gross Rate (%)", value: this.data.investmentRate },
      { title: "Tenor (days)", value: this.data?.investmentTenor },
      { title: "Investment Start Date", value: this.data?.startDate, type:"date" },
      { title: "Maturity Date", value: this.data?.investmentExpiryDate, type:"date" },
    ];

    this.invCertData = this.data.cycleSchedules.map((cycle) => ({
      date: {
        tdValue: cycle?.cycleStartDate,
        type: "date",
        dateConfig: { format: "mediumDate" },
      },
      tenor: { tdValue: cycle?.tenor },
      gross: { tdValue: cycle?.grossInterest, type: "amount" },
      wht: { tdValue: cycle?.withHoldingTax, type: "amount" },
      netInterest: { tdValue: cycle?.totalInterest, type: "amount" },
    }));

    this.totalNetInterest = accumulator(this.data?.cycleSchedules,"totalInterest");
    this.totalWHT = accumulator(this.data?.cycleSchedules,"withHoldingTax");
    this.totalGrossInterest = accumulator(this.data?.cycleSchedules,"grossInterest");
    this.summationData = [{value:null},{value:"Total:",isLabel:true},{value:this.totalGrossInterest,isLabel:false},{value:this.totalWHT,isLabel:false},{value:this.totalNetInterest,isLabel:false}];
    if (!this.data.total) {
      const total = this.data?.initialDeposit + this.totalNetInterest;
      this.data = {...this.data,total}
    }

    
    this.showTnC = this.data?.investmentTypeInfo?.termsAndConditionsInfoSetup?.displayTermsAndConditions ?? false;
    this.termsnConditions = this.data?.investmentTypeInfo?.termsAndConditionsInfoSetup?.termsAndConditions ?? [];

  }

  public printCertificate(): void {
    this.printStatus = "Processing";
    printFile(this.InvCertPaper, this.ownerInformation?.appOwnerName  , "investment-certificate").then(() =>
      this.sharedService.printStatus$.next("Print")
    );
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
      this.invCertConfig = {currency:this.ownerInformation?.currency?.currencySymbol, summations:true};
    });
  }

  ngOnDestroy(): void {
      this.subs$.next();
      this.subs$.complete();
  }
}
