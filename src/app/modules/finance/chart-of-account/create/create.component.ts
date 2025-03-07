import { Component, OnDestroy, OnInit } from "@angular/core";
import { Validators } from "@angular/forms";
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Observable, Subject, of } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { AccountType } from "../model/account-type.enum";
import Swal from "sweetalert2";
import { UserService } from "src/app/service/user.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";

@Component({
  selector: "app-create",
  templateUrl: "./create.component.html",
  styleUrls: ["./create.component.scss"],
})
export class CreateCoAComponent implements OnInit, OnDestroy {
  accountForm: UntypedFormGroup;
  accountTypeEnum = AccountType;
  unsubscriber$ = new Subject<void>();
  loader: boolean;
  allHeaderAccounts: any[] = [];
  allAccounts: any[] = [];
  dropdownAccount: CustomDropDown[] = [];
  transactionTypeOpts: CustomDropDown[] = [
    { id: 1, text: "Debit" },
    { id: 2, text: "Credit" },
  ];

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  minRange = 0;
  maxRange = 0;
  allowReference: boolean;
  outOfRange: boolean = false;
  isEditing: boolean;
  selectedAccountToEdit: any;
  selectedAccountToEditId: number;
  isPostingAccount: boolean;

  currentTheme: ColorThemeInterface;

  selectedAccountChildReferences: any[] = [];
  SubHeaderErrorMsg: string;
  cannotCreateSubHeader: boolean;

  constructor(
    private fb: UntypedFormBuilder,
    private chartOfAccountsService: ChartOfAccountService,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;

        this.route.paramMap
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((params: ParamMap) => {
            this.selectedAccountToEditId = +params.get("id");
          });
      } else {
        this.isEditing = false;
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadTheme();
    this.getAllAccounts();

    if (this.isEditing) {
      this.getAccountToEdit(this.selectedAccountToEditId);
    }
  }
  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  initForm(): void {
    this.accountForm = this.fb.group({
      name: new UntypedFormControl(null, [Validators.required]),
      referenceLowerBoundary: new UntypedFormControl(null, [Validators.required]),
      referenceUpperBoundary: new UntypedFormControl(null, [Validators.required]),
      reference: new UntypedFormControl(null),
      parentAccountId: new UntypedFormControl(null, [Validators.required]),
      parentAccount: new UntypedFormControl(null),
      isReferenceAutoIncremented: new UntypedFormControl(true),
      isPostingAccount: new UntypedFormControl(false),
      transactionTypeOpt: new UntypedFormControl(null),
      transactionType: new UntypedFormControl(null),
    });
    this.watchFormChange();
  }

