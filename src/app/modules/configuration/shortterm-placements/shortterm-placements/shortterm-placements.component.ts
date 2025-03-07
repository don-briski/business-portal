import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AccordionItem, User } from "src/app/modules/shared/shared.types";
import { PlacementType } from "src/app/modules/treasury/types/placement-type";
import { ShortTermPlacementType } from "src/app/modules/treasury/types/short-term-placement";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";
import { UserService } from "src/app/service/user.service";
import { lightenColor } from "../../../shared/helpers/generic.helpers";

@Component({
  selector: "shortterm-placements-types",
  templateUrl: "./shortterm-placements.component.html",
  styleUrls: ["./shortterm-placements.component.scss"],
})
export class ShorttermPlacementsTypesComponent implements OnInit, OnDestroy {
  ownerInformation: any;
  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private _colorThemeService: ColorThemeService,
    private _shorttermPlacementTypeService: ShortTermPlacementService,
    private configService: ConfigurationService
  ) {}
  private _unsubscriber$ = new Subject();
  currentTheme: ColorThemeInterface;
  user: User;
  isLoading: boolean = false;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    maxPage: Infinity,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  shortTermPlacementsTypes: ShortTermPlacementType[] = [];
  shortTermPlacementTypeId: number;
  accordionItems: AccordionItem;
  placementType: PlacementType;

  ngOnInit(): void {
    this._fetchUserInfo();
    this._loadTheme();
    this.getShortTermPlacementsTypes();
    this.getApplicationownerinformation();
  }

  private _fetchUserInfo() {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  getShortTermPlacementsTypes(search?: string): void {
    this.isLoading = true;
    let data: any = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (search) {
      data.search = search;
    }

    this._shorttermPlacementTypeService
      .getShortTermPlacementTypes(data)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.shortTermPlacementsTypes = res.items;
        this._setPagination(res);
        this.isLoading = false;
        $(".itemPaginatedJumpModal").toggle(false);
      });
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

  private _loadTheme() {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  lightenColor(color: string) {
    return lightenColor(color, 170);
  }

  viewShortTermPlacementType(
    placementType: PlacementType,
    element?: HTMLElement
  ) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show") {
        this.placementType = placementType;

        this.accordionItems = {
          placementDetails: [
            {
              title: "Placement Name",
              value: placementType.placementName,
              tooltip: "The name used to identify this placement type.",
            },
            {
              title: "Placement Type",
              value: placementType.placementType,
              tooltip: "The type of this placement.",
            },
            {
              title: "Placement Code",
              value: placementType.placementCode,
            },
            {
              title: "Financial Institution",
              value: placementType.financialInstitution,
            },
          ],
          parameters: [
            {
              title: "Minimum Amount",
              value: placementType.minAmount,
              tooltip: "Minimum amount for this placement type.",
              type: "currency",
            },
            {
              title: "Maximum Amount",
              value: placementType.maxAmount,
              tooltip: "Maximum amount for this placement type.",
              type: "currency",
            },
            {
              title: "Interest Rate Type",
              value:
                placementType.interestType === "Flat" ? ["Flat"] : ["Compound"],
              type: "list",
              tooltip: "How interests are accrued.",
            },
            {
              title: "Minimum Interest Rate",
              value: placementType.minInterestRate,
              tooltip:
                "Minimum interest rate that can be applied when creating investment accounts for this short term placement type.",
              type: "percentage",
            },
            {
              title: "Maximum Interest Rate",
              value: placementType.maxInterestRate,
              tooltip:
                "Maximum interest rate that can be applied when creating investment accounts for this short term placement type.",
              type: "percentage",
            },
            {
              title: "Tenor Type",
              value: [placementType.tenorType],
              type: "list",
            },
            {
              title: "Minimum Tenor",
              value: placementType.minTenor,
              type: "number",
            },
            {
              title: "Maximum Tenor",
              value: placementType.maxTenor,
              type: "number",
            },
          ],
          fees: [
            {
              title: "Witholding Tax",
              value: placementType.whtRate,
              tooltip: "Amount to be deducted from the interest.",
              type: "percentage",
            },
            {
              title: "Penal Charge",
              value: placementType.penalCharge,
              tooltip:
                "The charge that's applied when investments are liquidated before their maturity date.",
              type: "percentage",
            },
          ],
        };
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
