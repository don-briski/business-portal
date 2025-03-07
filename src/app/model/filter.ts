import { SharedService } from "../service/shared.service";
import { CustomDropDown, PillFilter, PillFilters } from "./CustomDropdown";

export type OnFilterChangeData = {
  [key: string]: { [key: number]: CustomDropDown };
};

export class Filter {
  callback: (data?: OnFilterChangeData) => void;

  constructor(public service: SharedService) {}

  setData(data: {
    filters: CustomDropDown[][];
    filterTypes: string[];
    filterHeaders: string[];
  }) {
    const selectedFilters = [];
    data.filters.forEach((filterArray, index) => {
      const selectedFilter = filterArray.map((filter) => ({
        id: filter.id,
        text: filter.text,
        type: data.filterTypes[index],
      }));

      selectedFilters.push(selectedFilter);
    });

    this.service.selectedFilters$.next({
      filters: selectedFilters,
      action: "add",
      headers: data.filterHeaders,
    });
  }

  onChange(
    cb?: (data?: OnFilterChangeData) => void,
    pillFilters?: PillFilters
  ) {
    if (cb === null && pillFilters) {
      if (pillFilters.filters.length) {
        const obj = this.reduceToObject(pillFilters.filters);
        this.callback(obj);
      } else {
        this.callback(null);
      }
    } else {
      this.callback = cb;
    }
  }

  reduceToObject(pillFilters: PillFilter[][]): OnFilterChangeData {
    const obj = {};
    pillFilters.forEach((filterArray) => {
      filterArray.forEach((filter, index) => {
        if (obj[filter.type]) {
          obj[filter.type][index] = { id: filter.id, text: filter.text };
        } else {
          obj[filter.type] = { 0: { id: filter.id, text: filter.text } };
        }
      });
    });

    return { ...obj };
  }

  clearData() {
    this.service.selectedFilters$.next({
      filters: [],
      action: "remove",
      headers: [],
    });
  }
}
