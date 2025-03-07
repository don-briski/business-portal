import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseBulkAddComponent } from './expense-bulk-add.component';

describe('ExpenseBulkAddComponent', () => {
  let component: ExpenseBulkAddComponent;
  let fixture: ComponentFixture<ExpenseBulkAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpenseBulkAddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseBulkAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
