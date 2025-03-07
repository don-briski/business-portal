import { ImageType } from "../../loan-section/enums/image-type.enum";
import {
  ImportErrorEnum,
  TableConfig,
  TableData,
  TableHeader,
} from "../shared.types";

export const searchList = (event, lists: any[], paths: string[]) => {
  let result = [];
  if (event.length > 1) {
    let regex = new RegExp(event, "i");
    paths.forEach((path) => {
      lists.filter((item) => {
        if (regex.test(item[path])) {
          result.push(item);
        }
      });
    });
  }
  return result;
};

/**
 * @deprecated this method is deprecated use lightenColorV2 instead
 */
export const lightenColor = (hexColor: string, lightenAmount: number) => {
  // Remove the "#" from the hex color and parse it into RGB components
  const hex = hexColor.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate the new RGB values
  const newR = Math.min(255, r + lightenAmount);
  const newG = Math.min(255, g + lightenAmount);
  const newB = Math.min(255, b + lightenAmount);

  // Convert the new RGB values back to a hex color
  const newHex = `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;

  return newHex;
};

export const lightenColorV2 = (
  hexCode: string,
  lightenAmount: number
): string => {
  const transparencyPairs: { [key: number]: string } = {
    100: "FF",
    99: "FC",
    98: "FA",
    97: "F7",
    96: "F5",
    95: "F2",
    94: "F0",
    93: "ED",
    92: "EB",
    91: "E8",
    90: "E6",
    89: "E3",
    88: "E0",
    87: "DE",
    86: "DB",
    85: "D9",
    84: "D6",
    83: "D4",
    82: "D1",
    81: "CF",
    80: "CC",
    79: "C9",
    78: "C7",
    77: "C4",
    76: "C2",
    75: "BF",
    74: "BD",
    73: "BA",
    72: "B8",
    71: "B5",
    70: "B3",
    69: "B0",
    68: "AD",
    67: "AB",
    66: "A8",
    65: "A6",
    64: "A3",
    63: "A1",
    62: "9E",
    61: "9C",
    60: "99",
    59: "96",
    58: "94",
    57: "91",
    56: "8F",
    55: "8C",
    54: "8A",
    53: "87",
    52: "85",
    51: "82",
    50: "80",
    49: "7D",
    48: "7A",
    47: "78",
    46: "75",
    45: "73",
    44: "70",
    43: "6E",
    42: "6B",
    41: "69",
    40: "66",
    39: "63",
    38: "61",
    37: "5E",
    36: "5C",
    35: "59",
    34: "57",
    33: "54",
    32: "52",
    31: "4F",
    30: "4D",
    29: "4A",
    28: "47",
    27: "45",
    26: "42",
    25: "40",
    24: "3D",
    23: "3B",
    22: "38",
    21: "36",
    20: "33",
    19: "30",
    18: "2E",
    17: "2B",
    16: "29",
    15: "26",
    14: "24",
    13: "21",
    12: "1F",
    11: "1C",
    10: "1A",
    9: "17",
    8: "14",
    7: "12",
    6: "0F",
    5: "0D",
    4: "0A",
    3: "08",
    2: "05",
    1: "03",
    0: "00",
  };
  return `${hexCode}${transparencyPairs[lightenAmount]}`;
};

export const darkenColor = (hexColor: string, darkenAmount: number) => {
  // Remove the "#" from the hex color and parse it into RGB components
  const hex = hexColor.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate the new RGB values
  const newR = Math.max(0, r - darkenAmount);
  const newG = Math.max(0, g - darkenAmount);
  const newB = Math.max(0, b - darkenAmount);

  // Convert the new RGB values back to a hex color
  const newHex = `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;

  return newHex;
};

export const serializerError = (
  errorType: ImportErrorEnum,
  columnName: string
): string => {
  let serializedString;
  if (errorType === ImportErrorEnum.RequiredDataNotProvided) {
    serializedString = `${columnName} is required but not sent!`;
  } else if (errorType === ImportErrorEnum.DatabaseDuplicate) {
    serializedString = `A duplicate entry already exists for ${columnName} in the database.`;
  } else if (errorType === ImportErrorEnum.FileEmpty) {
    serializedString = `The imported file is empty`;
  } else if (errorType === ImportErrorEnum.InvalidFormat) {
    serializedString = `You provided an invalid format for ${columnName}`;
  } else if (errorType === ImportErrorEnum.NegativeValueProvided) {
    serializedString = `Negative Values are not accepted for ${columnName}`;
  } else if (errorType === ImportErrorEnum.NotFound) {
    serializedString = `Value not found`;
  } else if (errorType === ImportErrorEnum.OutOfRange) {
    serializedString = `The value provided for ${columnName} isn't within the acceptable range`;
  } else if (errorType === ImportErrorEnum.SheetDuplicate) {
    serializedString = `The value provided already exists on this Sheet`;
  } else if (errorType === ImportErrorEnum.ValueLessThanZero) {
    serializedString = `Values must not be less than Zero(0)`;
  } else if (errorType === ImportErrorEnum.WrongFile) {
    serializedString = `You imported the wrong file`;
  }
  return serializedString;
};

