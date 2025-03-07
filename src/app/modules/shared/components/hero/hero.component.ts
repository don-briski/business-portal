import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { darkenColor } from '../../helpers/generic.helpers';

@Component({
  selector: 'lnd-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title?:string;
  @Input() subTitle?:string;
  @Input() tabs?:string[];

  currentTabIndex = 0;

  @Output() tabIndex = new EventEmitter<number>();

  private subs$ = new Subject();

  currentTheme:ColorThemeInterface;
  bgColor:string;

  constructor(private colorThemeService:ColorThemeService){}

  ngOnChanges(changes: SimpleChanges): void {
      if (changes.title.currentValue !== changes.title.previousValue) {
        this.currentTabIndex = 0;
      }
  }

  ngOnInit(): void {
    this.loadTheme();

    this.bgColor = darkenColor(this.currentTheme.primaryColor,20);
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  switchTab(index:number){
    this.currentTabIndex = index;
    this.tabIndex.emit(this.currentTabIndex);
  }

  ngOnDestroy(): void {
      this.subs$.next();
      this.subs$.complete();
  }
}
