import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";

@Component({
  selector: "app-edit-credit-note",
  templateUrl: "./edit-credit-note.component.html",
  styleUrls: ["./edit-credit-note.component.scss"],
})
export class EditCreditNoteComponent implements OnInit {
  subs$ = new Subject<void>();
  user: any;
  colorTheme: ColorThemeInterface;

  constructor(
    private colorThemeServ: ColorThemeService,
    private userServ: UserService,
    private authServ: AuthService
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.loadTheme();
  }

  private getUser(): void {
    this.userServ
      .getUserInfo(this.authServ.decodeToken().nameid)
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
