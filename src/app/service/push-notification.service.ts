import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { PushNotification } from '../model/push-notification.model';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  private base_path = `http://www.arkounting.com.ng/push-notification/wp-json/wp/v2/posts?page=1&per_page=5&_fields=id,title,content,excerpt`;
    private img_base_path = `http://www.arkounting.com.ng/push-notification/wp-json/wp/v2/media/`;
  constructor(private http: HttpClient) { }

  public getAllNotifications(): Observable<PushNotification[]> {
    return this.http.get<any>(this.base_path).pipe(retry(2));
  }
}
