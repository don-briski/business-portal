import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { NgbModal, NgbDateParserFormatter } from "@ng-bootstrap/ng-bootstrap";
import { map, pluck, takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import Swal from "sweetalert2";

import { UserService } from "../../../service/user.service";
import { AuthService } from "../../../service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  CustomDropDown,
  PillFilter,
  PillFilters,
} from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { AddUserRoleData } from "../models/user.type";
import { ConfigurationService } from "src/app/service/configuration.service";

declare let $: any;

@Component({
  selector: "app-users-page",
  templateUrl: "./users-page.component.html",
  styleUrls: ["./users-page.component.scss"],
})
export class UsersPageComponent implements OnInit, OnDestroy {
  @ViewChild("assignRole") assignRoleView: TemplateRef<any>;

  private unsubscriber$ = new Subject();
  public users: any[];
  public AddUserForm: UntypedFormGroup;
  validatingPw = false;
  public branchForm: UntypedFormGroup;
  public EditUserForm: UntypedFormGroup;
  public rolesForm: UntypedFormGroup;
  public teamForm: UntypedFormGroup;
  public teamEditForm: UntypedFormGroup;
  public loader = false;
  public loggedInUser: any;
  public roles = [];
  public filterNum = 10;
  public searchTerm = "";
  public defaultloader = false;
  public skipNum = 0;
  public user: any;
  public filterVariable: any;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  public totalRecords = 0;
  public totalPaginate = [];
  activeRole: CustomDropDown[] | [];
  active = "USERS";
  teams = [];
  teamList = [];
  genders: any = [
    { id: 1, text: "Male" },
    { id: 2, text: "Female" },
  ];
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    maxPage: Infinity,
    assetCode: null,
    jumpArray: [],
  };
  teamListSelection = [];
  teamListArray = [];
  teamListArrayEvent = [];
  branchList = [];
  showBranch = false;
  branchShowLoad: boolean;
  branch = [];
  editBranchForm: UntypedFormGroup;
  branchid: number;
  term: string;
  activePage = 1;
  usersFilterForm: UntypedFormGroup;
  currentTheme: ColorThemeInterface;
  isAddingUserAndRole = false;
  states: CustomDropDown[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private modalService: NgbModal,
    private ngbDateParserFormatter: NgbDateParserFormatter,
    private router: Router,
    private sharedService: SharedService,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService
  ) {}

  ngOnInit() {
    this.removePill();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.fetchUserInfo();
    this.addUserFormInit(this.loggedInUser.nameid);
    this.addTeamFormInit(this.loggedInUser.nameid);
    this.fetchAllRolesInBranch(this.loggedInUser.nameid);
    this.fetchTeamList();
    this.fetchBranchList();
    this.initUsersFilterForm();
    this.getCountries();
  }

  removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters?.action === "remove") {
          this.usersFilterForm.reset({ branchId: "", roleId: "", teamId: "" });
          selectedFilters.filters.forEach((selectedFilter) => {
            selectedFilter.forEach((filter) => {
              if (filter.type === "branch") {
                this.usersFilterForm.get("branchId").setValue(filter.id);
              }
              if (filter.type === "role") {
                this.usersFilterForm.get("roleId").setValue(filter.id);
              }
              if (filter.type === "team") {
                this.usersFilterForm.get("teamId").setValue(filter.id);
              }
            });
          });

          if (
            this.usersFilterForm.value.branchId === "" &&
            this.usersFilterForm.value.roleId === "" &&
            this.usersFilterForm.value.teamId === ""
          ) {
            this.switchView("USERS");
          } else {
            this.fetchAllUsers({ usingFilters: true });
          }
        }
      });
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchBranch() {
    this.branch = [];
    this.totalPaginate = [];
    this.defaultloader = true;
    this.userService
      .fetchBranches({
        BranchId: this.branchid,
        Search: this.searchTerm,
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
      })
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.defaultloader = false;
          this.branch = res.items;
          $(".itemPaginatedJumpModal").toggle(false);
          this._setPagination(res);
        },
        (err) => {
          this.defaultloader = false;
        }
      );
  }

  fetchBranchList() {
    this.userService
      .fetchAllBranches()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.branchList = res.body;
      });
  }

  fetchTeamList() {
    this.userService
      .FetchTeams()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.teamList = res.body;
      });
  }

  addBranch(content) {
    this.branchForm = new UntypedFormGroup({
      BranchName: new UntypedFormControl("", [Validators.required]),
      branchCode: new UntypedFormControl("", [Validators.required]),
      State: new UntypedFormControl("", [Validators.required]),
      Address: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(this.loggedInUser.nameid, [
        Validators.required,
      ]),
    });
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "sm",
    });
  }

  branchEditFormInit(content, data) {
    this.editBranchForm = new UntypedFormGroup({
      BranchName: new UntypedFormControl(data.branchName, [
        Validators.required,
      ]),
      branchCode: new UntypedFormControl(data.branchCode, [
        Validators.required,
      ]),
      State: new UntypedFormControl([{id:data.stateId,text:data.state}], [Validators.required]),
      Address: new UntypedFormControl(data.address, [Validators.required]),
      BranchId: new UntypedFormControl(data.branchId, [Validators.required]),
      UserId: new UntypedFormControl(this.loggedInUser.nameid, [
        Validators.required,
      ]),
    });
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "sm",
    });
  }

  submitEditBranchForm(val: any) {
    const state = this.editBranchForm.get("State").value;
    const payload = {
      ...this.editBranchForm.value,
      State: state[0]?.text,
      stateId: state[0]?.id,
    };
    this.loader = true;
    this.userService
      .EditBranch(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.fetchUserInfo();
          this.loader = false;
          this.closeModal();
          this.fetchBranch();
          Swal.fire({
            type: "success",
            text: "Branch was successfully edited.",
          });
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  deleteBranch(items) {
    Swal.fire({
      type: "warning",
      title: "Are you sure?",
      text: "This action is irreversible",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((result) => {
      if (result.value) {
        this.userService
          .deleteBranch({
            BranchName: items.branchName,
            BranchId: items.branchId,
            UserId: this.loggedInUser.nameid,
          })
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.fetchUserInfo();
              this.fetchBranch();
              this.fetchBranchList();
              Swal.fire({
                type: "success",
                text: "Action was successful.",
              });
            },
            (err) => {}
          );
      }
    });
  }

  selectedBranch(ev: any) {
    const branchList = this.rolesForm.get("Branch").value
      ? JSON.parse(this.rolesForm.get("Branch").value) || []
      : [];
    branchList.push({ id: ev.id, text: ev.text });
    this.rolesForm.patchValue({ Branch: JSON.stringify(branchList) });
    this.rolesForm.controls["Branch"].updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  removedBranch(ev: any) {
    const branchList = this.rolesForm.get("Branch").value
      ? JSON.parse(this.rolesForm.get("Branch").value) || []
      : [];
    const index = branchList.indexOf({ id: ev.id, text: ev.text });
    branchList.splice(index);
    if (branchList.length > 0) {
      this.rolesForm.patchValue({ Branch: JSON.stringify(branchList) });
      this.rolesForm.controls["Branch"].updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    } else {
      this.rolesForm.patchValue({ Branch: null });
      this.rolesForm.controls["Branch"].updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    }
  }

  switchView(view: string) {
    this.filterNum = 10;
    this.activePage = 1;
    this.searchTerm = "";
    this.skipNum = 0;
    this.active = view;
    this.term = "ALL";

    if (this.active === "USERS") {
      this.clearUsersFilterData();
      this.fetchAllUsers();
    } else if (this.active === "TEAMS") {
      this.fetchAllTeams();
    } else {
      this.fetchBranch();
    }
  }

  fetchUserInfo() {
    this.userService
      .getUserInfo(this.loggedInUser.nameid, { fromDb: true })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
        this.branchid = this.branchid ? this.branchid : res.branchId;
        this.term = "ALL";
        this.filterVariable = this.term == "ALL" ? "All Users" : "Branch";
        this.fetchAllUsers();
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      });
  }

  selectedRole(ev) {
    this.checkViewGlobalPermission(ev.id);
  }

  onToggleFilterModal(): void {
    $(".generate-menu").toggle();
  }

  checkViewGlobalPermission(id: number) {
    this.branchShowLoad = true;
    this.userService
      .checkViewGlobalPermission(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.branchShowLoad = false;
        if (res.body) {
          this.rolesForm.patchValue({
            RoleId: id,
            BranchShow: true,
          });
          this.rolesForm.controls["Branch"].setValidators([
            Validators.required,
          ]);
          this.rolesForm.controls["Branch"].updateValueAndValidity({
            onlySelf: true,
            emitEvent: true,
          });
        } else {
          this.rolesForm.patchValue({
            RoleId: id,
            BranchShow: false,
            BranchView: null,
            Branch: null,
          });
          this.rolesForm.controls["Branch"].clearValidators();
          this.rolesForm.controls["Branch"].updateValueAndValidity({
            onlySelf: true,
            emitEvent: true,
          });
        }
      });
  }

  rolesFormInit(content: TemplateRef<any>, user?: AddUserRoleData) {
    this.showBranch = false;
    if (user.roleId === 0) {
      this.activeRole = [];
    } else {
      this.activeRole = [{ id: user.roleId, text: user.roleName }];
    }

    user?.permissions?.forEach((key) => {
      if (key.itemName === "View Global") {
        this.showBranch = true;
        return;
      }
    });
    this.rolesForm = new UntypedFormGroup({
      RoleId: new UntypedFormControl(user?.roleId, [Validators.required]),
      UserId: new UntypedFormControl(user?.userId, [Validators.required]),
      CreatedBy: new UntypedFormControl(this.loggedInUser.nameid, [
        Validators.required,
      ]),
      BranchShow: new UntypedFormControl(this.showBranch, []),
      BranchView: new UntypedFormControl(
        user?.branchView ? JSON.parse(user?.branchView) : null,
        []
      ),
      Branch: new UntypedFormControl(user?.branchView, []),
    });

    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "sm",
    });
  }

  teamEditFormInit(content, role) {
    this.teamEditForm = new UntypedFormGroup({
      TeamName: new UntypedFormControl(role.teamName, [Validators.required]),
      UserId: new UntypedFormControl(role.createdBy, [Validators.required]),
      TeamId: new UntypedFormControl(role.teamId, [Validators.required]),
    });

    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "sm",
    });
  }

  private getCountries() {
    this.configService.spoolCountries().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      const countryIdForNigeria = res.body.find(country => country?.name?.toLowerCase() === "nigeria")?.id;
      if (countryIdForNigeria) {
        this.getStates(countryIdForNigeria)
      }
    })
  }

  private getStates(id:number) {
    this.configService
      .spoolStatesByCountry(id)
      .pipe(
        map((res) =>
          res.body.map((state) => ({ id: state.id, text: state.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (states) => {
          this.states = states;
        },
      });
  }

  SubmitBranchForm(val: any) {
    if (this.branchForm.valid) {
      const state = this.branchForm.get("State").value;
      const payload = {
        ...this.branchForm.value,
        State: state[0]?.text,
        stateId: state[0]?.id,
      };
      this.loader = true;
      this.userService
        .AddBranch(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.fetchBranch();
            this.fetchBranchList();
            this.closeModal();
            Swal.fire({
              type: "success",
              text: "New branch was successfully added.",
              showConfirmButton: true,
            });
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  deleteTeam(items) {
    Swal.fire({
      type: "warning",
      title: "Are you sure?",
      text: "This action is irreversible",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((result) => {
      if (result.value) {
        this.userService
          .deleteTeam({
            TeamName: items.teamName,
            TeamId: items.teamId,
            UserId: this.loggedInUser.nameid,
          })
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.fetchAllTeams();
              Swal.fire({
                type: "success",
                text: "Action was successful.",
              });
            },
            (err) => {}
          );
      }
    });
  }

  SubmitEditTeamForm(val: any) {
    this.loader = true;
    if (this.teamEditForm.valid) {
      this.userService
        .updateTeamName(this.teamEditForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.fetchAllTeams();
            this.loader = false;
            Swal.fire({
              type: "success",
              text: "Team successfully updated!",
            });
            this.closeModal();
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  SubmitRoleForm(val: any) {
    this.loader = true;
    this.userService
      .AssignRole(this.rolesForm.value)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.showBranch = false;
          this.fetchUserInfo();
          this.loader = false;

          if (this.isAddingUserAndRole) {
            this.closeModal();
            this.afterUserCreation();
            return;
          }
          Swal.fire({
            type: "success",
            text: "Role successfully assigned!",
          });
          this.closeModal();
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  fetchAllRolesInBranch(id) {
    this.userService
      .fetchRolesInBranch(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.roles = res.body;
        },
        (err) => {}
      );
  }

  switchBranch(id) {
    if (id === 0) {
      this.term = "ALL";
    } else {
      this.term = "";
    }
    this.filterVariable = this.term == "ALL" ? "All Users" : "Branch";
    this.branchid = id;
    this.fetchAllUsers();
  }

  fetchAllUsers(options?: { usingFilters: boolean }) {
    this.users = [];
    this.totalPaginate = [];
    this.defaultloader = true;

    let selectedFilters: PillFilters;
    let branchId: number | null;
    let branches:  PillFilter[] = [];
    let roleId: number | null;
    let roles: PillFilter[] = [];
    let teamId: number | null;
    let teams: PillFilter[] = [];
    let paramsValue: any;


    if (options?.usingFilters) {
      branchId = this.usersFilterForm.value.branchId;
      branches = this.branchList
        .filter((branch) => branch.id === branchId)
        .map((branch) => ({
          id: branch.id,
          text: branch.text,
          type: "branch",
        }));

      roleId = this.usersFilterForm.value.roleId;
      roles = this.roles
        .filter((role) => role.id === roleId)
        .map((role) => ({ id: role.id, text: role.text, type: "role" }));

      teamId = this.usersFilterForm.value.teamId;
      teams = this.teamList
        .filter((team) => team.id === teamId)
        .map((team) => ({ id: team.id, text: team.text, type: "team" }));

    paramsValue =  {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      startDate: '',
      endDate: '',
      filter: false,
      SelectedSearchColumn: branchId ? "branch" : roleId ? "role" : teamId ? "team" : null,
      keyword: branchId ? branches[0].text : roleId ? roles[0].text : teamId ? teams[0].text : null,
  }
    }

    this.userService
      .FetchAllUsers(
        {
          branchId: branchId ? branchId : this.branchid,
          roleId,
          teamId,
          Search: this.searchTerm,
          pageNumber: this.pagination.pageNumber,
          pageSize: this.pagination.pageSize,
        },
        options,
        paramsValue,
      )
      .pipe(
        pluck("body"),

        map(response => {
          return response && response.hasOwnProperty('data') ? response.data : response;
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe(
        (res) => {
          this.sharedService.selectedFilters$.next(selectedFilters);
          this.defaultloader = false;
          this.users = res.items;
          $(".itemPaginatedJumpModal").toggle(false);
          this._setPagination(res);
        },
        (err) => {
          this.defaultloader = false;
        }
      );
  }

  private _setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.maxPage = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  fetchAllTeams() {
    this.teams = [];
    this.totalPaginate = [];
    this.defaultloader = true;
    this.userService
      .FetchAllTeams({
        BranchId: this.branchid,
        Search: this.searchTerm,
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
      })
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.defaultloader = false;
          this.teams = res.items;
          $(".itemPaginatedJumpModal").toggle(false);
          this._setPagination(res);
        },
        (err) => {
          this.defaultloader = false;
        }
      );
  }

  filterUsers(ev) {
    this.filterNum = ev;
    this.active === "USERS"
      ? this.fetchAllUsers()
      : this.active === "TEAMS"
      ? this.fetchAllTeams()
      : this.fetchBranch();
  }

  SearchTable(val) {
    this.searchTerm = val;
    this.active === "USERS"
      ? this.fetchAllUsers()
      : this.active === "TEAMS"
      ? this.fetchAllTeams()
      : this.fetchBranch();
  }

  NextFetch(items: any, close?: boolean) {
    if (items !== "") {
      if (close) this.getItemsPaginatedPageJumpModal();
      this.activePage = items > 0 ? Math.ceil(items / this.filterNum) + 1 : 1;
      this.skipNum = items;
      this.active === "USERS"
        ? this.fetchAllUsers()
        : this.active === "TEAMS"
        ? this.fetchAllTeams()
        : this.fetchBranch();
    }
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  openTeamModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      size: "sm",
    });
  }

  addTeamFormInit(id) {
    this.teamForm = new UntypedFormGroup({
      TeamName: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(id, [Validators.required]),
    });
  }

  SubmitTeamForm(val: any) {
    this.loader = true;
    if (this.teamForm.valid) {
      this.userService
        .AddNewTeam(this.teamForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.addTeamFormInit(this.loggedInUser.nameid);
            this.closeModal();
            Swal.fire({
              type: "success",
              text: "Team created successfully!",
            });
            this.fetchAllTeams();
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  addUserFormInit(id) {
    this.AddUserForm = new UntypedFormGroup({
      FirstName: new UntypedFormControl("", [Validators.required]),
      LastName: new UntypedFormControl("", [Validators.required]),
      Teams: new UntypedFormControl("", [Validators.required]),
      StaffId: new UntypedFormControl("", [Validators.required]),
      MiddleName: new UntypedFormControl(""),
      EmailAddress: new UntypedFormControl("", [
        Validators.required,
        Validators.email,
      ]),
      DateOfBirth: new UntypedFormControl(""),
      Branch: new UntypedFormControl("", [Validators.required]),
      BranchId: new UntypedFormControl("", [Validators.required]),
      Dob: new UntypedFormControl(""),
      PhoneNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
      ]),
      Password: new UntypedFormControl(""),
      Photograph: new UntypedFormControl(""),
      CanSell: new UntypedFormControl(false),
      SendVerificationLink: new UntypedFormControl(true),
      gender: new UntypedFormControl("", [Validators.required]),
      Sex: new UntypedFormControl("", [Validators.required]),
      CreatedBy: new UntypedFormControl(id, [Validators.required]),
    });

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.AddUserForm.get("Branch")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.AddUserForm.get("BranchId").setValue(res[0]?.id);
      });

    this.AddUserForm.get("gender")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.AddUserForm.get("Sex").setValue(res[0]?.text);
      });
  }

  checkPwValidity() {
    this.validatingPw = true;
    this.authService
      .validatePassword(this.AddUserForm.get("Password").value)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.validatingPw = false;
          this.submitUserForm();
        },
        error: (err) => {
          this.validatingPw = false;
        },
      });
  }

  submitUserForm() {
    const userForm = this.AddUserForm.value;
    userForm["VerificationUrl"] =
      window.origin + "/business/#/account/confirm-email";
    this.loader = true;
    if (this.AddUserForm.valid) {
      this.userService
        .AddNewUser(userForm)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.closeModal();
            this.addUserFormInit(this.loggedInUser.nameid);
            if (userForm["SendVerificationLink"]) {
              this.rolesFormInit(this.assignRoleView, {
                userId: res.body?.userId,
                roleId: 0,
              });
              this.isAddingUserAndRole = true;
              return;
            }
            this.afterUserCreation();
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  afterUserCreation() {
    Swal.fire({
      type: "success",
      text: "User created successfully!",
    });
    this.fetchAllUsers();
    this.isAddingUserAndRole = false;
  }

  openEditFormInit(data: any, content: any) {
    const branch = this.branchList.filter(
      (branch) => branch.id === data.branchId
    );
    this.teamListArray = this.teamListSelection = data.teams;
    this.EditUserForm = new UntypedFormGroup({
      FirstName: new UntypedFormControl(data.person.firstName, [
        Validators.required,
      ]),
      LastName: new UntypedFormControl(data.person.lastName, [
        Validators.required,
      ]),
      MiddleName: new UntypedFormControl(data.person.middleName, []),
      Teams: new UntypedFormControl(JSON.stringify(data.teams), [
        Validators.required,
      ]),
      StaffId: new UntypedFormControl(data.person.staffId, [
        Validators.required,
      ]),
      EmailAddress: new UntypedFormControl(data.person.emailAddress, [
        Validators.required,
        Validators.email,
      ]),
      DateOfBirth: new UntypedFormControl(
        this.ngbDateParserFormatter.parse(data.person.dateOfBirth)
      ),
      PhoneNumber: new UntypedFormControl(data.person.phoneNumber, [
        Validators.required,
      ]),
      Password: new UntypedFormControl(""),
      Photograph: new UntypedFormControl("", []),
      Branch: new UntypedFormControl(branch, [Validators.required]),
      BranchId: new UntypedFormControl(data.branchId, [Validators.required]),
      gender: new UntypedFormControl(
        data.person.sex === "Male" ? [this.genders[0]] : [this.genders[1]],
        [Validators.required]
      ),
      Sex: new UntypedFormControl(data.person.sex),
      CreatedBy: new UntypedFormControl(this.loggedInUser.nameid, [
        Validators.required,
      ]),
      UserId: new UntypedFormControl(data.userId, [Validators.required]),
      CanSell: new UntypedFormControl(data.canSell, []),
      Dob: new UntypedFormControl(""),
    });

    this._watchEditUserFormChanges();

    this.openModal(content);
  }

  private _watchEditUserFormChanges(): void {
    this.EditUserForm.get("Branch")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.EditUserForm.get("BranchId").setValue(res[0]?.id);
      });

    this.EditUserForm.get("gender")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.EditUserForm.get("Sex").setValue(res[0]?.text);
      });
  }

  onFileSelect(event, type) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (type === "edit") {
        this.EditUserForm.get("Photograph").setValue(file, {
          onlySelf: true,
          emitEvent: true,
        });
        this.EditUserForm.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      } else {
        this.AddUserForm.get("Photograph").setValue(file, {
          onlySelf: true,
          emitEvent: true,
        });
        this.AddUserForm.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      }
    }
  }

  selectedTeamEvent(ev: any, selectAll?: boolean) {
    !selectAll
      ? this.teamListArrayEvent.push({ id: ev.id, text: ev.text })
      : (this.teamListArrayEvent = this.teamList);
    this.AddUserForm.controls["Teams"].setValue(
      JSON.stringify(this.teamListArrayEvent),
      { onlySelf: true, emitEvent: true }
    );
    this.AddUserForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  removedTeamEvent(ev: any, removeAll?: boolean) {
    if (removeAll) {
      this.teamListArrayEvent = [];
    }
    const index = this.teamListArrayEvent.indexOf({
      id: ev?.id,
      text: ev?.text,
    });
    this.teamListArrayEvent.splice(index, 1);
    if (this.teamListArrayEvent.length > 0) {
      this.AddUserForm.controls["Teams"].setValue(
        JSON.stringify(this.teamListArrayEvent),
        { onlySelf: true, emitEvent: true }
      );
      this.AddUserForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    } else {
      this.AddUserForm.controls["Teams"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.AddUserForm.controls["Teams"].setValidators([Validators.required]);
      this.AddUserForm.controls["Teams"].updateValueAndValidity();
    }
  }

  selectedTeam(ev: any) {
    this.teamListArray.push({ id: ev.id, text: ev.text });
    this.EditUserForm.controls["Teams"].setValue(
      JSON.stringify(this.teamListArray),
      { onlySelf: true, emitEvent: true }
    );
    this.EditUserForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  removedTeam(ev: any) {
    const index = this.teamListArray.indexOf({ id: ev.id, text: ev.text });
    this.teamListArray.splice(index, 1);
    if (this.teamListArray.length > 0) {
      this.EditUserForm.controls["Teams"].setValue(
        JSON.stringify(this.teamListArray),
        { onlySelf: true, emitEvent: true }
      );
      this.EditUserForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    } else {
      this.EditUserForm.controls["Teams"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.EditUserForm.controls["Teams"].setValidators([Validators.required]);
      this.EditUserForm.controls["Teams"].updateValueAndValidity();
    }
  }

  submitEditUserForm(val: any) {
    this.loader = true;

    const dt = this.EditUserForm.get("DateOfBirth").value;
    const myDate = this.ngbDateParserFormatter.format(dt);
    this.EditUserForm.controls["Dob"].setValue(myDate, {
      onlySelf: true,
      emitEvent: true,
    });
    this.EditUserForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    if (this.EditUserForm.valid) {
      const formValue = this.EditUserForm.value;
      formValue["DateOfBirth"] = this.EditUserForm.get("Dob").value;
      this.userService
        .UpdateUser(formValue)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.closeModal();
            Swal.fire({
              type: "success",
              text: "User info successfully updated!",
            });
            this.fetchAllUsers();
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  disableUserAccount(id, status) {
    const message =
      status === 0
        ? "Activate Account"
        : status === 1
        ? "Deactivate Account"
        : "Delete Account";
    const displayMessage =
      status === 1
        ? "This action will stop this user from being able to login and use the system."
        : status === 0
        ? "This action will restore access to the system."
        : "This action is irreversible";
    Swal.fire({
      type: "warning",
      title: message,
      text: displayMessage,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((result) => {
      if (result.value) {
        Swal.fire({
          type: "info",
          title: message,
          text: displayMessage,
          onOpen: () => {
            Swal.showLoading();
          },
        });
        this.userService
          .disableUserAccount({
            Status: status,
            UserId: this.authService.decodeToken().nameid,
            Actionable: id,
          })
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              Swal.close();
              if (this.authService.decodeToken().nameid === id) {
                sessionStorage.removeItem("token");
                this.router.navigate(["/"]);
              } else {
                this.fetchAllUsers();
                Swal.fire({
                  type: "success",
                  text: "Action was successful.",
                });
              }
            },
            (err) => {
              Swal.close();
              Swal.fire({
                type: "error",
                title: "Something went wrong",
                text: `We couldn't complete your request, please try again.`,
              });
            }
          );
      }
    });
  }

  enableUserAccount(id, status) {
    const message =
      status === 0
        ? "Activate Account"
        : status === 1
        ? "Deactivate Account"
        : "Delete Account";
    const displayMessage =
      status === 1
        ? "This action will stop this user from being able to login and use the system."
        : status === 0
        ? "This action will restore access to the system."
        : "This action is irreversible";
    Swal.fire({
      type: "warning",
      title: message,
      text: displayMessage,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((result) => {
      if (result.value) {
        Swal.fire({
          type: "info",
          title: message,
          text: displayMessage,
          onOpen: () => {
            Swal.showLoading();
          },
        });
        this.userService
          .enableUserAccount({
            Status: status,
            UserId: this.authService.decodeToken().nameid,
            Actionable: id,
          })
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              Swal.close();
              if (this.authService.decodeToken().nameid === id) {
                sessionStorage.removeItem("token");
                this.router.navigate(["/"]);
              } else {
                this.fetchAllUsers();
                Swal.fire({
                  type: "success",
                  text: "Action was successful.",
                });
              }
            },
            (err) => {
              Swal.close();
              Swal.fire({
                type: "error",
                title: "Something went wrong",
                text: `We couldn't complete your request, please try again.`,
              });
            }
          );
      }
    });
  }

  initUsersFilterForm() {
    this.usersFilterForm = new UntypedFormGroup({
      branchId: new UntypedFormControl(""),
      roleId: new UntypedFormControl(""),
      teamId: new UntypedFormControl(""),
    });
  }

  onFilterUsers() {
    this.fetchAllUsers({ usingFilters: true });
    this.onToggleFilterModal();
  }

  clearUsersFilterData() {
    this.usersFilterForm.reset();
  }

  onSelectFilter(name: string, event: CustomDropDown) {
    switch (name) {
      case "branch":
        this.usersFilterForm.get("branchId").setValue(event.id);
        break;
      case "role":
        this.usersFilterForm.get("roleId").setValue(event.id);
        break;
      case "team":
        this.usersFilterForm.get("teamId").setValue(event.id);
        break;
    }
  }

  onRemoveFilter(name: string) {
    switch (name) {
      case "branch":
        this.usersFilterForm.get("branchId").setValue("");
        break;
      case "role":
        this.usersFilterForm.get("roleId").setValue("");
        break;
      case "team":
        this.usersFilterForm.get("teamId").setValue("");
        break;
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
