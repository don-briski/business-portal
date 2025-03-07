import { Injectable } from "@angular/core";
import { Column, Workbook } from "exceljs";
import * as fs from "file-saver";
import {
  ExcelConfig,
  ExcelData,
  ExcelHeader,
  ExcelValueType,
} from "../modules/shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class ExcelService {
  constructor() {}

  exportExcel(
    excelData: { title: string; headers: string[]; data: any[] },
    numericHeaders: string[] = []
  ) {
    //Title, Header & Data
    const title = excelData.title;
    const header = excelData.headers;
    const data = excelData.data;

    //Create a workbook with a worksheet
    let workbook = new Workbook();

    let worksheet = workbook.addWorksheet(
      title.length > 25 ? title.substring(0, 25) : title
    );

    //Adding Header Row
    let headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "" }, //D3D3D3
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "000000" },
        size: 10,
      };
    });

    // numberFormat
    const numFmt = "#,##0.00";

    // get numericHeader indices
    let headerIndices = [];
    numericHeaders.forEach((element) => {
      const idx = header.indexOf(element);
      if (idx != -1) {
        headerIndices.push(idx);
      }
    });

    // set numeric columns
    headerIndices.forEach((idx) => {
      worksheet.getColumn(idx).numFmt = numFmt;
    });

    // Adding Data with Conditional Formatting
    data.forEach((d) => {
      let rowdata = Object.values(d);
      let row = worksheet.addRow(rowdata);
    });

    //Generate & Save Excel File
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      fs.saveAs(blob, title + ".xlsx");
    });
  }

  exportV2(config: ExcelConfig, headers: ExcelHeader[], data: ExcelData) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(config.title);
    const headerNames = headers.map((header) => header.name);
    const headerKeys = headers.map((header) => header.key);
    const headerRow = worksheet.addRow(headerNames);
    //set headers
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "000000" },
        size: 12,
      };
    });

    //set number columns format
    headers.forEach((header, index) => {
      if (header.type === ExcelValueType.Numeric) {
        worksheet.getColumn(index+1).numFmt = "#,##0.00";
        worksheet.getColumn(index+1).alignment = {horizontal:"right"}
      }else{
        worksheet.getColumn(index+1).alignment = {horizontal:"left"}
      }
    });
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const element = data[key].values;
        const summations = data[key]?.summations;

        // only handles scenerio where the value of the key is an array
        if (Array.isArray(element)) {
          const subHeaders = worksheet.addRow([key]);
          worksheet.mergeCells(subHeaders.number, 1, subHeaders.number, headers.length);
          subHeaders.eachCell((cell) => {
            cell.font = {
              bold: true,
              color: { argb: config?.cellHeaderColor || "000000" },
              size: 12,
            };
          });
          // Add data rows
          element.forEach((item) => {
            const row = headerKeys.map(key => item[key])
            worksheet.addRow(row);
          });
        }
        if (summations) {
          const font = {
            bold: true,
            color: { argb: "000000" },
            size: 16,
          }
          const rowCount = worksheet.rowCount+1;
          const labelCell = worksheet.getCell(rowCount,1);
          summations.values.forEach(sum => {
            const summationsCell = worksheet.getCell(rowCount,sum.col);
            summationsCell.value = sum.value;
            summationsCell.font = font
          })

          labelCell.value = "Total";

          labelCell.font = font;
        }
      }
    }

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      fs.saveAs(blob, config.title + ".xlsx");
    });
  }
}
