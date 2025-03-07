export const getFromJson = (stringArray: string, expectedResult: string) => {
  let result = "";
  if (stringArray != null && stringArray !== "" && expectedResult !== "") {
    result = JSON.parse(stringArray)[expectedResult];
  }
  return result;
}
