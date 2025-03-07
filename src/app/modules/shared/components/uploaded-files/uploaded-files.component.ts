import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-uploaded-files",
  templateUrl: "./uploaded-files.component.html",
  styleUrls: ["./uploaded-files.component.scss"],
})
export class UploadedFilesComponent {
  @Input() files: any[] = [];

  truncateLongName(longName: string): string {
    longName = longName.split("/")[longName.split("/").length - 1];
    if (longName?.length > 15) {
      let trnc =
        longName.substring(0, 15).concat("...") +
        longName.substring(longName?.length - 10, longName?.length);
      return trnc;
    }
    return longName;
  }
}
