import { Component, OnInit } from '@angular/core';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-account-verification',
  templateUrl: './account-verification.component.html',
  styleUrls: ['./account-verification.component.scss']
})
export class AccountVerificationComponent implements OnInit {

  id: string;
  code: string;
  key: string;
  feedbackMessage: string;
  requestLoader: boolean;
  newVerification = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) { }

  ngOnInit() {

    this.route.paramMap.subscribe((params: ParamMap) => {
      this.id = params.get('id');
      this.code = params.get('code');
      this.key = params.get('key');
      this.verifyAccount();
    });


  }

  verifyAccount() {
    this.requestLoader = true;
    this.authService.getVerificationInformation({code: this.code, id: this.id, key: this.key}).subscribe(
      (res) => {
       this.requestLoader = false;

       this.newVerification = true;

        this.feedbackMessage = res.message;
      },
      (err) => {
        this.newVerification = false;
        this.requestLoader = false;
        this.feedbackMessage = err.error.message;
      }
    );
  }

}
