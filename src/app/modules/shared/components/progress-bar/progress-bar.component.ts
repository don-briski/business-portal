import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lnd-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {
  @Input() progressValue = 0;

  constructor() { }

  ngOnInit(): void {
  }

}
