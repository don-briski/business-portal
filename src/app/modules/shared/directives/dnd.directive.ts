import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[lndDnd]',
  standalone: true
})
export class DndDirective {
  @Output() fileDropped = new EventEmitter();
  @HostBinding('class.upload-border-color') borderColor:boolean;
  @HostListener('dragover',['$event']) onDragOver(evt){
    evt.preventDefault();
    evt.stopPropagation();
    this.borderColor = true;
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.borderColor = false;
  }

  @HostListener('drop',['$event']) onDrop(evt){
    evt.preventDefault();
    evt.stopPropagation();
    this.fileDropped.emit(evt?.dataTransfer?.files)
    this.borderColor = false;
  }

}
