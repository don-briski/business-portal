import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  AfterViewInit,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from "@angular/core";

@Component({
  selector: "lnd-switch",
  templateUrl: "./switch.component.html",
  styleUrls: ["./switch.component.scss"],
})
export class SwitchComponent implements OnChanges,AfterViewInit {
  @ViewChild("switchRef", { static: false }) switchRef: ElementRef;
  @Input() text?: string;
  @Input() disabled = false;
  @Input() value?: boolean;
  @Input() textColor = "#000";
  @Output() emittedValue = new EventEmitter<boolean>();

  ngOnChanges(changes: SimpleChanges): void {
      if (this.switchRef) {
        this.switchRef.nativeElement.checked = this.value;
      }
  }

  ngAfterViewInit(): void {
    this.switchRef.nativeElement.checked = this.value;
    this.switchRef.nativeElement.disabled = this.disabled;
  }

  checkValue(event: any): void {
    this.emittedValue.emit(event.target.checked);
  }
}
