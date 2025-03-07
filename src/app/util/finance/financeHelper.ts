import * as moment from "moment";
import { TabState } from "src/app/modules/finance/types/TabState";

export const toFormData = (
  data: any,
  filePropNames: string[] = [],
  customPropNames: string[] = []
): FormData => {
  const formData = new FormData();
  for (const property in data) {
    if (data.hasOwnProperty(property)) {
      if (property == "files" && data["files"]) {
        for (var i = 0; i < data["files"].length; i++) {
          formData.append("files", data["files"][i], data["files"][i].name);
        }
        continue;
      }

      if (filePropNames.includes(property) && data[property]) {
        for (var i = 0; i < data[property].length; i++) {
          formData.append(property, data[property][i], data[property][i].name);
        }
        continue;
      }

      if (data[property] != null) {
        if (Array.isArray(data[property])) {
          data[property].forEach((obj, index) => {
            if (typeof obj === "object") {
              for (const key in obj) {
                if (!obj.hasOwnProperty(key)) continue;

                if (!obj[key] || obj[key] === "") continue;

                formData.append(`${property}[${index}].${key}`, obj[key]);
              }
            } else {
              formData.append(`${property}[${index}]`, obj);
            }
          });
        } else if (data[property]?.depositAmount) {
          if (typeof data[property] === "object") {
            for (const key in data[property]) {
              if (!data[property].hasOwnProperty(key)) continue;
              formData.append(`${property}.${key}`, data[property][key]);
            }
          }
        } else {
          formData.append(property, data[property]);
        }
      }

      if (data[property] !== null && typeof data[property] === "object") {
        for (const key in data[property]) {
          if (!data[property].hasOwnProperty(key)) continue;
          formData.append(`${property}.${key}`, data[property][key]);
        }
      }
    }
  }
  return formData;
};

export const customDateFormat = (dateString: string): string => {
  let date = new Date(dateString);
  return moment(date).format("yyyy-MM-DD");
};

export const calculateTax = (
  items: any[],
  taxes: any[],
  taxInclusive: boolean,
  discountAfterTax?: boolean,
  transactionLevelDiscountRate?: number
): any[] => {
  let taxValue: number = 0;
  let taxesObj: any[] = [];
  let count: number = 0;
  let discountedItems: any[] = [...items];
  if (!discountAfterTax && transactionLevelDiscountRate > 0) {
    discountedItems = discountedItems.map((item) => {
      const discountAmount = item.amount * (transactionLevelDiscountRate / 100);
      item.amount = item.amount - discountAmount;
      return item;
    });
  }

  if (discountAfterTax && transactionLevelDiscountRate > 0) {
    discountedItems = discountedItems.map((item) => {
      item.amount = item.originalAmount;
      return item;
    });
  }

  discountedItems.forEach((item, index) => {
    count += 1;
    const selectedTax = taxes.find((x) => x.financeTaxId === item.taxId);
    if (selectedTax) {
      taxInclusive
        ? (taxValue = item.amount - item.amount / (1 + selectedTax.value / 100))
        : (taxValue = item.amount * (selectedTax.value / 100));

      const tax = taxesObj.find((tax) => tax.name === selectedTax.name);
      if (tax) {
        tax.value = tax.value + taxValue;
      } else {
        taxesObj = [
          ...taxesObj,
          {
            id: selectedTax.financeTaxId,
            name: selectedTax.name,
            value: taxValue,
          },
        ];
      }
    }
  });

  if (discountedItems.length === count) {
    return taxesObj;
  }
};

export const calculateJournalLines = (lines: any[], taxes: any[]) => {
  if (lines.length <= 0) {
    return null;
  }
  let journalLines: any[] = [...lines];
  let count: number = 0;
  let taxValue: number = 0;
  let amount: number = 0;
  let taxesObj: any[] = [];

  journalLines.forEach((line) => {
    count += 1;
    const selectedTax = taxes.find((x) => x.financeTaxId === line.taxId);
    if (selectedTax) {
      line.debitAmount > 0
        ? (amount = line.debitAmount)
        : (amount = line.creditAmount);
      taxValue = amount * (selectedTax.value / 100);

      const tax = taxesObj.find((tax) => tax.name === selectedTax.name);
      if (tax) {
        tax.value = tax.value + taxValue;
      } else {
        taxesObj = [
          ...taxesObj,
          {
            id: selectedTax.financeTaxId,
            name: selectedTax.name,
            value: taxValue,
            debit: line.debitAmount ? taxValue : 0,
            credit: line.creditAmount ? taxValue : 0,
          },
        ];
      }
    }
  });

  if (journalLines.length === count) {
    return taxesObj;
  }
};

