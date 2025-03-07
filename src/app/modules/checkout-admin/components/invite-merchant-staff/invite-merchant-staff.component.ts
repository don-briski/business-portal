import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CheckoutAdminService } from "../../checkout-admin.service";

@Component({
  selector: "lnd-invite-merchant-staff",
  templateUrl: "./invite-merchant-staff.component.html",
  styleUrls: ["./invite-merchant-staff.component.scss"],
})
export class InviteMerchantStaffComponent implements OnInit, OnDestroy {
  @Input() merchantData: {
    merchantId: number;
    merchantName: string;
  };

  unsubscriber$ = new Subject<void>();
  theme: ColorThemeInterface;

  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
  });
  loading = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private readonly modalService: NgbModal,
    private readonly fb: FormBuilder,
    private readonly themeService: ColorThemeService,
    private readonly checkoutAdminService: CheckoutAdminService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  loadTheme(): void {
    this.themeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.theme = theme;
      });
  }

  onSubmit() {
    this.loading = true;
    const urlProtocol = window.location.host;
    const url = `https://${urlProtocol}/bnpl/#/merchant/portal/auth/signup`;

    this.checkoutAdminService
      .inviteMerchantStaff({
        emailAddress: this.form.value.email,
        loginURL: url,
        ...this.merchantData,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.fire({
            type: "success",
            title: "Invite sent successfully!",
          });

          this.onClose();
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onClose() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
