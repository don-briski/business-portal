import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { LayoutNav } from 'src/app/modules/shared/shared.types';

@Component({
  selector: 'lnd-layout-nav',
  templateUrl: './layout-nav.component.html',
  styleUrls: ['./layout-nav.component.scss']
})
export class LayoutNavComponent implements OnInit, OnDestroy{
  @Input() layoutNavs:LayoutNav[];

  private subs$ = new Subject();

  currentTheme:ColorThemeInterface & { textColor?: string };

  constructor(private colorThemeService:ColorThemeService){}

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
        if (this.currentTheme.theme === "Light Mode") {
          this.currentTheme = { ...this.currentTheme, textColor: "#000" };
        } else if (this.currentTheme.theme === 'Dark') {
          this.currentTheme = {...this.currentTheme};
        }
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