export const calculateExpenseLines = (lines: any[], taxes: any[]) => {
  if (lines.length <= 0) {
    return null;
  }
  let expenseLines: any[] = [...lines];
  let count: number = 0;
  let taxValue: number = 0;
  let taxesObj: any[] = [];

  expenseLines.forEach((line) => {
    count += 1;
    const selectedTax = taxes.find((x) => x.financeTaxId === line.taxId);
    if (selectedTax) {
      taxValue = line.amount * (selectedTax.value / 100);

      const tax = taxesObj.find((tax) => tax.name === selectedTax.name);
      if (tax) {
        tax.value = tax.value + taxValue;
      } else {
        taxesObj = [
          ...taxesObj,
          {
            id: selectedTax.financeTaxId,
            name: selectedTax.name,
            value: taxValue,
          },
        ];
      }
    }
  });

  if (expenseLines.length === count) {
    return taxesObj;
  }
};

export const calculateDiscount = (
  discountAfterTax: boolean,
  subTotal: number,
  transactionLevelDiscountRate: number,
  taxesObj: any[]
): number => {
  if (!discountAfterTax) {
    return subTotal * (transactionLevelDiscountRate / 100);
  } else {
    taxesObj.forEach((tax) => {
      subTotal += tax.value;
    });
    return subTotal * (transactionLevelDiscountRate / 100);
  }
};

export const calculateLines = (
  lines: any[],
  taxes: any[],
  taxesObj: any[],
  discountAfterTax: boolean,
  taxInclusive: boolean,
  discountLevel: string,
  transactionLevelDiscountRate: number = 0
) => {
  if (lines.length <= 0) {
    return null;
  }

  lines.forEach((line) => {
    const price = line.unitPrice * line.quantity;
    line.subTotalAmount = price;
    line.amount = price;
    line.amountAfterDiscount = price;
    line.amountAfterTax = price;
    line.totalAmount = price;
    line.taxAmount = 0;
    line.discountAmount = 0;

    let selectedTax = taxes.find((x) => x.financeTaxId === line.taxId);

    if (discountLevel == "TransactionLevel") {
      if (discountAfterTax) {
        if (selectedTax) {
          if (taxInclusive) {
            line.taxAmount =
              line.subTotalAmount -
              line.subTotalAmount / (1 + selectedTax.value / 100);
          } else {
            line.taxAmount = (selectedTax.value / 100) * line.subTotalAmount;
            line.amountAfterTax = line.subTotalAmount + line.taxAmount;
          }
        }

        line.amountAfterDiscount = line.amountAfterTax;
        line.totalAmount = line.amountAfterTax;

        line.discountAmount =
          line.amountAfterTax * (transactionLevelDiscountRate / 100);

        line.amountAfterDiscount = line.amountAfterTax - line.discountAmount;
        line.totalAmount = line.amountAfterDiscount;
      } else {
        line.discountAmount =
          line.subTotalAmount * (transactionLevelDiscountRate / 100);

        line.amountAfterDiscount = line.subTotalAmount - line.discountAmount;
        line.amountAfterTax = line.amountAfterDiscount;
        line.totalAmount = line.amountAfterDiscount;

        if (selectedTax) {
          if (taxInclusive) {
            line.taxAmount =
              line.amountAfterDiscount -
              line.amountAfterDiscount / (1 + selectedTax.value / 100);
          } else {
            line.taxAmount =
              (selectedTax.value / 100) * line.amountAfterDiscount;
            line.amountAfterTax = line.amountAfterDiscount + line.taxAmount;
          }
        }

        line.totalAmount = line.amountAfterTax;
      }
    } else if (discountLevel == "LineItemLevel") {
      switch (line.discountType) {
        case "Flat":
          line.discountAmount = line.discountValueOnType;
          line.amountAfterDiscount = line.subTotalAmount - line.discountAmount;
          break;
        case "Percentage":
          line.discountAmount =
            line.subTotalAmount * (line.discountValueOnType / 100);
          line.amountAfterDiscount = line.subTotalAmount - line.discountAmount;
          break;
        default:
          break;
      }
      line.amountAfterTax = line.amountAfterDiscount;
      line.totalAmount = line.amountAfterDiscount;

      if (selectedTax) {
        if (taxInclusive) {
          line.taxAmount =
            line.amountAfterDiscount -
            line.amountAfterDiscount / (1 + selectedTax.value / 100);
        } else {
          line.taxAmount = (selectedTax.value / 100) * line.amountAfterDiscount;
          line.amountAfterTax = line.amountAfterDiscount + line.taxAmount;
        }
      }
      line.subTotalAmount = line.amountAfterDiscount;
      line.amount = line.amountAfterDiscount;
      line.totalAmount = line.amountAfterTax;
    }

    if (selectedTax) {
      const tax = taxesObj.find((tax) => tax.id === selectedTax?.financeTaxId);
      if (tax) {
        tax.value = tax.value + line.taxAmount;
      } else {
        taxesObj.push({
          id: selectedTax.financeTaxId,
          name: `${selectedTax.name} (${selectedTax.value}%)`,
          value: line.taxAmount,
        });
      }
    }
  });
};

