import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  Input,
  Output,
  SimpleChanges,
  EventEmitter,
  TemplateRef,
} from "@angular/core";
import swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";

import { AuthService } from "src/app/service/auth.service";
import { UnitService } from "src/app/service/unit.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil, pluck } from "rxjs/operators";
import Swal from "sweetalert2";

@Component({
  selector: "app-unit",
  templateUrl: "./unit.component.html",
  styleUrls: ["./unit.component.scss"],
})
export class UnitComponent implements OnInit, OnChanges, OnDestroy {
  @Input() openModalState: boolean = false;
  @Input() template: TemplateRef<any>;
  @Input() callFetchUnits: boolean;
  @Output() openEditModal = new EventEmitter();

  private unsubscriber$ = new Subject<void>();

  units: any[] = [];
  unit: any;
  pagination: any = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  isEditing: boolean = false;
  selectedUnitToEditId: number;

  loggedInUser: any;
  currentTheme: ColorThemeInterface;

  unitsRequestLoader: boolean = false;
  unitLoader: boolean = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private authService: AuthService,
    private unitService: UnitService,
    private modalService: NgbModal,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.openModalState?.currentValue) {
      this.openModal(this.template);
    }
    if (changes.callFetchUnits?.currentValue) {
      const payload = {
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
      };
      this.fetchUnits(payload);
    }
  }

  ngOnInit(): void {
    const payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: +this.pagination.pageSize,
    };
    this.loadTheme();
    this.fetchUnits(payload);
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  emitOpenEditModal(unit): void {
    this.openEditModal.emit(unit);
  }
  
  fetchUnits(payload?) {
    this.unitsRequestLoader = true;
    const {keyword, ...data} = payload;
    if (keyword) {
      data.searchTerm = keyword;
    }
    this.units = [];
    this.unitService
      .getUnits(data)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.units = res.items;
          this.setPagination(res);
          this.unitsRequestLoader = false;
        },
        () => {
          this.unitsRequestLoader = false;
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

  getUnitById(unitId) {
    this.unit = null;
    this.unitLoader = true;
    this.unitService.getUnitById(unitId).subscribe(
      (res) => {
        this.unit = res.body;
        this.unitLoader = false;
      },
      (err) => {
        this.unitLoader = false;
      }
    );
  }

  attemptDelete(id: number): void {
    Swal.fire({
      type: "info",
      text: "This action will delete this unit",
      title: "Delete Unit",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.unitsRequestLoader = true;
        this.unitService.deleteUnit(+id).subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              text: "Unit deleted successfully.",
            });
            this.unitsRequestLoader = false;
            const payload = {
              pageNumber: this.pagination.pageNumber,
              pageSize: this.pagination.pageSize,
            };
            this.fetchUnits(payload);
          },
          (error) => {
            this.unitsRequestLoader = false;
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
