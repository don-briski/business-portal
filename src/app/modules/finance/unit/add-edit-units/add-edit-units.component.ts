import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import * as _ from "lodash";
import { AuthService } from "src/app/service/auth.service";
import { UnitService } from "src/app/service/unit.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import Swal from "sweetalert2";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Unit } from "../../types/unit";

@Component({
  selector: "app-add-edit-units",
  templateUrl: "./add-edit-units.component.html",
  styleUrls: ["./add-edit-units.component.scss"],
})
export class AddEditUnitsComponent implements OnInit {
  @Input() unit: Unit;
  @Output() closeModal = new EventEmitter<string>();
  public isEditing: boolean;
  public unitForm: UntypedFormGroup;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  public loggedInUser: any;
  public loader: boolean = false;
  private unsubscriber$ = new Subject<void>();
  public currentTheme: ColorThemeInterface;
  constructor(
    private unitService: UnitService,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.formInit();

    if (this.unit) {
      this.isEditing = true;
      this.patchForm();
    } else {
      this.isEditing = false;
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

  private formInit(): void {
    this.unitForm = this.fb.group({
      name: new UntypedFormControl("", [Validators.required]),
      symbol: new UntypedFormControl("", [Validators.required]),
    });
  }

  closeUnitModal(): void {
    this.closeModal.emit("close");
    this.unitForm.reset();
  }

  public submitForm(): void {
    this.loader = true;
    const data = this.unitForm.value;
    if (!this.isEditing) {
      this.addUnit(data);
    } else {
      this.editUnit(data);
    }
  }

  private addUnit(data: any): void {
    this.unitService
      .createUnit(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Unit added",
          });
          this.loader = false;
          this.unitForm.reset();
          this.formInit();
          this.closeModal.emit("reload");
        },
        (err) => {
          this.loader = false;
        }
      );
  }
  private editUnit(data: any): void {
    this.unitService
      .updateUnit(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Unit has been successfully updated.",
          });
          this.loader = false;
          this.unitForm.reset();
          this.formInit();
          this.closeModal.emit("reload");
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  private patchForm(): void {
    this.unitForm.addControl(
      "unitId",
      new UntypedFormControl(this.unit.unitId, [Validators.required])
    );

    this.unitForm.patchValue({
      name: this.unit.name,
      symbol: this.unit.symbol,
    });
    this.unitForm.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
