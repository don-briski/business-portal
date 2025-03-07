import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupWrapperComponent } from './setup-wrapper.component';

describe('SetupWrapperComponent', () => {
  let component: SetupWrapperComponent;
  let fixture: ComponentFixture<SetupWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupWrapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
