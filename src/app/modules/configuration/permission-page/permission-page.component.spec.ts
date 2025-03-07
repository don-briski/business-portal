import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PermissionPageComponent } from './permission-page.component';

describe('PermissionPageComponent', () => {
  let component: PermissionPageComponent;
  let fixture: ComponentFixture<PermissionPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PermissionPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
