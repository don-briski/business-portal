import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";

@Component({
  selector: "lnd-import-modal",
  templateUrl: "./import-modal.component.html",
  styleUrls: ["./import-modal.component.scss"],
})
export class ImportModalComponent {
  @Input() title: string;
  @Input() currentTheme: ColorThemeInterface;
  @Input() downloading: boolean;

  @Output() closeModal = new EventEmitter();
  @Output() downloadTemplate = new EventEmitter();
  @Output() selectedFile = new EventEmitter();

  constructor() {}

  initiateDownloadProcess(){
    this.downloading = true;
    this.downloadTemplate.emit();

    setTimeout(() => {
      this.downloading = false;
    }, 1000);
  }
}
