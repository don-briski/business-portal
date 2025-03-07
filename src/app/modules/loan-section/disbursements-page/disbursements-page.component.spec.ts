import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DisbursementsPageComponent } from './disbursements-page.component';

describe('DisbursementsPageComponent', () => {
  let component: DisbursementsPageComponent;
  let fixture: ComponentFixture<DisbursementsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DisbursementsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisbursementsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
