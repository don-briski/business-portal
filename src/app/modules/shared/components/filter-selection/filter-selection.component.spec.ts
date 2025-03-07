import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSelectionComponent } from './filter-selection.component';

describe('FilterSelectionComponent', () => {
  let component: FilterSelectionComponent;
  let fixture: ComponentFixture<FilterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
