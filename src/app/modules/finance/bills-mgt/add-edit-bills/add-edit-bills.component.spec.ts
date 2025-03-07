import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditBillsComponent } from './add-edit-bills.component';

describe('AddEditBillsComponent', () => {
  let component: AddEditBillsComponent;
  let fixture: ComponentFixture<AddEditBillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditBillsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditBillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
