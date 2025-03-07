import { Component, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { AllModulesEnum } from "src/app/util/models/all-modules.enum";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "lnd-bulk-processes",
  templateUrl: "./bulk-processes.component.html",
  styleUrls: ["./bulk-processes.component.scss"],
})
export class BulkProcessesComponent implements OnInit, OnDestroy {
  pagination = {
    pageNumber: 1,
    pageSize: 10,
    code: null,
    totalCount: 0,
    count: 0,
    jumpArray: [],
    type: null,
    status: null,
    totalPages: 0,
  };
  pagination2 = {
    pageNumber: 1,
    pageSize: 10,
    code: null,
    totalCount: 0,
    count: 0,
    jumpArray: [],
    type: null,
    status: null,
    totalPages: 0,
  };
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  loggedInUser: any;
  currentuser: any;
  ownerInformation: any;
  currentview: number;
  requestLoader: boolean;
  loader: boolean;
  hover_app_mine: boolean;
  hover_app_all: boolean;
  statusArr: string[] = ["Created", "Processing", "Done", "Failed"];
  loantypesArray: any[] = [
    { id: "LoanPayments", text: "Loan Payments" },
    { id: "LoanExtensions", text: "Loan Extensions" },
  ];

  myLogs: any[] = [];
  allLogs: any[] = [];

