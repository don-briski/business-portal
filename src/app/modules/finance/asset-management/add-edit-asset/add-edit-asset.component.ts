import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { map, takeUntil, pluck, tap } from "rxjs/operators";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { UserService } from "src/app/service/user.service";
import * as _ from "lodash";
import { AuthService } from "src/app/service/auth.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import Swal from "sweetalert2";
import * as moment from "moment";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ConfigurationService } from "src/app/service/configuration.service";
import { User } from "src/app/modules/shared/shared.types";
import { FinanceService } from "../../service/finance.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-add-edit-asset",
  templateUrl: "./add-edit-asset.component.html",
  styleUrls: ["./add-edit-asset.component.scss"],
})
export class AddEditAssetComponent implements OnInit, OnDestroy {
  public branchList: any[] = [];
  allBranches: any[] = [];
  public employeeList: any[] = [];
  private unsubscriber$ = new Subject<void>();
  public assetForm: UntypedFormGroup;
  private allAssetsSubClass: any[] = [];
  public filteredAssetSubClass: any[] = [];
  generateAssetCodeOpt: any[] = [
    { id: 1, text: "Yes" },
    { id: 2, text: "No" },
  ];

  activateAssetOpt: any[] = [
    { id: 1, text: "Yes" },
    { id: 2, text: "No" },
  ];

  public loggedInUser: any;
  public loader: boolean;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  public isEditing: boolean;
  public editingAssetCard: any;
  public currentTheme: ColorThemeInterface;
  public selectedAssetToEditId: number;
  public assetSubClassPrefix: string = null;
  assetClass: any[] = [
    { id: 1, text: "Intangible Assets" },
    { id: 2, text: "Property Plant And Equipment" },
  ];
  depreciationMethods: any[] = [
    { id: 1, text: "No Depreciation" },
    { id: 2, text: "Straight Line" },
    { id: 3, text: "Declining Balance" },
  ];
  activeBranch: any[] = [];
  ownerInformation: any;
  quantityIsDecimal = false;
  selectedDepMtd = "";
  startDate = "2021-11-20";
  currentBranch = "BranchCode";
  disableQuantity = true;
  vendors: CustomDropDown[] = [];
  responsiblePersons: CustomDropDown[] = [];
  defaultPaymentTerm: CustomDropDown[] = [];
  paymentTerms: CustomDropDown[] = [];
  invalidDateError = false;
  depDate: string;
  activationDate: string;

  private user: User;