export const humanize = (str: string) => {
  if (str == null || str == undefined || str.length == 0) return "";

  let result = "";
  for (let i = 0; i < str.length; i++) {
    const element = str[i];

    if (i != 0 && element.toLowerCase() != element) {
      result += ` ${element}`;
    } else {
      result += element;
    }
  }
  return result;
};

export const filterOptions = (tab: TabState, feature: string): string[] => {
  let filterOptions: string[] = [];

  switch (feature) {
    case "transaction":
      if (tab.state === "all") {
        filterOptions = [
          "All",
          "Asset",
          "Bill",
          "CashAdvance",
          "CreditNote",
          "CreditRefund",
          "Expense",
          "Journal",
          "Invoice",
          "PaymentMade",
          "PaymentReceived",
          "PettyCashTransaction",
          "VendorCreditNote",
          "LoanPayment",
          "LoanDisbursement",
        ];
      } else {
        filterOptions = ["All", "LoanDisbursement", "LoanPayment "];
      }
      break;

    default:
      if (tab.state === "all") {
        filterOptions = [
          "Draft",
          "ReDraft",
          "SentForApproval",
          "Posted",
          "Rejected",
        ];
      } else if (tab.state === "open") {
        filterOptions = ["Draft", "ReDraft", "SentForApproval"];
      } else {
        filterOptions = ["Posted", "Rejected"];
      }
      break;
  }

  return filterOptions;
};

export const accumulator = (arr: any[], key?: string): number => {
  let initialValue = 0;
  return +arr
    .reduce(
      (accumulator, currentValue) => accumulator + currentValue[key],
      initialValue
    )
    .toFixed(2);
};

export const setDueDate = (date: string, paymentTermDays: string): any => {
  const dateValue = moment(date);

  return moment(dateValue).add(+paymentTermDays, "days");
};

export function spaceWords(data: string | any[], key = "status") {
  if (typeof data === "string") return data.replace(/([a-z])([A-Z])/g, "$1 $2");

  return data.map((item) => {
    const text: string = item[key];
    const spacedWords = text.replace(/([a-z])([A-Z])/g, "$1 $2");
    item[key] = spacedWords;
    return item;
  });
}

export function calculateReportFieldsTotal(
  data: any[],
  fieldsForSummation: string[],
  reportCols: any[]
) {
  let objKeys: string[] = [];
  const objWithTotal = {};

  for (let col of reportCols) {
    objKeys.push(col.property);
  }

  fieldsForSummation.forEach((field) => {
    let total = 0;
    data.forEach((item) => {
      total += item[field];
    });

    for (let key of objKeys) {
      if (objKeys[0] === key) {
        objWithTotal[key] = "Total";
      } else if (field === key) {
        objWithTotal[key] = total;
      } else {
        if (objWithTotal[key] === undefined) {
          objWithTotal[key] = "";
        } else {
          objWithTotal[key] = objWithTotal[key];
        }
      }
    }
  });

  return [objWithTotal];
}

export function transfromAccs(accounts) {
  return accounts.map((account) => ({
    id: account.accountId,
    text: account.name,
  }));
}

export const toFormDataV2 = (
  data: any,
  customFields: string[] = []
): FormData => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined && data[key] !== "") {
      const element = data[key];
      if (typeof element === "object" && !customFields.includes(key)) {
        for (const childKey in element) {
          if (
            element[childKey] !== null &&
            element[childKey] !== undefined &&
            element[childKey] !== ""
          ) {
            const element1 = element[childKey];
            formData.append(`${key}.${childKey}`, element1);
          }
        }
      } else if (customFields.includes(key)) {
        for (var i = 0; i < element.length; i++) {
          formData.append(key, element[i], element[i].name);
        }
      } else {
        formData.append(key, element);
      }
    }
  }
  return formData;
};
