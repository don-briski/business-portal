import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WacsLoanProductComponent } from './wacs-loan-product.component';

describe('WacsLoanProductComponent', () => {
  let component: WacsLoanProductComponent;
  let fixture: ComponentFixture<WacsLoanProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WacsLoanProductComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WacsLoanProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
