import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentconfigurationPageComponent } from './investmentconfiguration-page.component';

describe('InvestmentconfigurationPageComponent', () => {
  let component: InvestmentconfigurationPageComponent;
  let fixture: ComponentFixture<InvestmentconfigurationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvestmentconfigurationPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestmentconfigurationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
