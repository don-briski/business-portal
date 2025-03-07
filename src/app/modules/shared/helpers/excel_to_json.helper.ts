import * as XLSX from "xlsx";

export const excelToJson = (event,indexes?:number[],header?:string[]):Promise<[]> => {

  let file = event?.target?.files[0] || event;
  let fileReader = new FileReader();
  let arrayBuffer;
  let arraylist;
  return new Promise((resolve) => {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      arrayBuffer = fileReader.result;
      let data = new Uint8Array(arrayBuffer);
      let arr = new Array();
      for (let i = 0; i != data.length; ++i)
        arr[i] = String.fromCharCode(data[i]);
      let bstr = arr.join("");
      let workbook = XLSX.read(bstr, { type: "binary" });
      if (!indexes) {
        let first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];
        arraylist = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        let filelist = [];
        resolve(arraylist);
      } else {
        let sheetsData:any = {};
        indexes.forEach(index => {
          const sheetName = workbook.SheetNames[index];
          const sheet = workbook.Sheets[sheetName];
          sheetsData[sheetName] = XLSX.utils.sheet_to_json(sheet, {header:header,raw:false,skipHidden:true,range:1})
        })
        resolve(sheetsData)
      }
    };
  });
};
