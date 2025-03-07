import { Pipe, PipeTransform } from "@angular/core";

const COUNT_FORMATS = [
  {
    letter: "",
    shortLetter: "",
    limit: 1e3,
  },
  {
    letter: " thousand",
    shortLetter: "k",
    limit: 1e6,
  },
  {
    letter: " million",
    shortLetter: "m",
    limit: 1e9,
  },
  {
    letter: " billion",
    shortLetter: "b",
    limit: 1e12,
  },
  {
    letter: " trillion",
    shortLetter: "t",
    limit: 1e15,
  },
];
@Pipe({
  name: "numberFormat",
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {

  transform(value: number, length: string = null): string {
    const format = COUNT_FORMATS.find(format => value < format.limit);
    value = (1000 * value / format!.limit);
    value = Math.round(value * 10) / 10;
    const data = (value + ((length && length === 'short') ? format!.shortLetter : format!.letter))
    return data;
  }
}
