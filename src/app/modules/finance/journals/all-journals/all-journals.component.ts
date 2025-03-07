import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
} from "@angular/core";
import { FinanceService } from "../../service/finance.service";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import { FinanceStatus } from "../../finance.types";
import { FetchJournalsPayload } from "../../types/Journal";
import {
  ALL_FINANCE_STATUSES,
  CLOSED_FINANCE_STATUSES,
  OPEN_FINANCE_STATUSES,
} from "../../utils/finance.utils";
import {
  ImportError,
  ImportErrorEnum,
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import { saveAs } from "file-saver";
import { toFormData } from "src/app/util/finance/financeHelper";
import { excelToJson } from "src/app/modules/shared/helpers/excel_to_json.helper";
import { serializerError } from "src/app/modules/shared/helpers/generic.helpers";

@Component({
  selector: "app-all-journal",
  templateUrl: "./all-journals.component.html",
  styleUrls: ["./all-journals.component.scss"],
})
export class AllJournalsComponent implements OnInit, OnDestroy {
  @ViewChild("closedTab", { static: true }) closedTab: ElementRef<HTMLElement>;
  @ViewChild("importJournalPreview")
  importJournalPreview: ElementRef<HTMLElement>;
  @ViewChild("importErrorsModal")
  private importErrorsModal: TemplateRef<HTMLElement>;

  user;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  pagination: Pagination = {
    pageNumber: 1,
    pageSize: 10,
    searchColumns: [],
    totalCount: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
    totalPages: 0,
  };
  itemsRequestLoader: boolean = false;
  journals: any[] = [];
  ownerInformation: any;
  loading: boolean = false;
  isSingleView: boolean = false;
  selectedJournal;
  selectedJournalId: number;
  tabState: "all" | "open" | "closed" = "open";
  selectedStatuses: FinanceStatus[] = [];
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  urlFragment: any;
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  importLoader = false;
  journalPreviewConfig: TableConfig = {
    small: true,
    theadLight: true,
    rowClickable: false,
  };
  journalPreviewHeaders: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Reference" },
    { name: "Transaction Date" },
    { name: "Notes" },
    { name: "Branch Code" },
  ];
  journalPreviewData: TableData[] = [];
  journalFile: File;
  importErrors: ImportError[] = [];
  importErrorsData: TableData[] = [];
  importErrorsConfig: TableConfig = {
    theadLight: true,
    small: true,
    striped: true,
    bordered: true,
  };
  importErrorsHeaders: TableHeader[] = [
    { name: "Affected Row" },
    { name: "Affected Column" },
    { name: "Error" },
  ];

  constructor(
    private financeService: FinanceService,
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService,
    private route: ActivatedRoute,
    private location: Location,
    private sharedService: SharedService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.selectedStatuses = [
      FinanceStatus.Draft,
      FinanceStatus.Redraft,
      FinanceStatus.SentForApproval,
    ];
    this.fetchUser();
    this.loadTheme();
    this.getConfigInfo();
    this.urlFragment = this.route.snapshot.fragment;
    this.urlFragment === "closed"
      ? this.switchViews("closed")
      : this.getJournals();

    // For deep linking
    this.viewJournalFromQuery();
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
  }

  switchViews(tab: "all" | "open" | "closed"): void {
    this.tabState = tab;
    switch (tab) {
      case "all":
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
        this.selectedStatuses = ALL_FINANCE_STATUSES;
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "closed":
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.selectedStatuses = CLOSED_FINANCE_STATUSES;
        this.filterStatuses = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];

        break;

      case "open":
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.selectedStatuses = OPEN_FINANCE_STATUSES;
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        break;
      default:
        break;
    }
    this.removeFragment();

    this.filterModel.clearData();
    this.getJournals();
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchJournals(event): void {
    if (event === "!Posted") {
      this.removeFragment();
      this.switchViews("open");
    }

    if (event === "closed") {
      this.urlFragment = "closed";
      this.location.replaceState("/finance/journals#closed");
      this.switchViews("closed");
    }
  }

  private removeFragment(): void {
    if (this.urlFragment) {
      this.location.replaceState("/finance/journals");
    }
  }

  getJournals(event?): void {
    if (event?.id) {
      this.selectedStatuses = [event?.id];
      this.filterModel.setData({
        filters: [[event]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });
    }

    // paginated section
    let model: FetchJournalsPayload = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      filter: this.selectedStatuses,
    };

    model = { ...model, ...event };

    this.loading = true;
    this.financeService
      .fetchJournals(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.journals = res.body.items;
        this.setPagination(res);
        this.loading = false;
        $(".itemPaginatedJumpModal").toggle(false);
      });
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.body.pageSize;
    this.pagination.pageNumber = res.body.pageNumber;
    this.pagination.totalCount = res.body.totalCount;
    this.pagination.hasNextPage = res.body.hasNextPage;
    this.pagination.hasPreviousPage = res.body.hasPreviousPage;
    this.pagination.totalPages = res.body.totalPages;
    this.pagination.count = res.body.items.length;
    this.pagination.searchColumns = res.body.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  getConfigInfo() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.ownerInformation = response.body;
        },
        (err) => {
          // swal.fire('Error', err.error, 'error');
        }
      );
  }

  deleteJournal($event: Event, journalId: number): void {
    $event.stopPropagation();
    Swal.fire({
      type: "info",
      text: "This Action will delete this journal",
      title: "Delete Journal",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.financeService
          .deleteJournal(+journalId)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loading = false;
              this.getJournals();
            },
            (error) => {
              this.loading = false;
            }
          );
      }
    });
  }

  viewJournalFromQuery() {
    const journalId = this.route.snapshot.queryParams["journalId"];

    if (journalId) {
      this.selectedJournalId = journalId;
      this.isSingleView = true;
      this.configurationService.isSidebarClosed$.next(true);
    }
  }

  viewJournal(journal?: any, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (
        journal &&
        element?.className.split(" ")[index] !== "show" &&
        !this.copy_hover
      ) {
        this.selectedJournal = journal;
        this.selectedJournalId = journal.journalId;
        this.isSingleView = true;
        this.configurationService.isSidebarClosed$.next(true);
      }
    });
  }

  closeView() {
    this.isSingleView = false;
    this.selectedJournal = null;
    this.configurationService.isSidebarClosed$.next(false);
  }

  close(value: boolean): void {
    this.selectedJournal?.status === "Posted"
      ? (this.urlFragment = "closed")
      : (this.urlFragment = null);
    this.isSingleView = value;
    this.configurationService.isSidebarClosed$.next(false);
  }

  getItemsPaginatedSearch() {
    this.loading = true;
    this.getJournals();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchViews(this.tabState);
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Journal code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  downloadTemplate() {
    this.importLoader = true;
    this.financeService
      .downloadJournalImportTemplate()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const fileName = `sample-journal-template-${moment().format(
            "YYYY-MM-DD-HH:mm:ss"
          )}`;
          saveAs(res.body, fileName);
          this.importLoader = false;
        },
        error: () => {
          this.importLoader = false;
        },
      });
  }

  async importPreview(journal) {
    this.journalFile = journal;
    const header = [
      "code",
      "reference",
      "transactionDate",
      "notes",
      "branchCode",
    ];
    const journalData = await excelToJson(journal, [0], header);
    this.journalPreviewData = journalData["Journals"].map((journal) => ({
      code: { tdValue: journal?.code, type: "code" },
      ref: { tdValue: journal?.reference },
      date: { tdValue: journal?.transactionDate },
      notes: { tdValue: journal?.notes },
      branchCode: { tdValue: journal?.branchCode },
    }));
    this.openModal(this.importJournalPreview);
  }

  submitImportedJournal() {
    const payload = toFormData({ file: this.journalFile });
    this.importLoader = true;
    this.financeService
      .uploadJournals(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.importLoader = false;
          this.closeModal();
          this.getJournals();
          this.toast.fire({
            title: "Journal imported successfully!",
            type: "success",
            timer: 3000,
          });
        },
        error: (err) => {
          this.closeModal();
          this.importLoader = false;
          this.handleImportError(err.error?.data);
        },
      });
  }

  openModal(modal: any, size?: string) {
    this.modalService.open(modal, { centered: true, size: size });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  handleImportError(error) {
    this.loading = false;
    this.importErrors = error;
    if (this.importErrors.length > 0) {
      this.importErrorsData = this.importErrors?.map((error) => ({
        row: { tdValue: error.rowNumber },
        column: { tdValue: error.columnName },
        error: {
          tdValue: error?.error,
        },
      }));
    }
    this.openModal(this.importErrorsModal);
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
