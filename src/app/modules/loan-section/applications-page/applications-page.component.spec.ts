import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApplicationsPageComponent } from './applications-page.component';

describe('ApplicationsPageComponent', () => {
  let component: ApplicationsPageComponent;
  let fixture: ComponentFixture<ApplicationsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
