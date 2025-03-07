import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetLimitAlertComponent } from './limit-alert.component';

describe('SetLimitAlertComponent', () => {
  let component: SetLimitAlertComponent;
  let fixture: ComponentFixture<SetLimitAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetLimitAlertComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetLimitAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
