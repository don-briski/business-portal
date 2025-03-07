import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { AnimationOptions } from "ngx-lottie";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { AllModulesEnum, ModuleCard } from "../models/all-modules.enum";

@Component({
  selector: "lnd-module-card",
  templateUrl: "./module-card.component.html",
  styleUrls: ["./module-card.component.scss"],
})
export class ModuleCardComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Input() moduleCard: ModuleCard;

  @Output() onSetModule = new EventEmitter();

  currentTheme: ColorThemeInterface;
  financeLottieOptions: AnimationOptions;
  allModulesEnum = AllModulesEnum;
  onHover:boolean

  constructor(private colorThemeService: ColorThemeService) {}

  ngOnInit(): void {
    if (this.moduleCard?.lottieFileName) {
      this.financeLottieOptions = {
        path: this.moduleCard.lottieFileName,
      };
    }
    this.loadTheme();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  openModule() {
    sessionStorage.setItem("module", this.moduleCard.module);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
