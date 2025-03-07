import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { CreateDepositAccountModel } from "../../../models/deposit-account.model";

@Component({
  selector: "contact-details",
  templateUrl: "./contact-details.component.html",
  styleUrls: ["./contact-details.component.scss"],
})
export class ContactDetailsComponent implements OnInit {
  @Input() customerInfo: CreateDepositAccountModel;
  @Input() isLoading: boolean;
  @Output() public save: EventEmitter<CreateDepositAccountModel> =
    new EventEmitter<CreateDepositAccountModel>();

  contactForm: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      phoneNumber: new UntypedFormControl(this.customerInfo?.phoneNumber, [
        Validators.required,
      ]),
      emailAddress: new UntypedFormControl(this.customerInfo?.emailAddress, [
        Validators.required,
      ]),
    });
  }

  continue(): void {
    const data = this.contactForm.value as CreateDepositAccountModel;

    this.customerInfo.phoneNumber = data?.phoneNumber;
    this.customerInfo.emailAddress = data?.emailAddress;

    this.save.emit(this.customerInfo);
  }
}