export const handleImportError = (error) => {
  if (error.length > 0) {
    return error.map((error) => ({
      row: { tdValue: error.rowNumber },
      column: { tdValue: error.columnName },
      error: {
        tdValue: serializerError(
          error.error as ImportErrorEnum,
          error.columnName
        ),
      },
    }));
  }
};

export const IMPORT_ERROR_CONFIG: TableConfig = {
  theadLight: true,
  small: true,
  striped: true,
  bordered: true,
};
export const IMPORT_ERROR_HEADER: TableHeader[] = [
  { name: "Affected Row" },
  { name: "Affected Column" },
  { name: "Error" },
];
export const IMPORT_ERROR_DATA: TableData[] = [];

export const removeNullUndefinedWithReduce = (payload): any => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      acc[key] =
        typeof value === "object"
          ? removeNullUndefinedWithReduce(value)
          : value;
    }
    return acc;
  }, {});
};

export const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const splitArray = (originalArray: any[]) => {
  const totalLength = originalArray.length;
  const firstTwoSize = Math.ceil((totalLength * 2) / 3);
  const eachOfFirstTwo = Math.ceil(firstTwoSize / 2);
  const lastSize = totalLength - eachOfFirstTwo * 2;

  const firstArray = originalArray.slice(0, eachOfFirstTwo);
  const secondArray = originalArray.slice(eachOfFirstTwo, eachOfFirstTwo * 2);
  const thirdArray = originalArray.slice(eachOfFirstTwo * 2);

  return [firstArray, secondArray, thirdArray];
};

export const LOAN_REPAYMENT_BALANCE_TYPES = [
  {
    id: 1,
    text: "Equal Principal Payments, Reducing Interest Payments, Applied Effective Rate",
    value: "EffectiveRateFlatBalance",
  },
  {
    id: 2,
    text: "Reducing Principal Payments, Reducing Interest Payments, Applied Effective Rate",
    value: "EffectiveReducingBalance",
  },
  {
    id: 3,
    text: "Equal Principal Payments, Equal Interest Payments, Applied Nominal Rate",
    value: "NominalFlatBalance",
  },
  {
    id: 4,
    text: "Equal Principal Payments, Reducing Interest Payment",
    value: "NominalReducingBalance",
  },
  {
    id: 5,
    text: "Reducing Principal Payments, Reducing Interest Payments, Applied Nominal Rate",
    value: "NominalReducingBalanceII",
  },
];

export const getUserReadableLoanRepaymentBalanceType = (
  key: string
): string => {
  return LOAN_REPAYMENT_BALANCE_TYPES.find((type) => type.value === key).text;
};

export const isFileSizeValid = (file: File, maxSizeInMb: number): boolean => {
  const maxSizeInBytes = maxSizeInMb * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const isImage = (file: File): boolean => {
  return Object.values(ImageType).includes(file.type as ImageType);
};

export const removeDuplicates = (arr1, arr2) => {
  const set2 = new Set(arr2.map((obj) => JSON.stringify(obj)));

  return arr1.filter((obj) => !set2.has(JSON.stringify(obj)));
};

export const toNGNFormat = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const objectToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToCamelCase(item));
  } else if (typeof obj === "object" && obj !== null) {
    return Object.keys(obj).reduce((result, key) => {
      const camelCaseKey = camelCaseString(key);
      result[camelCaseKey] = objectToCamelCase(obj[key]);
      return result;
    }, {});
  } else {
    return obj;
  }
};

export const camelCaseString = (str: string) => {
  return (str.charAt(0).toLowerCase() + str.slice(1) || str).toString();
};

export const processCSVData = (headers:string[],data:any[]) => {
  const replacer = (key, value) => (value === null ? "" : value);
  let csv = data.map((row) =>
    headers
      .map((fieldName) => JSON.stringify(row[fieldName], replacer))
      .join(",")
  );
  csv.unshift(headers.join(","));
  let csvArray = csv.join("\r\n");

  return csvArray;
};
