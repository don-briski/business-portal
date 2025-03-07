import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditInvestmentComponent } from './add-edit-investment.component';

describe('AddEditInvestmentComponent', () => {
  let component: AddEditInvestmentComponent;
  let fixture: ComponentFixture<AddEditInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditInvestmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
