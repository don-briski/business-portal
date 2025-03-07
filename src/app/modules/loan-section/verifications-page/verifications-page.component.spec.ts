import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VerificationsPageComponent } from './verifications-page.component';

describe('VerificationsPageComponent', () => {
  let component: VerificationsPageComponent;
  let fixture: ComponentFixture<VerificationsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VerificationsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
