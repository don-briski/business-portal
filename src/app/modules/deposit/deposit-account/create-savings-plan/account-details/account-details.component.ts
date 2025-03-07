import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { DepositService } from "src/app/service/deposit.service";
import { DepositAccountService } from "src/app/service/depositaccount.service";
import { CreateDepositAccountModel } from "../../../models/deposit-account.model";
import { DepositProduct } from "../../../models/deposit-product.model";
import { GetRequestInterface } from "../../../models/get-request.interface";

@Component({
  selector: "account-details",
  templateUrl: "./account-details.component.html",
  styleUrls: ["./account-details.component.scss"],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  @Input() customerInfo: CreateDepositAccountModel;
  @Output() public nextStep: EventEmitter<void>;
  @Output() public data: EventEmitter<CreateDepositAccountModel> =
    new EventEmitter<CreateDepositAccountModel>();

  public accountForm: UntypedFormGroup;
  depositAccount: CreateDepositAccountModel;
  depositProducts: DepositProduct[] = [];

  depositProductOptions: DepositProduct[] = [];

  public unsubscriber$ = new Subject<void>();
  constructor(
    private fb: UntypedFormBuilder,
    private depositService: DepositAccountService,
    private depositProductService: DepositService
  ) {
    this.nextStep = new EventEmitter<void>();
  }

  ngOnInit(): void {
    this.depositAccount = {} as CreateDepositAccountModel;
    this.depositAccount.dateOfBirth = this.customerInfo?.dateOfBirth;
    this.depositAccount.phoneNumber = this.customerInfo?.phoneNumber;
    this.depositAccount.personId = this.customerInfo?.personId;
    this.depositAccount.emailAddress = this.customerInfo?.emailAddress;
    this.depositAccount.firstName = this.customerInfo?.firstName;
    this.depositAccount.lastName = this.customerInfo?.lastName;

    this.initForm();
    this.getDepositProducts();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  getDepositProducts(): void {
    const req: GetRequestInterface = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.depositProductService
      .getAllDepositProduct(req)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.depositProducts = res?.data.items.filter(
          (x) => x.depositProductType === "Savings Plan"
        );
      });
  }

  public goToNextStep(): void {
    const data = this.accountForm.value as CreateDepositAccountModel;

    this.depositAccount.depositProductId = data?.depositProductId;
    this.depositAccount.depositAmount = data?.depositAmount;
    this.depositAccount.startDate = data?.startDate;
    this.depositAccount.termLength = data?.termLength;
    this.depositAccount.depositSource = data?.depositSource;
    this.depositAccount.debitFrequency = data?.debitFrequency;
    this.depositAccount.description = data?.description;

    this.data.emit(this.depositAccount);
    this.nextStep.emit();
  }

  private initForm(): void {
    this.accountForm = this.fb.group({
      category: new UntypedFormControl(null, [Validators.required]),
      depositProductId: new UntypedFormControl(null, [Validators.required]),
      depositAmount: new UntypedFormControl(null, [Validators.required]),
      startDate: new UntypedFormControl(null, [Validators.required]),
      termLength: new UntypedFormControl(null, [Validators.required]),
      depositSource: new UntypedFormControl(null, [Validators.required]),
      debitFrequency: new UntypedFormControl(null, [Validators.required]),
      description: new UntypedFormControl(null, [Validators.required]),
    });
    this.watchCategoryChange();
  }

  private watchCategoryChange(): void {
    this.accountForm
      .get("category")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const products: DepositProduct[] = JSON.parse(
          JSON.stringify(this.depositProducts)
        );
        this.depositProductOptions = products.filter(
          (x) => x.depositProductCategory === res
        );
        this.accountForm.get("depositProductId").patchValue(null);
      });
  }
}
