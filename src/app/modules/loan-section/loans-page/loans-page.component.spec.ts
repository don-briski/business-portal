import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoansPageComponent } from './loans-page.component';

describe('LoansPageComponent', () => {
  let component: LoansPageComponent;
  let fixture: ComponentFixture<LoansPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoansPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoansPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
