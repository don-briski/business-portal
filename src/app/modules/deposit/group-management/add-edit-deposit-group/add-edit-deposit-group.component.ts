import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  filter,
  pluck,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
} from "rxjs/operators";
import { fromEvent, Subject } from "rxjs";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { FinanceService } from "src/app/modules/finance/service/finance.service";
import { DepositService } from "src/app/service/deposit.service";
import { GroupRole } from "src/app/model/grouprole.interface";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-add-edit-deposit-group",
  templateUrl: "./add-edit-deposit-group.component.html",
  styleUrls: ["./add-edit-deposit-group.component.scss"],
})
export class AddEditDepositGroupComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private unsubscriber$ = new Subject();
  @ViewChild("members") members: ElementRef;
  isEditing: boolean = false;
  isLoading: boolean = false;
  currentTheme: ColorThemeInterface;
  groupForm: UntypedFormGroup;
  selectedGroupMembers: CustomDropDown[] = [];
  customers: CustomDropDown[] = [];
  groupRoles: CustomDropDown[] = [];
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  groupId: number;

  constructor(
    private colorThemeService: ColorThemeService,
    private fb: UntypedFormBuilder,
    private financeService: FinanceService,
    private depositService: DepositService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;
        this.groupId = +this.route.snapshot.params["id"];
      } else {
        this.isEditing = false;
      }
    });
  }

  ngOnInit(): void {
    this.financeService
      .getCustomersLimitedView({
        searchTerm: "",
      })
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((customers) => (this.customers = customers));
    this.loadTheme();
    this.getGroupRoles();
    this.initForm();

    this.isEditing ? this.getGroup() : null;
  }

  ngAfterViewInit(): void {
    fromEvent(this.members.nativeElement, "keyup")
      .pipe(
        pluck("target", "value"),
        filter((searchValue: string) => searchValue.length > 2),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          return this.financeService.getCustomersLimitedView({
            searchTerm,
          });
        }),
        pluck("body")
      )
      .subscribe((customers) => {
        this.customers = customers;
      });
  }

  private getGroupRoles(): void {
    this.depositService
      .getGroupRoles()
      .pipe(
        pluck("data", "items"),
        map((groupRoles: GroupRole[]) => {
          return groupRoles.map((groupRole: GroupRole) => ({
            id: groupRole.groupRoleId,
            text: groupRole.groupRoleName,
          }));
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe(
        (groupRoles: CustomDropDown[]) => (this.groupRoles = groupRoles)
      );
  }

  private getGroup(): void {
    this.isLoading = true;
    this.depositService
      .getGroup(this.groupId)
      .pipe(pluck("data"), takeUntil(this.unsubscriber$))
      .subscribe((group) => {
        this.patchForm(group);
        this.isLoading = false;
      });
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  memberRoles(): UntypedFormArray {
    return this.groupForm.get("memberRoles") as UntypedFormArray;
  }

  private initForm(): void {
    this.groupForm = this.fb.group({
      groupName: new UntypedFormControl(null, Validators.required),
      groupMembers: new UntypedFormControl([]),
      members: new UntypedFormControl([]),
      memberRoles: this.fb.array([]),
    });

    this.watchFormChanges();
  }

  private patchForm(group): void {
    let memberIds: number[] = [];
    let members: CustomDropDown[] = [];

    group.memberRoles.forEach((memberRole) => {
      memberIds.push(memberRole.personId);
      members.push({ id: memberRole.personId, text: memberRole.personName });

      const member = {
        person: { id: memberRole.personId, text: memberRole.personName },
        personId: memberRole.personId,
        groupRole: memberRole.roles.map((role) => ({
          id: role.roleId,
          text: role.roleName,
        })),
      };

      this.addMemberRole(member);
    });

    this.groupForm.patchValue({
      groupName: group.groupName,
      groupMembers: members,
      members: memberIds,
    });

    this.groupForm.addControl("groupId", new UntypedFormControl(group.groupId));
  }

  private watchFormChanges(): void {
    this.groupForm
      .get("groupMembers")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((members: CustomDropDown[]) => {
        const groupMembers: number[] = [];
        members.forEach((member) => {
          if (!groupMembers.includes(+member.id)) {
            groupMembers.push(+member?.id);
          }
        });
        this.groupForm.get("members").setValue(groupMembers, {
          emitEvent: false,
        });

        this.selectedGroupMembers = this.groupForm.get("groupMembers").value;
      });

    this.groupForm
      .get("memberRoles")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((memberRoles) => {
        this.selectedGroupMembers = this.groupForm.get("groupMembers").value;

        memberRoles.forEach((memberRole, index) => {
          if (memberRole?.groupRoles?.length > 0) {
            let roleIds: number[] = [];
            roleIds = memberRole.groupRoles.map((role) => role?.id);
            this.memberRoles()
              .at(index)
              .get("roles")
              .setValue(roleIds, { emitEvent: false });
          }

          if (memberRole?.person?.length > 0) {
            this.memberRoles()
              .at(index)
              .get("personId")
              .setValue(memberRole?.person[0]?.id, { emitEvent: false });

            this.selectedGroupMembers = this.selectedGroupMembers.filter(
              (groupMember) => groupMember.id !== memberRole?.person[0]?.id
            );
          } else {
            const person = this.selectedGroupMembers.find(
              (member) =>
                member.id === this.memberRoles().at(index).value.personId
            );
            const memberIndex = this.selectedGroupMembers.findIndex(
              (value) => value.id === person.id
            );
            if (memberIndex === -1) {
              this.selectedGroupMembers.push(person);
            }
          }
        });
      });
  }

  addMemberRole(member?): void {
    const memberRole = this.fb.group({
      person: new UntypedFormControl([member?.person] || null, Validators.required),
      personId: new UntypedFormControl(member?.personId || null, Validators.required),
      groupRoles: new UntypedFormControl(
        member?.groupRole || null,
        Validators.required
      ),
      roles: new UntypedFormControl(null, Validators.required),
    });

    this.memberRoles().push(memberRole);
  }

  removeRole(index: number): void {
    const groupMember = this.memberRoles().at(index).get("person").value[0];
    const groupMemberIndex = this.selectedGroupMembers.findIndex(
      (value) => value.id === groupMember?.id
    );
    if (
      this.memberRoles().at(index).get("person").value &&
      groupMemberIndex === -1
    ) {
      this.selectedGroupMembers.push({
        id: groupMember?.id,
        text: groupMember?.text,
      });
    }
    this.memberRoles().removeAt(index);
  }

  private cleanUp(): void {
    this.groupForm.removeControl("groupMembers");
    this.memberRoles().controls.forEach((control: UntypedFormGroup) => {
      control.removeControl("person");
      control.removeControl("groupRoles");
    });
  }

  submit(): void {
    this.cleanUp();
    this.isLoading = true;

    if (!this.isEditing) {
      this.depositService
        .createGroup(this.groupForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Group Created successfully",
            });
            this.isLoading = false;
            this.router.navigate(["deposits/groups"]);
          },
          (error) => (this.isLoading = false)
        );
    } else {
      this.depositService
        .updateGroup(this.groupForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Group Updated successfully",
            });
            this.isLoading = false;
            this.router.navigate(["deposits/groups"]);
          },
          (error) => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
