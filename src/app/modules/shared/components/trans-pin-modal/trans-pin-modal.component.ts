import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  UntypedFormBuilder,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Comment } from "src/app/model/comment";

@Component({
  selector: "lnd-trans-pin-modal",
  templateUrl: "./trans-pin-modal.component.html",
  styleUrls: ["./trans-pin-modal.component.scss"],
})
export class TransPinModalComponent implements OnInit {
  @Input() comments: Comment[];
  @Input() feature: string;
  @Input() btnValue: string = "Post";
  @Input() canApprove: boolean;
  @Input() isLoading: boolean;
  @Output() sendPayload = new EventEmitter();
  approvalStatus: string;
  approvalForm: UntypedFormGroup;

  constructor(private modalService: NgbModal, private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.approvalForm = this.fb.group({
      transactionPin: new UntypedFormControl("", [Validators.required]),
      comment: new UntypedFormControl(null),
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  submit(status: string): void {
    if (this.feature) {
      this.approvalStatus = status;
    }
    this.approvalForm.addControl("status", new UntypedFormControl(status));
    this.sendPayload.emit(this.approvalForm.value);

    if (!this.feature) {
      this.closeModal();
    }
  }
}
