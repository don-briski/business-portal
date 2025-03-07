import { Injectable } from '@angular/core';
import { GrowthBook } from '@growthbook/growthbook';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GrowthbookService {

  growthbook: GrowthBook;
  constructor() { }

  async launchGrowthBook() {
    let growthbookKey;
    const host = window.location.host;
    const split = host.split(".");
    if (split.includes('dev') || split.includes('vercel') || this.isLocalHost(split)) {
      growthbookKey = environment.growthbookDevKey;
    } else if (split.includes('test')) {
      growthbookKey = environment.growthbookTestKey
    } else {
      growthbookKey = environment.growthbookProductionKey;
    }

    this.growthbook = new GrowthBook({
      apiHost: environment.growthbookHost,
      clientKey: growthbookKey,
      enableDevMode: true,
      subscribeToChanges: true,
    });

    // Wait for features to be available
    await this.growthbook.loadFeatures();
  }

  isLocalHost(host: string[]) {
    for (let i = 0; i < host.length; i++) {
      if (host[i].includes('localhost')) {
          return true;
      }
  }
  return false;
  }
}
