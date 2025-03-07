import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ElementRef } from "@angular/core";

export const printFile = (
  element: ElementRef,
  filename: string,
  type: string
) => {
  return new Promise((resolve, reject) => {
    let newFilename: string = `${filename}-${type}`;
    html2canvas(element.nativeElement, {useCORS: true, imageTimeout: 0}).then((canvas) => {
      let PDF = new jsPDF("p", "mm", "a4");
      let fileWidth = PDF.internal.pageSize.getWidth();
      let pageHeight = PDF.internal.pageSize.getHeight();
      const fileHeight = (canvas.height * fileWidth) / canvas.width;
      const imgData  = canvas.toDataURL("image/png");
      let position = 0;
      let heightLeft = fileHeight;
      PDF.addImage(imgData, "PNG", 0, position, fileWidth, fileHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position += (heightLeft - fileHeight) + 10;
        PDF.addPage();
        PDF.addImage(imgData, 'PNG', 0, position, fileWidth, fileHeight);
        heightLeft -= pageHeight;
      }

      PDF.save(newFilename, { returnPromise: true }).then((res) =>
        resolve(res)
      );
    });
  });
};
