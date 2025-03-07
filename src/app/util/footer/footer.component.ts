import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  copyright: any;
  constructor() {
    this.copyright = new Date().getFullYear();
  }

  ngOnInit() {
  }

}
