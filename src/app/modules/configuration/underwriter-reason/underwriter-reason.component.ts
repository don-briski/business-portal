import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { AuthService } from 'src/app/service/auth.service';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { ConfigurationService } from 'src/app/service/configuration.service';
import { UserService } from 'src/app/service/user.service';
import Swal from 'sweetalert2';
import { UnderwriterReasonInterface } from '../models/underwriter-reason.interface';

@Component({
  selector: 'app-underwriter-reason',
  templateUrl: './underwriter-reason.component.html',
  styleUrls: ['./underwriter-reason.component.scss']
})
export class UnderwriterReasonComponent implements OnInit {
  public reasonForm: UntypedFormGroup;
  public allReasons: UnderwriterReasonInterface[] = [];
  public reasonSearch = {
    pageNumber: 1,
    pageSize: 100,
    filter: ''
  }
  isEditingReason: boolean;
  editingReason: UnderwriterReasonInterface; passwordLoader: boolean;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  public user: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
    private colorThemeService: ColorThemeService
  ) { }

  ngOnInit(): void {
    this.loadTheme()
    this.fetchUser();
    this.initReasonForm();
    this.spoolReasons(this.reasonSearch);
  }

  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }


  fetchUser() {
    this.userService.getUserInfo(this.authService.decodeToken().nameid).subscribe(
      res => {
        this.user = res.body;
      },
      err => {
      },
    );
  }

  openReasonModal(modal: any) {
    this.initReasonForm();
    this.modalService.open(modal, { centered: true });
  }

  openReasonEditModal(modal: any, data: any) {
    this.isEditingReason = true;
    this.initEditReasonForm(data);
    this.modalService.open(modal, { centered: true });
  }
  initReasonForm(): void {
    this.isEditingReason = false;
    this.reasonForm = this.fb.group({
      underwriterReasonName: new UntypedFormControl('', [Validators.required]),
      underWriterReasonCode: new UntypedFormControl(''),
      underWriterReasonDescription: new UntypedFormControl(''),
      status: new UntypedFormControl('Inactive'),
      userId: new UntypedFormControl(this.authService.decodeToken().nameid, [Validators.required])
    });
  }
  initEditReasonForm(reason: UnderwriterReasonInterface): void {
    this.editingReason = reason;
    this.reasonForm.controls.underwriterReasonName.setValue(reason.underwriterReasonName);
    this.reasonForm.controls.underWriterReasonCode.setValue(reason.underWriterReasonCode);
    this.reasonForm.controls.underWriterReasonDescription.setValue(reason.underWriterReasonDescription);
    this.reasonForm.controls.status.setValue(reason.status);
  }
  saveReasonForm(): void {
    const formData = this.reasonForm.value as UnderwriterReasonInterface;
    if (!this.isEditingReason) {
      this.createReason(formData);
    } else {
      formData.underwriterReasonId = this.editingReason.underwriterReasonId;
      this.updateReason(formData);
    }

  }
  spoolReasons(model: any) {
    this.passwordLoader = true;
    this.configService.spoolUnderwriterReasons(model).subscribe((res: any) => {
      this.passwordLoader = false;
      this.allReasons = res.body.value.data;
    }, (err) => {
      this.passwordLoader = false;
      this.toast.fire({
        type: "error",
        title: err.error.message,
      });
    });
  }

  toggleReasonStatus(item: UnderwriterReasonInterface): void {
    let status;
    if (item?.status !== 'Active') {
      item.status = 'Active';
      status = 'activated';
    } else {
      item.status = 'Inactive';
      status = 'deactivated';
    };

    this.updateReason(item, `Underwriter reason has been ${status}.`);
  }

  updateReason(model: UnderwriterReasonInterface, message: string = 'Underwriter reason has been updated.'): void {
    this.passwordLoader = true;
    model.userId = this.authService.decodeToken().nameid;
    this.configService.updateUnderwriterReason(model).subscribe((res: any) => {
      this.spoolReasons(this.reasonSearch);
      this.isEditingReason = false;
      this.passwordLoader = false;
      this.modalService.dismissAll();
      this.toast.fire({
        type: 'success',
        text: message
      });
    }, (err) => {
      this.toast.fire({
        type: "error",
        title: err.error.message,
      });
      this.isEditingReason = false;
      this.passwordLoader = false;
    });
  }
  createReason(model: UnderwriterReasonInterface): void {
    this.passwordLoader = true;
    model.userId = this.authService.decodeToken().nameid;
    this.configService.createUnderwriterReason(model).subscribe((res: any) => {
      this.spoolReasons(this.reasonSearch);
      this.passwordLoader = false;
      this.modalService.dismissAll();
      this.toast.fire({
        type: 'success',
        text: 'Underwriter reason has been created.'
      });
    }, (err) => {
      this.toast.fire({
        type: "error",
        title: err.error.message,
      });
      this.passwordLoader = false;
    });
  }

}
