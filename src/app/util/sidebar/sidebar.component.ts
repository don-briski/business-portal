import { Component, OnInit, AfterViewInit } from "@angular/core";
import * as $ from "jquery";
import { AuthService } from "src/app/service/auth.service";
import { Router } from "@angular/router";
import { UserService } from "src/app/service/user.service";
import { RealtimeService } from "src/app/service/realtime.service";
import swal from "sweetalert2";
@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  public name: string;
  public user: any;
  public userid: any;
  public root = "https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/";
  metricsdata: any;
  public loggedInUser: any;
  currentuserbranchid: any;
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private realtimeService: RealtimeService
  ) {}

  ngOnInit() {
    this.loggedInUser = this.authService.decodeToken();
    //  this.realTimeListener();
    this.name = this.authService.decodeToken().actort;
    this.currentuserbranchid = this.authService.decodeToken().groupsid;
    this.userid = this.authService.decodeToken().nameid;
  }

  ngAfterViewInit() {
    this.fetchUser();
  }

  fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
          $(document).ready(() => {
            $.getScript("assets/js/script.js");
          });
        },
        (err) => {}
      );
  }

  logOut() {
    this.authService.logout(this.userid).subscribe(
      (res) => {
        this.realtimeService.cancelConnection();
        //   sessionStorage.removeItem('token');
        sessionStorage.removeItem("auth");
        this.router.navigate(["/"]);
      },
      (err) => {
        swal.fire({ type: "error", title: "Error", text: err.error });
      }
    );
  }
}
