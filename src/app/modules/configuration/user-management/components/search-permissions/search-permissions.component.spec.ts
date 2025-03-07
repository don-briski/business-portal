import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPermissionsComponent } from './search-permissions.component';

describe('SearchPermissionsComponent', () => {
  let component: SearchPermissionsComponent;
  let fixture: ComponentFixture<SearchPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchPermissionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
