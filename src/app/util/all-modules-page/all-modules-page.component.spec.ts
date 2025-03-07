import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllModulesPageComponent } from './all-modules-page.component';

describe('AllModulesPageComponent', () => {
  let component: AllModulesPageComponent;
  let fixture: ComponentFixture<AllModulesPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AllModulesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllModulesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