  submitForm(): void {
    this.loader = true;

    const {
      name,
      referenceLowerBoundary,
      referenceUpperBoundary,
      parentAccountId,
      reference,
      isPostingAccount,
      isReferenceAutoIncremented,
      transactionType,
    } = this.accountForm.value;

    let data = {
      name,
      referenceLowerBoundary,
      referenceUpperBoundary,
      parentAccountId,
      isPostingAccount,
      isReferenceAutoIncremented,
      transactionType,
      accountId: this.accountForm.value.accountId
    };

    if (this.isPostingAccount && this.isEditing) {
      data = {
        accountId: this.accountForm.value.accountId,
        name,
        reference,
        parentId: data.parentAccountId,
        transactionType,
      } as any;
    }
    if (!this.isEditing) delete data.accountId;

    this.sendToService$(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.toast.fire({
            type: "success",
            text: `Account has been ${this.isEditing ? "updated" : "created"}.`,
          });
          this.router.navigateByUrl("/finance/coa/all");
        },
        (err: any) => {
          this.loader = false;
        }
      );
  }

  watchFormChange(): void {
    this.accountForm
      .get("transactionTypeOpt")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.accountForm
          .get("transactionType")
          .setValue(res[0]?.text.toLowerCase());
      });

    this.accountForm
      .get("parentAccountId")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res) {
          const groupHeader = this.allAccounts.find(
            (x) => x.accountId === +res
          );
          if (groupHeader) {
            this.minRange = groupHeader.referenceLowerBoundary;
            this.maxRange = groupHeader.referenceUpperBoundary;
          } else {
            this.minRange = 0;
            this.maxRange = 0;
          }
          this.checkAccountSubHeaderCreationValidity();
        }
      });

    this.accountForm
      .get("reference")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res && (res < this.minRange || res > this.maxRange)) {
          this.outOfRange = true;
          this.accountForm.get("reference").setErrors({ outOfRange: true });
        } else {
          this.outOfRange = false;
          this.accountForm.get("reference").setErrors(null);
        }
      });

    this.accountForm
      .get("referenceLowerBoundary")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res && (res < this.minRange || res > this.maxRange)) {
          this.outOfRange = true;
          this.accountForm
            .get("referenceLowerBoundary")
            .setErrors({ outOfRange: true });
        } else {
          this.outOfRange = false;
          this.accountForm.get("referenceLowerBoundary").setErrors(null);
        }
      });

    this.accountForm
      .get("referenceUpperBoundary")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res && (res < this.minRange || res > this.maxRange)) {
          this.outOfRange = true;
          this.accountForm
            .get("referenceUpperBoundary")
            .setErrors({ outOfRange: true });
        } else {
          this.outOfRange = false;
          this.accountForm.get("referenceUpperBoundary").setErrors(null);
        }
      });
  }

  selectParent(event: any): void {
    const parentAccountId = event?.id;
    this.selectedAccountChildReferences = [];
    this.chartOfAccountsService
      .getAccountChildReferences(parentAccountId)
      .pipe(take(1))
      .subscribe((res) => {
        this.selectedAccountChildReferences = res?.body;
      });
    this.accountForm.get("parentAccountId").patchValue(parentAccountId);
    if (this.isEditing) {
      this.accountForm.get("parentId").patchValue(parentAccountId);
    }
    let account = this.allAccounts.find((x) => x.accountId === parentAccountId);
    this.accountForm
      .get("transactionType")
      .patchValue(account?.transactionType === 2 ? "credit" : "debit");

    let transactionTypeOpt = [{ id: 1, text: "debit" }];
    if (this.accountForm.get("transactionType").value === "credit") {
      transactionTypeOpt = [{ id: 2, text: "credit" }];
    }
    this.accountForm.get("transactionTypeOpt").patchValue(transactionTypeOpt);
  }
  delectParent(): void {
    this.selectedAccountChildReferences = [];
    this.accountForm.get("parentAccountId").patchValue(null);
  }

  getAllAccounts(): void {
    this.getCachedAccounts$()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: any[]) => {
        this.allAccounts = res;
        this.allHeaderAccounts = res
          .filter((x) => !x.isPostingAccount)
          .filter((y) => y.referenceLowerBoundary || y.referenceUpperBoundary);
        this.dropdownAccount = this.allHeaderAccounts.map(
          (x) =>
            <CustomDropDown>{
              id: x.accountId,
              text: x.name,
            }
        );

        if (this.isEditing && !this.selectedAccountToEdit) {
          this.getAccountToEdit(this.selectedAccountToEditId);
        }
      });
  }

  sendToService$(data: any): Observable<any> {
    if (this.isEditing) return this.chartOfAccountsService.updateAccount(data);
    return this.chartOfAccountsService.createAccount(data);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  private getAccountToEdit(id: number): void {
    this.selectedAccountToEdit = this.allAccounts.find(
      (x) => x.accountId === id
    );

    if (this.selectedAccountToEdit) {
      this.initEditForm(this.selectedAccountToEdit.accountType);
    }
  }

  protected initEditForm(type: AccountType): void {
    this.updateFormValidity();
    const data = this.selectedAccountToEdit;

    if (data.parentId) {
      const foundAccount = this.dropdownAccount.find((account) => {
        return account.id === data.parentId;
      });

      if (foundAccount) {
        this.accountForm
          .get("parentAccount")
          .setValue([{ id: foundAccount.id, text: foundAccount.text }]);
      }
    }

    this.accountForm?.get("name").patchValue(data?.name);
    this.accountForm?.addControl("accountId", new UntypedFormControl(data.accountId));
    this.accountForm?.addControl("parentId", new UntypedFormControl(data.parentId));
    this.accountForm.get("parentAccountId").patchValue(data.parentId);
    const transactionTypeValue =
      data?.transactionType === 2 ? "Credit" : "Debit";
    const transactionTypeValueArr = this.transactionTypeOpts.filter(
      (value) => value?.text === transactionTypeValue
    );

    this.accountForm
      .get("transactionType")
      .patchValue(data?.transactionType === 2 ? "credit" : "debit");
    this.accountForm
      .get("transactionTypeOpt")
      .patchValue(transactionTypeValueArr);
    if (type !== AccountType.PostingAccounts) {
      this.accountForm
        ?.get("referenceLowerBoundary")
        .patchValue(data.referenceLowerBoundary);
      this.accountForm
        ?.get("referenceUpperBoundary")
        .patchValue(data.referenceUpperBoundary);
    } else {
      this.isPostingAccount = true;
      this.accountForm?.get("reference").patchValue(data.reference);
    }
  }

  protected getCachedAccounts$(): Observable<any> {
    let cacheData;
    this.chartOfAccountsService.cachedAccounts$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        cacheData = res;
      });

    if (!cacheData) {
      return this.chartOfAccountsService.getAllAccounts();
    } else {
      return of(cacheData);
    }
  }

  protected updateFormValidity(): void {
    this.accountForm.get("referenceLowerBoundary").patchValue(null);
    this.accountForm.get("referenceUpperBoundary").patchValue(null);

    this.accountForm.get("referenceLowerBoundary").clearValidators();
    this.accountForm.get("referenceUpperBoundary").clearValidators();

    if (!this.isPostingAccount) {
      this.accountForm
        .get("referenceLowerBoundary")
        .setValidators([Validators.required]);
      this.accountForm
        .get("referenceUpperBoundary")
        .setValidators([Validators.required]);
    }

    this.accountForm.get("referenceLowerBoundary").updateValueAndValidity();
    this.accountForm.get("referenceUpperBoundary").updateValueAndValidity();
  }

  private checkAccountSubHeaderCreationValidity(): void {
    this.cannotCreateSubHeader = false;
    this.SubHeaderErrorMsg = null;
    const selectedParentId = this.accountForm.get("parentAccountId").value;
    const isPostingAccount = this.accountForm.get("isPostingAccount").value;
    const selectedParentAccount = this.allAccounts.find(
      (x) => x?.accountId === selectedParentId
    );
    if (
      isPostingAccount[0]?.text === "No" &&
      selectedParentAccount?.heirarchyLevel >= 3
    ) {
      this.cannotCreateSubHeader = true;
      this.SubHeaderErrorMsg =
        "You cannot create a non-posting account under this parent account.";
    }
  }

  setPostingAcctOpt(event: any): void {
    this.accountForm.get("isPostingAccount").patchValue(event);
    this.isPostingAccount = event;
    this.checkAccountSubHeaderCreationValidity();
    this.updateFormValidity();
  }
}