  openedLogResult: any;
  filterForm: UntypedFormGroup;
  currentModule = sessionStorage.getItem("module");
  moduleEnum = AllModulesEnum;
  loadingSingleLog: boolean;
  downloadingFile: boolean;
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor(
    private configService: ConfigurationService,
    public authService: AuthService,
    private userService: UserService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private sharedService:SharedService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.getConstants();
        this.currentview = 1;
        this.switchviews(this.currentview);
      })
      .catch((err) => {});
  }

  getItemsPaginatedSearch(
    filter: string,
    pageSize: number,
    pageNumber: number,
    view?: string
  ) {
    this.requestLoader = true;
    filter = filter?.trim();
    if (view === "all") {
      this.allLogs = [];
      this.pagination2.code = filter === "" ? null : filter;
      this.getAllUserBulkProcess(filter, pageNumber, pageSize);
      return;
    }
    this.myLogs = [];
    this.pagination.code = filter === "" ? null : filter;
    this.getUserBulkProcess(filter, pageNumber, pageSize);
    return;
  }

  getUserBulkProcess(
    filter = null,
    pageNumber = this.pagination.pageNumber,
    pageSize = this.pagination.pageSize,
    isSingle = false
  ): void {
    isSingle ? (this.loadingSingleLog = true) : (this.requestLoader = true);
    const filters = this.filterForm?.value;
    const model = {
      pageNumber,
      pageSize,
      code: filter,
      module: sessionStorage.getItem("module"),
      status: filters?.status,
      type: filters?.type,
    };
    if (filters?.status) {
      this.filterModel.setData({
        filters: [[{ id: filters?.status, text: filters?.status }]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });
    } else if (filters?.type) {
      this.filterModel.setData({
        filters: [[{ id: filters?.type, text: filters?.type }]],
        filterTypes: ["type"],
        filterHeaders: ["Loan type"],
      });
    }

    this.configService
      .spoolBulkProcessLogByUser(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          if (!isSingle) {
            this.myLogs = res.body?.data?.items;
            this.pagination = res.body?.data;
            this.pagination.count = this.myLogs.length;
            this.pagination.code = filter;
            this.pagination.jumpArray = Array(this.pagination.totalPages);
            for (let i = 0; i < this.pagination.jumpArray.length; i++) {
              this.pagination.jumpArray[i] = i + 1;
            }
            this.requestLoader = false;
            this.loader = false;
          } else {
            this.loadingSingleLog = false;
            this.openedLogResult = res?.body?.data?.items[0];
          }
        },
        (err) => {
          this.requestLoader = false;
          this.loader = false;
        }
      );
  }

  getAllUserBulkProcess(
    filter = null,
    pageNumber = this.pagination2.pageNumber,
    pageSize = this.pagination2.pageSize,
    isSingle = false
  ): void {
    isSingle ? (this.loadingSingleLog = true) : (this.requestLoader = true);
    const filters = this.filterForm?.value;
    const model = {
      pageNumber,
      pageSize,
      code: filter,
      module: sessionStorage.getItem("module"),
      status: filters?.status,
      type: filters?.type,
    };

    if (filters?.status) {
      this.filterModel.setData({
        filters: [[{ id: filters?.status, text: filters?.status }]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });
    } else if (filters?.type) {
      this.filterModel.setData({
        filters: [[{ id: filters?.type, text: filters?.type }]],
        filterTypes: ["type"],
        filterHeaders: ["Loan type"],
      });
    }

    this.configService
      .spoolBulkProcessLogForAllUsers(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          if (!isSingle) {
            this.allLogs = res.body?.data?.items;
            this.pagination2 = res.body?.data;
            this.pagination2.count = this.allLogs.length;
            this.pagination2.code = filter;
            this.pagination2.jumpArray = Array(this.pagination2.totalPages);
            for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
              this.pagination2.jumpArray[i] = i + 1;
            }
            this.requestLoader = false;
            this.loader = false;
          } else {
            this.loadingSingleLog = false;
            this.openedLogResult = res?.body?.data?.items[0];
          }
        },
        (err) => {
          this.requestLoader = false;
          this.loader = false;
        }
      );
  }

  public switchviews(view: number): void {
    if (view === 1) {
      this.currentview = 1;
      this.requestLoader = true;
      this.getUserBulkProcess();
    } else if (view === 2) {
      this.currentview = 2;
      this.requestLoader = true;
      this.getAllUserBulkProcess();
    }

    this.filterModel.clearData();
  }

  public openResult(content: any, data: any): void {
    if (!this.copy_hover) {
      this.loadingSingleLog = true;
      this.openedLogResult = data;
      this.modalService.open(content, { centered: true });

      if (this.currentview === 1) {
        this.getAllUserBulkProcess(this.openedLogResult?.code, 1, 1, true);
      } else if (this.currentview === 2) {
        this.getAllUserBulkProcess(this.openedLogResult?.code, 1, 1, true);
      }
    }
  }

  public filterLogs(): void {
    this.filterModalOpen();
    this.loader = true;
    if (this.currentview === 1) {
      this.getUserBulkProcess(
        this.pagination.code,
        this.pagination.pageNumber,
        this.pagination.pageSize
      );
    } else if (this.currentview === 2) {
      this.getAllUserBulkProcess(
        this.pagination2.code,
        this.pagination2.pageNumber,
        this.pagination2.pageSize
      );
    }
  }

  getLogById(id: any): void {
    this.loadingSingleLog = true;
    this.configService
      .spoolBulkProcessLogById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.openedLogResult = res.body?.data;
        this.loadingSingleLog = false;
      });
  }

  filterModalOpen(): void {
    $(".filter-menu").toggle();

    if (!this.filterForm) {
      this.filterFormInit();
    }
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  selected(type: string, event: any): void {
    if (type === "status") {
      this.filterForm.get("status").patchValue(event?.id);
    } else if (type === "type" && this.currentModule === this.moduleEnum.Loan) {
      this.filterForm.get("type").patchValue(event?.id);
    }
  }

  removed(type: string, event: any): void {
    if (type === "status") {
      this.filterForm.get("status").patchValue(null);
    } else if (type === "type" && this.currentModule === this.moduleEnum.Loan) {
      this.filterForm.get("type").patchValue(null);
    }

    this.filterModel.clearData();
  }

  private filterFormInit(): void {
    this.filterForm = this.fb.group({
      status: new UntypedFormControl(null),
    });

    if (this.currentModule === this.moduleEnum.Loan) {
      this.filterForm.addControl("type", new UntypedFormControl(null));
    }
  }

  closeModal(): void {
    this.openedLogResult = null;
    this.modalService.dismissAll();
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  private getUserPromise(): any {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
  private getConstants() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
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

  downloadFile(url: string): void {
    saveAs(url, "file.csv");
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchviews(this.currentview);
    });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Log code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
