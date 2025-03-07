import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRolePermissionsComponent } from './view-role-permissions.component';

describe('ViewRolePermissionsComponent', () => {
  let component: ViewRolePermissionsComponent;
  let fixture: ComponentFixture<ViewRolePermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ViewRolePermissionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRolePermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
