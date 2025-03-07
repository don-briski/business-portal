import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../service/user.service';
import { AuthService } from '../../../service/auth.service';
import { UntypedFormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ConfigurationService } from '../../../service/configuration.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { ShortTermPlacementService } from 'src/app/service/shorttermplacement.service';
import { FinancialInstitutionService } from 'src/app/service/financialinstitution.service';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-short-term-placement',
    templateUrl: './short-term-placement.component.html',
    styleUrls: ['./short-term-placement.component.scss']
})
export class ShortTermPlacementComponent implements OnInit {
    public user: any;
    public ShortTermPlacementForm: UntypedFormGroup;
    public shortTermPlacements: [];
    public selectedShortTermPlacementId = null;
    public edit = false;
    totalRecords = 0;
    filterNum = 10;
    totalPaginate = [];
    activePage = 1;
    public searchTerm = '';
    public numTerm = 10;
    public skip = 0;

    tabLoader = false;
    @Input() investmentDetails: any;
    @Input() bvn: number;
    @Input() amount: number;
    @Output() investmentCreated = new EventEmitter<any>();
    @ViewChild('activateShortTermPlacement') activateTemplateRef: any;
    @ViewChild('updateShortTermPlacementApproval') updateTemplateRef: any;
    @ViewChild('viewShortTermPlacement') viewTemplateRef: any;
    @ViewChild('liquidateShortTermPlacement') liquidateTemplateRef: any;
    @ViewChild('addShortTermPlacement') addTemplateRef: any;

    StartDateNotification = '';
    loggedInUser: any;
    currencySymbol: string;

    currentTheme: ColorThemeInterface;
    unsubscriber$ = new Subject<void>();
    constructor(
        private modalService: NgbModal,
        private userService: UserService,
        private authService: AuthService,
        private stpService: ShortTermPlacementService,
        private finService: FinancialInstitutionService,
        private tokenRefreshError: TokenRefreshErrorHandler,
        private router: Router,
        private colorThemeService: ColorThemeService,
        private configService: ConfigurationService,
    ) { }

    ngOnInit() {
        this.getCurrencySymbol();
        this.loadTheme();
        this.loggedInUser = this.authService.decodeToken();
        if (!this.loggedInUser || this.loggedInUser.nameid == null) {
            this.router.navigateByUrl('/account/login');
            Swal.fire('Error', 'Please log in', 'error');
        }
        this.tokenRefreshError.tokenNeedsRefresh.subscribe(
            (res) => {
                if (!res) {
                    // this.httpFailureError = true;
                }
            }
        );

        this.fetchUserInfo();
        this.fetchShortTermPlacements();
    }

    getCurrencySymbol() {
        this.currencySymbol = this.configService.currencySymbol;
        if (!this.currencySymbol) {
            this.configService
              .getCurrencySymbol()
              .pipe(takeUntil(this.unsubscriber$))
              .subscribe({
                next: (res) => {
                  this.currencySymbol = res.body.currencySymbol;
                },
              });
          }
    }

    private loadTheme() {
        this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
            this.currentTheme = res;
        });
    }

    fetchUserInfo() {
        this.userService.getUserInfo(this.authService.decodeToken().nameid).subscribe(
            response => {
                this.user = response.body;
            },
            err => {
            },
        );
    }

    fetchShortTermPlacements() {
        this.tabLoader = true;
        this.shortTermPlacements = [];
        this.stpService.fetchShortTermPlacements({ Search: this.searchTerm, Num: this.filterNum, Skip: this.skip }).subscribe(res => {
            this.tabLoader = false;
            this.shortTermPlacements = res.body.data;
            this.totalRecords = res.body.count;
            const check1 = Math.ceil(this.totalRecords / this.filterNum);
            for (let index = 0; index < check1; index++) {
                this.totalPaginate.push(this.filterNum * index);
            }
        }, err => {

        });
    }

    loadAdd() {
        this.edit = false;
        this.openModal(this.addTemplateRef);
    }

    loadEdit(shortTermPlacementId) {
        this.selectedShortTermPlacementId = shortTermPlacementId;
        this.edit = true;
        this.openModal(this.addTemplateRef);
    }

    loadApproval(shortTermPlacementId) {
        this.selectedShortTermPlacementId = shortTermPlacementId;
        this.openModal(this.updateTemplateRef);
    }

    loadView(shortTermPlacementId) {
        this.selectedShortTermPlacementId = shortTermPlacementId;
        this.openModal(this.viewTemplateRef);
    }

    loadActivation(shortTermPlacementId) {
        this.selectedShortTermPlacementId = shortTermPlacementId;
        this.openModal(this.activateTemplateRef);
    }

    loadLiquidation(shortTermPlacementId) {
        this.selectedShortTermPlacementId = shortTermPlacementId;
        this.openModal(this.liquidateTemplateRef);
    }

    openModal(content) {
        this.modalService.open(content, { backdrop: 'static', size: 'lg', centered: true });
    }

    closeModal() {
        this.modalService.dismissAll();
    }

    filterStp(ev) {
        this.filterNum = ev;
        this.fetchShortTermPlacements();
        // if (this.defaultTab === 'created') {
        //   this.fetchShortTermPlacements();
        // }
        //  else if (this.defaultTab === 'request') {
        //   this.fetchLiquidationLog();
        // } else {
        //   this.fetchApprovedInvestments();
        // }
    }

    SearchTable(val) {
        this.searchTerm = val;
        this.fetchShortTermPlacements();
        // if (this.defaultTab === 'created') {
        //   this.fetchShortTermPlacements();
        // }
        //  else if (this.defaultTab === 'request') {
        //   this.fetchLiquidationLog();
        // } else {
        //   this.fetchApprovedInvestments();
        // }
    }

    NextFetch(items) {
        if (items !== '') {
            this.getItemsPaginatedPageJumpModal();
            // this.activePage = items + 1;
            this.activePage = (items > 0) ? Math.ceil(this.totalRecords / items) : 1;
            this.skip = items;
            this.fetchShortTermPlacements();
            //   if (this.defaultTab === 'created') {
            //     this.fetchShortTermPlacements();
            //   }

            //   else if (this.defaultTab === 'request') {
            //     this.fetchLiquidationLog();
            //   } else {
            //     this.fetchApprovedInvestments();
            //   }
        }
    }


    getItemsPaginatedPageJumpModal() {
        $('.pagination-menu').toggle();
    }

    filterInvestment(ev) {
        this.filterNum = ev;
        this.fetchShortTermPlacements();
        // if (this.defaultTab === 'created') {
        //   this.fetchShortTermPlacements();
        // }
        //  else if (this.defaultTab === 'request') {
        //   this.fetchLiquidationLog();
        // } else {
        //   this.fetchApprovedInvestments();
        // }
    }

}