  constructor(
    private userService: UserService,
    private assetMgtService: AssetMgtService,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private route: ActivatedRoute,
    private configService: ConfigurationService,
    private finServ: FinanceService,
    private modalService: NgbModal
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;
      } else {
        this.isEditing = false;
      }
    });

    this.route.paramMap
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((params: ParamMap) => {
        this.selectedAssetToEditId = +params.get("id");
      });
  }

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.formInit();
    this.getApplicationownerinformation();
    this.fetchBranchList();
    this.loadAllAssetSubClass();
    this.startClassNameWatch();
    this.getVendors();
    this.fetchUsers(this.loggedInUser.nameid);
    this.getPaymentTerms();
    this.getLastAssetDepreciationPeriod();

    if (this.isEditing) {
      this.getAssetCard(this.selectedAssetToEditId);
    }
  }

  private getLastAssetDepreciationPeriod(): void {
    this.assetMgtService
      .getLastAssetDepreciationPeriod()
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res?.lastDepreciationEndDate) {
          this.depDate = res?.lastDepreciationEndDate;
        }

        if (res?.activationDate) {
          this.activationDate = res?.activationDate;
        }
      });
  }

  private getVendors() {
    const model = {
      filter: "VendorsOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.finServ
      .getCustomersOrVendorsSummary(model)
      .pipe(pluck("body", "items"), takeUntil(this.unsubscriber$))
      .subscribe((vendors) => {
        this.vendors = vendors;
      });
  }

  private fetchUsers(id: any) {
    const data = {
      UserId: id,
      Num: 1000,
    };

    this.userService
      .FetchAllUsersPaginated("allusersshortdetailspaginated", data)
      .pipe(
        pluck("body", "data"),
        map((res) => {
          return res.items?.map((user) => ({
            id: user.personId,
            text: user.displayName,
          }));
        })
      )
      .subscribe((responsiblePersons) => {
        this.responsiblePersons = responsiblePersons;
      });
  }

  private getPaymentTerms(): void {
    this.finServ
      .spoolAllPaymentTerms({ pageNum: 1, pageSize: 100, isActive: true })
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentTerms) => {
          const paymentTerm = paymentTerms.find(
            (paymentTerm) => paymentTerm.isDefault
          );

          if (paymentTerm) {
            const defaultPaymentTerm = [
              {
                id: paymentTerm.paymentTermId,
                text: paymentTerm.paymentTermName,
              },
            ];

            this.assetForm.get("paymentTerm").setValue(defaultPaymentTerm);

            this.assetForm
              .get("paymentTermId")
              .setValue(paymentTerm.paymentTermId);
          }
        }),
        map((paymentTerms) => {
          return paymentTerms.map((acc) => {
            return {
              id: acc?.paymentTermId,
              text: `${acc?.paymentTermName} (${acc?.paymentTermDays} days)`,
            };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((paymentTerms) => {
        this.paymentTerms = paymentTerms;
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

  private fetchUser(): void {
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

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  private formInit(): void {
    this.assetForm = this.fb.group({
      assetCode: new UntypedFormControl(null, [Validators.required]),
      assetName: new UntypedFormControl("", [Validators.required]),
      assetclass: new UntypedFormControl(null, [Validators.required]),
      assetClass: new UntypedFormControl(null, [Validators.required]),
      assetSubClass: new UntypedFormControl(null, [Validators.required]),
      assetSubClassId: new UntypedFormControl(null, [Validators.required]),
      generateassetcode: new UntypedFormControl([{ id: 2, text: "No" }]),
      generateAssetCode: new UntypedFormControl("No"),
      dateOfPurchaseOrAcquisition: new UntypedFormControl("", [Validators.required]),
      effectiveLifeInYears: new UntypedFormControl(1, [Validators.required]),
      quantity: new UntypedFormControl(1, [Validators.required]),
      purchasePrice: new UntypedFormControl(null, [Validators.required]),
      residualValue: new UntypedFormControl(null, [Validators.required]),
      descriptionOfAsset: new UntypedFormControl("", [Validators.required]),
      assignedEmployeeId: new UntypedFormControl(null),
      assetActivationDate: new UntypedFormControl(null),
      branchId: new UntypedFormControl("", [Validators.required]),
      selectedBranches: new UntypedFormControl(""),
      depreciationmethod: new UntypedFormControl(null, [Validators.required]),
      depreciationMethod: new UntypedFormControl(null, [Validators.required]),
      depreciationRate: new UntypedFormControl(null),
      depreciationEndDate: new UntypedFormControl(""),
      location: new UntypedFormControl(""),
      activateassetnow: new UntypedFormControl([{ id: 2, text: "No" }]),
      activateAssetNow: new UntypedFormControl("No"),
      raiseBill: new UntypedFormControl(false),
      vendorId: new UntypedFormControl(null),
      vendor: new UntypedFormControl(null),
      billDate: new UntypedFormControl(null),
      billDueDate: new UntypedFormControl(null),
      paymentTermId: new UntypedFormControl(null),
      paymentTerm: new UntypedFormControl(null),
      reference: new UntypedFormControl(null),
      responsiblePersonId: new UntypedFormControl(null),
      responsiblePerson: new UntypedFormControl(null),
    });

    this.assetForm
      .get("generateAssetCode")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res === "No") {
          this.disableQuantity = true;
          this.assetForm.get("quantity").setValue(1, { emitEvent: false });
        } else {
          this.disableQuantity = false;
        }
        this.assetForm.get("generateAssetCode").disable({ emitEvent: false });
      });

    this.assetForm
      .get("quantity")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res - Math.floor(res) !== 0) {
          this.quantityIsDecimal = true;
        } else {
          this.quantityIsDecimal = false;
        }
      });

    this.assetForm
      .get("assetSubClass")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const subclass = this.allAssetsSubClass.filter(
          (subClass) => subClass?.assetSubClassId === res[0]?.id
        );
        this.assetForm.get("depreciationmethod").setValue([
          {
            id: subclass[0]?.depreciationMethod,
            text: subclass[0]?.depreciationMethod,
          },
        ]);

        this.assetForm
          .get("depreciationMethod")
          .valueChanges.pipe(takeUntil(this.unsubscriber$))
          .subscribe((res) => {
            if (res === "DecliningBalance") {
              this.assetForm.get("residualValue").clearValidators();
              this.assetForm.get("effectiveLifeInYears").clearValidators();
            } else {
              this.assetForm
                .get("residualValue")
                .setValidators(Validators.required);
              this.assetForm
                .get("residualValue")
                .setValue(subclass[0]?.residualValue);
              this.assetForm
                .get("effectiveLifeInYears")
                .setValue(subclass[0]?.effectiveLifeInYears);
            }
            this.assetForm.get("residualValue").updateValueAndValidity();
            this.assetForm.get("effectiveLifeInYears").updateValueAndValidity();
          });
      });

    this.assetForm
      .get("vendor")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((vendor) => {
        if (vendor) {
          this.assetForm.get("vendorId").setValue(vendor[0]?.id);
        }
      });

    this.assetForm
      .get("paymentTerm")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((paymentTerm) => {
        if (paymentTerm) {
          this.assetForm.get("paymentTermId").setValue(paymentTerm[0]?.id);
        }
      });

    this.assetForm
      .get("responsiblePerson")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((responsiblePerson) => {
        if (responsiblePerson) {
          this.assetForm
            .get("responsiblePersonId")
            .setValue(responsiblePerson[0]?.id);
        }
      });
  }

  private fetchBranchList(): void {
    this.userService
      .fetchAllBranches()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.branchList = res.body;
      });
  }

  private startClassNameWatch(): void {
    this.assetForm
      .get("assetClass")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res !== null) {
          this.filterAssetSubClass(res);
        }
      });

    this.assetForm
      .get("assetclass")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.assetForm.get("assetClass")?.setValue(res[0]?.text);
      });

    this.assetForm
      .get("assetSubClass")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.assetForm.get("assetSubClassId").setValue(res[0]?.id);
      });

    this.assetForm
      .get("generateassetcode")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.assetForm.get("generateAssetCode").setValue(res[0]?.text);
      });

    this.assetForm
      .get("activateassetnow")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.assetForm.get("activateAssetNow").setValue(res[0]?.text);
      });

    this.assetForm
      .get("depreciationmethod")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.selectedDepMtd = res[0]?.text;
        const value = res[0]?.text?.replace(/\s+/g, "");
        if (value !== null) {
          this.assetForm.get("depreciationMethod").setValue(value);
          if (value === "DecliningBalance") {
            this.assetForm
              .get("depreciationRate")
              .setValidators([Validators.required]);
          } else {
            this.assetForm.get("depreciationRate").clearValidators();

            this.assetForm.get("depreciationRate").patchValue(null);
          }
          this.assetForm.updateValueAndValidity();
        }
      });
    this.assetForm
      .get("activateAssetNow")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res !== null) {
          if (res === "Yes") {
            this.assetForm
              .get("assetActivationDate")
              .setValidators([Validators.required]);
          } else {
            this.assetForm.get("assetActivationDate").clearValidators();

            this.assetForm.get("assetActivationDate").patchValue(null);
          }
          this.assetForm.updateValueAndValidity();
        }
      });

    this.assetForm
      .get("dateOfPurchaseOrAcquisition")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const actDate = this.assetForm.get("assetActivationDate").value;

        if (res !== null && this.isBeforeToday(res)) {
          Swal.fire({
            title: "Date of Purchase",
            text: "You're creating an asset with a purchase date in the past.",
            type: "info",
          });
        }

        if (res !== null && actDate !== null) {
          if (this.isGreaterThanToday(res)) {
            Swal.fire({
              title: "Change selected date",
              text: "Date of purchase or acquisition cannot be a future date.",
              type: "info",
            });
            this.assetForm.get("dateOfPurchaseOrAcquisition").patchValue(null);
          }

          if (actDate && !this.compareDate(actDate, res)) {
            Swal.fire({
              title: "Change selected date",
              text: "Date of purchase or activation cannot be ahead of asset acquistion date.",
              type: "info",
            });
            this.assetForm.get("dateOfPurchaseOrAcquisition").patchValue(null);
          }
        }
      });

    this.assetForm
      .get("assetActivationDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res !== null) {
          const dateOfPurch = this.assetForm.get(
            "dateOfPurchaseOrAcquisition"
          ).value;

          if (dateOfPurch && !this.compareDate(res, dateOfPurch)) {
            this.invalidDateError = true;
            Swal.fire({
              title: "Change selected date",
              text: "Asset activation date cannot be before date of purchase.",
              type: "info",
            }).then((res) => {
              this.invalidDateError = false;
            });
          }

          if (
            this.compareDate(
              this.depDate,
              this.assetForm.get("dateOfPurchaseOrAcquisition").value
            ) &&
            this.depDate
          ) {
            Swal.fire({
              type: "info",
              text: `Depreciation for the asset${
                this.assetForm.get("quantity").value > 1 ? "s" : ""
              } would be posted till last depreciation date ${moment(
                this.depDate
              ).format("yyyy-MM-DD")} !`,
              title: "Activation date in the past",
              confirmButtonText: "OK",
              confirmButtonColor: "#558E90",
            });
          }
        }
      });

    this.assetForm
      .get("generateAssetCode")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res === "No") {
          this.assetForm.get("assetCode")?.reset(null);
          this.assetForm.get("assetCode")?.setValidators([Validators.required]);
        } else {
          this.assetForm.get("assetCode").clearValidators();
        }

        this.assetForm.get("assetCode").updateValueAndValidity();
      });

    this.assetForm
      .get("assetSubClassId")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res !== null) {
          this.setSubClassPrefix();
        }
      });
  }

  selectBranch(event: any): void {
    this.assetForm.get("branchId").patchValue(event.id);
    const branch = this.branchList.filter((branch) => branch.id === event.id);
    this.currentBranch = branch[0].branchCode;

    if (branch) {
      this.fetchAllEmpoyee({ branchId: branch[0].id });
    }
  }

  private loadAllAssetSubClass(): void {
    const model = {
      pageNumber: 1,
      pageSize: 1000,
    };
    this.assetMgtService
      .spoolAssetSubClasses(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allAssetsSubClass = res.body.data?.items;
      });
  }
  private addAsset(data: any, transactionPin): void {
    this.assetMgtService
      .createAsset(data, transactionPin)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          let msg;
          if (data.activateAssetNow === "Yes") {
            msg = "Asset has been created and activated successfully.";
          } else {
            msg = "Asset has been created and saved as draft.";
          }
          this.toast.fire({
            type: "success",
            text: msg,
          });
          this.loader = false;
          this.router.navigateByUrl("finance/assets/all");
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  setPurchaseDate($event) {
    this.assetForm
      .get("dateOfPurchaseOrAcquisition")
      .setValue($event.target.value);
  }

  setActivationDate($event) {
    this.assetForm.get("assetActivationDate").setValue($event.target.value);
  }
  private editAsset(data: any, transactionPin): void {
    this.assetMgtService
      .updateAsset(data, transactionPin)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Asset card has been successfully updated.",
          });
          this.loader = false;
          this.assetMgtService.setAssetEditId(null);
          this.router.navigateByUrl("finance/assets/all");
        },
        (err) => {
          this.loader = false;
        }
      );
  }
  private fetchAllEmpoyee(payload: any) {
    this.employeeList = [];
    const model = {
      pageSize: 10,
      ...payload,
    };

    this.userService
      .FetchAllUsersPaginated("allusersshortdetailspaginated", model)
      .pipe(
        pluck("body", "data", "items"),
        map((employees) => {
          return employees.map((user) => ({
            id: user.personId,
            text: user.displayName,
          }));
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((employees) => (this.employeeList = employees));
  }
  private getAssetCard(id: any): void {
    this.assetMgtService
      .getAssetById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.editingAssetCard = res.body.data;
        this.patchForm();
      });
  }

  selectEmployee(event): void {
    this.assetForm.get("assignedEmployeeId").setValue(event.id);
  }

  private patchForm(): void {
    this.assetForm.get("quantity").disable();
    this.assetForm.addControl(
      "assetCardId",
      new UntypedFormControl(null, [Validators.required])
    );
    const assetClass = this.allAssetsSubClass.find(
      (x) => x.assetSubClassId === this.editingAssetCard?.assetSubClassId
    )?.assetClass;

    this.assetForm.get("assetClass").setValue(assetClass);

    const assetclass = this.assetClass.filter(
      (assetclass) => assetclass.text === assetClass
    );

    this.assetForm.get("assetclass").setValue(assetclass);

    const subClass = this.allAssetsSubClass.filter(
      (subclass) =>
        subclass.assetSubClassId === this.editingAssetCard.assetSubClassId
    );

    const assetSubClass = subClass.map((e) => ({
      id: e.assetSubClassId,
      text: e.assetSubClassName,
    }));

    this.assetForm.get("assetSubClass").setValue(assetSubClass);

    this.editingAssetCard.depreciationmethod = this.depreciationMethods.filter(
      (depMeth) =>
        depMeth.text.replace(/\s+/g, "") ===
        this.editingAssetCard.depreciationMethod
    );

    this.editingAssetCard.assetActivationDate =
      this.formatDate(this.editingAssetCard?.assetActivationDate) ?? null;
    this.editingAssetCard.depreciationEndDate =
      this.formatDate(this.editingAssetCard?.depreciationEndDate) ?? null;
    this.editingAssetCard.depreciationStartDate =
      this.formatDate(this.editingAssetCard?.depreciationStartDate) ?? null;
    this.editingAssetCard.dateOfPurchaseOrAcquisition = this.formatDate(
      this.editingAssetCard?.dateOfPurchaseOrAcquisition
    );
    this.editingAssetCard.depreciationMethod =
      this.editingAssetCard?.depreciationMethod?.split(" ").join("");

    this.editingAssetCard.branchId =
      this.editingAssetCard?.branchId === 0
        ? 1
        : this.editingAssetCard?.branchId;

    this.editingAssetCard.assignedEmployeeId =
      this.editingAssetCard.assignedEmployeeId;

    this.assetForm.patchValue(this.editingAssetCard);
    this.assetForm.get("selectedBranches").patchValue([
      {
        id: this.editingAssetCard.branchId,
        text: this.editingAssetCard.branchName,
      },
    ]);
    this.currentBranch = this.editingAssetCard.branchName;
    if (this.editingAssetCard.status === "Active") {
      this.assetForm.get("activateAssetNow").patchValue("Yes");
    }

    this.assetForm
      .get("effectiveLifeInYears")
      .setValue(this.editingAssetCard.effectiveLifeInYears);

    this.assetForm
      .get("residualValue")
      .setValue(this.editingAssetCard.residualValue);

    this.assetForm
      .get("assetCode")
      .setValue(this.editingAssetCard.assetCode.split("/")[2]);
  }

  private setSubClassPrefix(): void {
    const assetSubClassId = this.assetForm.get("assetSubClassId").value;
    const assetSubClass = this.allAssetsSubClass.find(
      (assetClass) =>
        assetClass.assetSubClassId.toString() === assetSubClassId.toString()
    );
    this.assetSubClassPrefix = assetSubClass?.assetSubClassTagPrefix ?? "GEN";
    this.assetForm
      .get("depreciationMethod")
      .patchValue(assetSubClass?.depreciationMethod?.split(" ").join(""));
    this.assetForm
      .get("depreciationRate")
      .patchValue(assetSubClass?.depreciationRate);
  }

  public attemptFormSubmit(approvalElem?): void {
    const activationDate = this.assetForm.get("assetActivationDate").value;

    if (activationDate && !this.assetForm.get("raiseBill").value) {
      this.submitForm();
    } else if (activationDate && this.assetForm.get("raiseBill").value) {
      Swal.fire({
        type: "info",
        text: "click ok to proceed",
        title: "This will post a bill invoice",
        confirmButtonText: "OK",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value && approvalElem) {
          this.openModal(approvalElem);
        }
      });
    } else {
      Swal.fire({
        type: "info",
        text: "Are you sure you want to save this asset without activation date? \n This will save asset card as draft.",
        title: "Save as draft?",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Cancel",
        confirmButtonText: "Yes, save as draft",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value) {
          this.submitForm();
        }
      });
    }
  }

  private submitForm($event?): void {
    if (
      this.assetForm.get("assetCode") &&
      this.assetForm.get("generateAssetCode").value === "No" &&
      this.assetSubClassPrefix
    ) {
      this.assetForm
        .get("assetCode")
        .setValue(
          this.currentBranch?.toUpperCase() +
            "/" +
            this.assetSubClassPrefix +
            "/" +
            this.assetForm.get("assetCode").value
        );
    }

    if (this.assetForm.get("raiseBill").value) {
      this.assetForm.removeControl("vendor");
      this.assetForm.removeControl("paymentTerm");
      this.assetForm.removeControl("responsiblePerson");
    }
    this.loader = true;
    const {
      depreciationmethod,
      assetclass,
      assetSubClass,
      generateassetcode,
      ...data
    } = this.assetForm.value;
    let transactionPin = null;
    if ($event) {
      transactionPin = $event.transactionPin;
    }

    if (data.generateAssetCode === "Yes") {
      delete data.assetCode;
    }

    if (!this.isEditing) {
      this.addAsset(data, transactionPin);
    } else {
      this.editAsset(data, transactionPin);
    }
  }

  protected filterAssetSubClass(value: string): void {
    this.filteredAssetSubClass = [];
    const allSubClass: any[] = [...this.allAssetsSubClass];

    const filtered: any[] = allSubClass.filter((e) => e.assetClass === value);

    this.filteredAssetSubClass = filtered.map((subclass) => ({
      id: subclass.assetSubClassId,
      text: subclass.assetSubClassName,
    }));
  }

  protected formatDate(date: string): string {
    if (!date) return;
    let newDate = new Date(date);
    return moment(newDate).format("yyyy-MM-DD");
  }

  protected isGreaterThanToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }

  isBeforeToday(date: string): boolean {
    const chosenDate = new Date(date);
    const currentDate = new Date();

    const currentTime = currentDate.getTime();
    const millisecondsInADay = 86400000;
    const diff = currentTime - chosenDate.getTime();
    return diff > millisecondsInADay;
  }

  protected compareDate(dateA: any, dateB: any): boolean {
    const dateVal1 = moment(dateA);
    const dateVal2 = moment(dateB);
    const difference = dateVal1.diff(dateVal2);
    if (difference >= 0) {
      return true;
    } else {
      return false;
    }
  }

  setRaiseBill($event): void {
    if (this.assetForm.get("activateAssetNow").value === "Yes") {
      this.assetForm.get("raiseBill").setValue($event);

      if ($event) {
        this.assetForm.get("vendorId").setValidators(Validators.required);
        this.assetForm.get("billDate").setValidators(Validators.required);
        this.assetForm.get("billDueDate").setValidators(Validators.required);
        this.assetForm.get("paymentTermId").setValidators(Validators.required);
      } else {
        this.assetForm.get("vendor").reset();
        this.assetForm.get("vendorId").reset();
        this.assetForm.get("billDate").reset();
        this.assetForm.get("billDueDate").reset();
        this.assetForm.get("paymentTerm").reset();
        this.assetForm.get("paymentTermId").reset();

        this.assetForm.get("vendorId").clearValidators();
        this.assetForm.get("billDate").clearValidators();
        this.assetForm.get("billDueDate").clearValidators();
        this.assetForm.get("paymentTermId").clearValidators();
      }
      this.assetForm.get("vendorId").updateValueAndValidity();
      this.assetForm.get("billDate").updateValueAndValidity();
      this.assetForm.get("billDueDate").updateValueAndValidity();
      this.assetForm.get("paymentTermId").updateValueAndValidity();
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.assetMgtService.setAssetEditId(null);
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
