import { Component, Input, OnInit } from "@angular/core";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-decide",
  templateUrl: "./decide.component.html",
  styleUrls: ["./decide.component.scss"],
})
export class DecideComponent implements OnInit {
  @Input() decideInfo;
  @Input() loanInfo;
  @Input() currentTheme;
  selectedTab: string = "BA";
  ownerInformation: any;
  constructor(
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getApplicationownerinformation();
  }

  switchTabs(tab: string): void {
    this.selectedTab = tab;
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      });
  }
}
