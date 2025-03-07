import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'customDatePipe'
})
export class CustomDatePipePipe implements PipeTransform {

    transform(value: any, format: string = null): string {
      let newDate = new Date(value);
      if (format) {
        return moment(newDate).format(format);
      }
      return moment(newDate).format('DD-MMM-YYYY');
    }

}
