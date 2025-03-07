export const isExcel = (fileName) => {
  const fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
  return fileExtension === 'xls' || fileExtension === 'xlsx';
}

export const fileSizeIsAboveBound = (fileSize,bound) => {
  return Math.round((fileSize / 1024)) > (bound * 1024);
}
