import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import { GambleCheck } from "../../../checkout-admin.types";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-gamble-check",
  templateUrl: "./gamble-check.component.html",
  styleUrls: ["./gamble-check.component.scss"],
})
export class GambleCheckComponent implements OnInit, OnDestroy {
  @Input() config:GambleCheck;
  @Output() retrieveConfig = new EventEmitter();
  private subs$ = new Subject();

  hideHints = true;
  currentTheme: ColorThemeInterface;
  form = new FormGroup({
    checkGamblingRate: new FormControl(false),
    gamblingRateCheckApplication: new FormControl([], Validators.required),
    gamblingRate: new FormControl(null, Validators.required),
  });
  gamblingCheckApplications:CustomDropDown[] = [
    { id:"OnlyBelowLimit", text:"OnlyBelowLimit" },
    { id:"OnlyAboveLimit", text:"OnlyAboveLimit" },
    { id:"All", text:"All" }
  ]
  isLoading = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(private colorThemeService: ColorThemeService, private checkoutAdminService:CheckoutAdminService) {}

  ngOnInit(): void {
    this.loadTheme();
    if (this.config) {
      this.form.patchValue({...this.config,gamblingRateCheckApplication:[{id:this.config.gamblingRateCheckApplication,text:this.config.gamblingRateCheckApplication}]})
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleSwitch(value:boolean,control:string){
    this.form.get(control).setValue(value);
  }

  submit(){
    this.isLoading = true;
    const payload = {...this.form.value,gamblingRateCheckApplication:this.form.value.gamblingRateCheckApplication[0]?.id};

    this.checkoutAdminService
      .configureGambleCheck(payload as GambleCheck)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.retrieveConfig.emit(true);
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Gamble Check updated successfully!",
          });
        },
        () => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
