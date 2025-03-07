import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rolecheck-modal',
  templateUrl: './rolecheck-modal.component.html',
  styleUrls: ['./rolecheck-modal.component.scss']
})
export class RolecheckModalComponent implements OnInit {

  appKey: string;
  url: string;
  constructor() { }

  ngOnInit() {
    this.url = window.location.origin;
    this.appKey = sessionStorage.getItem('appOwnerPublicKey');
  }

  clearLocal() {
    sessionStorage.clear();
  }

}
