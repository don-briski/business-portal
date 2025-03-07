import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanify'
})
export class StringHumanifyPipe implements PipeTransform {

    transform(value: any): string {
      if (!value || typeof value !== 'string') return;
        const reg = /[A-Z-_\&](?=[a-z0-9]+)|[A-Z-_\&]+(?![a-z0-9])/g;
        const delimited = value?.replace(reg, ' $&').trim();
        return delimited;
    }

}
