import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { DndDirective } from "../../directives/dnd.directive";
import { ProgressBarComponent } from "../progress-bar/progress-bar.component";
import { Subject, interval } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { UploadStat } from "../../shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-dragdrop",
  standalone: true,
  imports: [CommonModule, DndDirective, ProgressBarComponent],
  templateUrl: "./dragdrop.component.html",
  styleUrls: ["./dragdrop.component.scss"],
})
export class DragdropComponent implements OnChanges, OnInit, OnDestroy {
  subs$ = new Subject();
  @Input() showSummary = false;
  @Input() allowPreview = false;
  @Input() allowSubmit = true;
  @Input() isLoading = false;
  @Input() text?: string;
  @Input() resource: string;
  @Input() progressValue: number;
  @Input() currentTheme: ColorThemeInterface;
  @Input() file: File & { fileSize?: string };
  @Input() stats: UploadStat[] = [];

  @Output() downloadTemplate = new EventEmitter();
  @Output() handleFileInput = new EventEmitter();
  @Output() deleteFile = new EventEmitter();
  @Output() openPreviewModal = new EventEmitter();
  @Output() submit = new EventEmitter();

  currencySymbol?: string;

  constructor(private configService: ConfigurationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    let uploadSub$;
    if (changes.showSummary?.currentValue === true) {
      uploadSub$ = interval(10)
        .pipe(take(100), takeUntil(this.subs$))
        .subscribe((value) => (this.progressValue = value + 1));
    }

    if (changes.progressValue?.currentValue === 100) {
      uploadSub$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.getApplicationownerinformation();
  }

  private getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((response) => {
        this.currencySymbol = response.body?.currency?.currencySymbol;
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
