import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'lnd-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit, OnDestroy {

  code: string;
  unsubscriber$ = new Subject<void>();
  loader: boolean;
  verified: boolean;

  message: string;
  constructor(private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit(): void {
    
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.code = params.get('code');
      this.verifyEmail();
    });
  }

  verifyEmail(): void {
    this.loader = true;

    this.authService.verifyUserEmail(this.code)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(res => {
        this.message = res?.message;
        this.loader = false;
        this.verified = true;
      }, err => {
        this.loader = false;
      })
  }

  ngOnDestroy(): void {
      this.unsubscriber$.next();
      this.unsubscriber$.complete();
  }

}
