import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserIdleService } from "angular-user-idle";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import Swal from "sweetalert2";

import { RealtimeService } from "src/app/service/realtime.service";
import { AuthService } from "src/app/service/auth.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { AuthData, SharedService } from "src/app/service/shared.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-token-session",
  templateUrl: "./token-session.component.html",
  styleUrls: ["./token-session.component.scss"],
})
export class TokenSessionComponent implements OnInit, OnDestroy {
  password: string;
  error: string;
  submitOp: boolean;
  name: string;
  user: any;
  currentuserid: any;
  appOwnerKey: string;
  appOwnerPublicKey: string;

  private unsubscriber$ = new Subject();
  showOtpRetry = false;
  enterOTP = false;
  otp:string;
  userId:number;
  userType:string;
   authData: AuthData | null = null

  constructor(
    private userIdle: UserIdleService,
    private authService: AuthService,
    private router: Router,
    public dialogbox: MatDialog,
    private realtimeService: RealtimeService,
    private sharedService: SharedService,
    private modalservice: NgbModal
  ) {
    this.appOwnerKey = sessionStorage.getItem("appOwnerKey");
    this.appOwnerPublicKey = sessionStorage.getItem("appOwnerPublicKey");
  }

  ngOnInit() {
    this.authData =  this.sharedService.getAuthData()
    this.user = sessionStorage.getItem("auth")
      ? JSON.parse(sessionStorage.getItem("auth"))
      : null;
    this.name = this.authData?.actort.split(" ")[0];
    this.currentuserid = this.authService.decodeToken().nameid;

    //check if appowner is null, redirect to login
    if (this.appOwnerPublicKey == null || this.appOwnerPublicKey === "null") {
      this.logOut();
    }
  }

  submit(){
    if (this.enterOTP && this.otp.length === 6) {
      this.submitOtp()
    } else if(this.password) {
      this.login();
    }
  }

  login() {
    if (this.password) {
      this.submitOp = true;
      this.userIdle.stopWatching();
      this.authService
        .userLogin({
          EmailAddress: this.authData.email,
          Password: this.password,
          AppOwnerKey: this.appOwnerKey,
          Initiator: "Staff",
        })
        .subscribe(
          (res) => {
            const auth = res.headers.get("Set-Auth");
            if (!auth) {
              this.userId = res.body.userId;
              this.userType = res.body?.type;
              this.requestOtp();
            } else {
              this.enterOTP = false;
              this.authSuccess();
            }
            this.submitOp = false;
          },
          (error: any) => {
            this.submitOp = false;
            this.error = error.error;
          }
        );
    } else {
      this.error = "Provide your password.";
    }
  }

  requestOtp(){
    this.enterOTP = true;
    this.showOtpRetry = false;
    const model = {
      userId: this.userId
    };
    this.authService
      .requestLoginOTP(model)
      .pipe(takeUntil(this.unsubscriber$)).subscribe({
          next:() => this.showOtpRetry = true,
          error:() => this.showOtpRetry = false
      })
  }

  logOut() {
    Swal.fire({
      allowOutsideClick: false,
      showConfirmButton: false,
      imageUrl: "assets/images/password.png",
      imageWidth: 60,
      html: '<p><i class="icon icon-spin icon-spin2"></i>  We are logging you out...</p>',
    });
    this.authService.logout(this.currentuserid).subscribe(
      (res) => {
        this.realtimeService.cancelConnection();
        //   sessionStorage.removeItem('token');
        sessionStorage.removeItem("auth");
        this.router.navigateByUrl("/account/login/" + this.appOwnerPublicKey);
        sessionStorage.clear();
        sessionStorage.setItem("appOwnerPublicKey", this.appOwnerKey);
        this.dialogbox.closeAll();
        Swal.close();
        this.modalservice.dismissAll();
      },
      (err) => {
        Swal.close();
      }
    );
  }

  submitOtp(): void {
    const model = {
      otpCode: this.otp,
      userId: this.userId,
    };

    this.authService
      .confirmOTPActivation(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res)=>{
        this.authService.setToken(res, this.userType);
        this.authSuccess();
        window.location.reload();
      },
      (error: any) => {
        this.error = error.error.message;
      }
      );
  }

  authSuccess(){
    this.userIdle.startWatching();
    // Swal
    Swal.fire({
      title: "Success",
      type: "success",
      timer: 1500,
    });
    const destinationUrl = sessionStorage.getItem("dest");
    this.dialogbox.closeAll();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
