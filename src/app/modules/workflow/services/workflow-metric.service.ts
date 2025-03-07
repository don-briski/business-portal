import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorkflowMetricService {
  private baseUrl = environment.apiUrl + "metrics";
  private _decodedToken;
  private _userToken;

  constructor(private http: HttpClient, private jwtHelperService: JwtHelperService) { }


  public getWorkflowMetrics(): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "/workflowmetrics",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          }
        )
      );
  }
  

  
  private _getToken() {
    return JSON.parse(sessionStorage.token);
  }

  private setToken(headers) {
    try {
      const authToken = headers.get("Set-Auth");
      if (authToken) {
        sessionStorage.setItem("token", JSON.stringify(authToken));
        this._decodedToken = this.jwtHelperService.decodeToken(authToken);
        sessionStorage.setItem(
          "auth",
          JSON.stringify({
            nameid: this._decodedToken ? this._decodedToken.nameid : null,
            actort: this._decodedToken ? this._decodedToken.actort : null,
            email: this._decodedToken ? this._decodedToken.email : null,
          })
        );
        this._userToken = authToken;
      }
      return true;
    } catch (e) {
    }
  }
}
