import { Injectable, Output, EventEmitter, Directive } from "@angular/core";
import { Observable, Subject } from "rxjs";
import * as signalR from "@aspnet/signalr";
import { environment } from "src/environments/environment";

@Directive()
@Injectable({
  providedIn: "root",
})
export class RealtimeService {
  constructor() {}
  public data = [];
  @Output() NewApplication: EventEmitter<any> = new EventEmitter();
  // private baseUrl = 'http://localhost:4200/realtime';
  private baseUrl = window.location.origin + "/realtime";
  private newAppSubject = new Subject();
  private hubConnection: signalR.HubConnection;

  public startConnection = () => {
    this.NewApplication = new EventEmitter();

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.baseUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .build();
    this.hubConnection
      .start()

      .then(() => 0)
      .catch((err) => 0);
  };

  public cancelConnection = () => {
    this.hubConnection?.stop();
  };

  public newPoolDataListener = () => {
    this.hubConnection.on("pooldata", (data: any) => {});
  };

  public newPoolListener = () => {
    const key = sessionStorage.getItem("appOwnerKey");
    const notifykey = `pooldata${key}`;
    this.hubConnection.on(notifykey, (data: any) => {
      this.newAppNotify(data);
    });
  };

  newAppNotify(data) {
    this.newAppSubject.next(data);
  }

  getNewAppNotification(): Observable<any> {
    return this.newAppSubject.asObservable();
  }
}
