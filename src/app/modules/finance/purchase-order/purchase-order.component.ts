import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Subject } from "rxjs";
import { pluck, switchMap, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { PurchaseOrderService } from "src/app/service/purchase-order.service";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import { printFile } from "src/app/util/helpers/print.helper";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "app-purchase-order",
  templateUrl: "./purchase-order.component.html",
  styleUrls: ["./purchase-order.component.scss"],
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  @ViewChild("POPaper") POPaper: ElementRef;
  user: any;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  tabLoader: boolean;
  allPurchaseOrders: any[] = [];
  activityLogs: any[] = [];
  isSingleView: boolean = false;
  loading: boolean = false;
  selectedPurchaseOrder: any;
  selectedPurchaseOrderId: any;
  poConverted: boolean = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  tabState: "all" | "open" | "closed" = "open";
  statusState: string[] = ["Draft", "ReDraft", "SentForApproval"];
  appOwner: any;
  businessLogo: string;
  defaultLogo = "assets/images/logo-blue.png";
  base64Image: string = "data:image/png;base64,";
  printStatus: string;
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  ownerInformation: any;
  hoverStyle;
  filterModel: Filter;
  copy_hover = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private poService: PurchaseOrderService,
    private billService: BillsMgtService,
    private configService: ConfigurationService,
    private modalService: NgbModal,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._getAppOwnerDetails();
    this.fetchUser();
    this._loadTheme();
    this.fetchPurchaseOrders();
    this.getApplicationownerinformation();
    this.sharedService.printStatus$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((status) => (this.printStatus = status));
    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
  }

  private _imageToBase64Url(imageUrl: string): void {
    this.sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printPO(filename): void {
    this.printStatus = "Processing";
    printFile(this.POPaper, filename, "PO").then((res) =>
      this.sharedService.printStatus$.next("Print")
    );
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  switchviews(tab: "all" | "open" | "closed", status: string[]): void {
    this.tabState = tab;
    this.statusState = status;
    switch (tab) {
      case "all":
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
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
        this.filterStatuses = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "open":
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        break;
      default:
        break;
    }

    this.filterModel.clearData();
    this.fetchPurchaseOrders();
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  fetchPurchaseOrders(option?): void {
    let model: any = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
    };

    if (option?.id) {
      this.filterModel.setData({
        filters: [[option]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });
    }

    option?.id
      ? (model = { ...model, status: [option?.id] })
      : (model = { ...model, ...option, status: this.statusState });

    // paginated section
    this.pagination.pageNumber = model.pageNumber;
    if (model.pageNumber < 1) {
      this.pagination.pageNumber = 1;
    }
    if (model.pageNumber > this.pagination.totalPages) {
      this.pagination.pageNumber = this.pagination.totalPages || 1;
    }

    this.tabLoader = true;
    this.poService
      .spoolAllPurchaseOrders(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allPurchaseOrders = res?.items;
          this.setPagination(res);
          $(".itemPaginatedJumpModal").toggle(false);

          // For deep linking
          this.getPurchaseOrderIdFromQuery();
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  getPurchaseOrderIdFromQuery() {
    const id = this.route.snapshot.queryParams["purchaseOrderId"];
    if (id) {
      this.viewPurchaseOrder(id);
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  closeView(): void {
    this.isSingleView = false;
    this.configService.isSidebarClosed$.next(false);
  }

  getPurchaseOrder(id: number) {
    this.loading = true;
    this.poService
      .getPurchaseOrderById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.selectedPurchaseOrder = res.body?.data;
        this._getActivityLogs(this.selectedPurchaseOrder.purchaseOrderId);
        this.loading = false;
      });
  }

  private _getActivityLogs(journalId: number): void {
    this.poService
      .getPoActivityLogs(journalId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => (this.activityLogs = res.body));
  }
  callconvertToBillEndpoint($event): void {
    this.tabLoader = true;
    this.poService
      .getPurchaseOrderById(this.selectedPurchaseOrderId)
      .pipe(
        pluck("body"),

        switchMap((response) => {
          let poData = response.data;
          poData.billDate = poData.date;
          poData.files = response.data.files;
          poData.files = [];
          poData.billDueDate = poData.expectedDeliveryDate;
          poData.billReference = poData.purchaseOrderCode;
          poData.billType = "PurchaseOrder";
          poData.lines = response.data.lines.map(
            (data) =>
              (data = {
                ...data,
                purchaseOrderId: response.data.purchaseOrderId,
              })
          );
          delete poData.purchaseOrderId;
          return this.billService.createBill(
            toFormData(poData),
            $event.transactionPin
          );
        })
      )
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            title: "Purchase order converted to bill successfully.",
          });
          this.tabLoader = false;
        },
        (error) => (this.tabLoader = false)
      );
  }

  convertToBill(id: number, content): void {
    Swal.fire({
      type: "info",
      text: "This Action will Convert this Purchase Order to a Bill",
      title: "Convert PurchaseOrder to Bill",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.selectedPurchaseOrderId = id;
        this.modalService.open(content);
      }
    });
  }

  deletePO(id: number): void {
    Swal.fire({
      type: "info",
      text: "This Action will delete this Purchase Order",
      title: "Delete PurchaseOrder",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.tabLoader = true;

        this.poService
          .deletePO(id)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.toast.fire({
                type: "success",
                title: "Purchase order deleted successfully.",
              });
              this.tabLoader = false;
              this.fetchPurchaseOrders();
            },
            (error) => {
              this.tabLoader = false;
            }
          );
      }
    });
  }

  viewPurchaseOrder(id: number,element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.getPurchaseOrder(id);
        this.isSingleView = true;
        this.configService.isSidebarClosed$.next(true);
      }
    });
  }

  private _getAppOwnerDetails() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.appOwner = res.body;
          if (this.appOwner?.logoUrl !== null) {
            this.businessLogo = this.appOwner.logoUrl;
          } else {
            this.businessLogo = this.defaultLogo;
          }

          if (this.businessLogo) {
            this._imageToBase64Url(this.businessLogo);
          }
        },
        (err) => {
          this.businessLogo = this.defaultLogo;
        }
      );
  }

  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  switchTabs(tab: string): void {
    switch (tab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $("#nav-activity,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-overview").addClass("active show");
        $("#tab-activity,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $("#nav-overview,#nav-activity,#nav-files").removeClass("active-tab");

        $("#tab-comments").addClass("active show");
        $("#tab-overview,#tab-activity,#tab-files").removeClass("active show");
        break;

      case "activity":
        $("#nav-activity").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-activity").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "files":
        $("#nav-files").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-activity").removeClass(
          "active-tab"
        );

        $("#tab-files").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-activity").removeClass(
          "active show"
        );
        break;
      default:
        break;
    }
  }

  setPurchaseOrder(event): void {
    this.allPurchaseOrders = event.items;
    this.setPagination(event);
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  submit(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      purchaseOrderId: this.selectedPurchaseOrder.purchaseOrderId,
    };

    this.approvalStatus = payload.status;

    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `PurchaseOrder (${this.selectedPurchaseOrder.purchaseOrderCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `PurchaseOrder (${this.selectedPurchaseOrder.purchaseOrderCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `PurchaseOrder (${this.selectedPurchaseOrder.purchaseOrderCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this PurchaseOrder`,
      title: `${state} PurchaseOrder`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;

        this.poService
          .approvePurchaseOrder(payload, event?.transactionPin)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((res) => {
            this.loading = false;
            this.toast.fire({
              type: "success",
              text: message,
            });
            this.closeModal();
            this.closeView();
            this.fetchPurchaseOrders();
          });
      }
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.statusState = this.filterStatuses.map((item) => String(item.id));
      this.switchviews(this.tabState, this.statusState);
    });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Purchase Order code copied to clipboard",type:'success',timer:3000})
    }
  }

  clonePO() {
    Swal.fire({
      type: "info",
      title: "Clone Purchase Order?",
      text: `Are you sure you want to clone this Purchase Order (${this.selectedPurchaseOrder.purchaseOrderCode})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/purchase-orders/${this.selectedPurchaseOrder.purchaseOrderId}/clone`
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
