import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmInteractionsComponent } from './crm-interactions.component';

describe('CrmInteractionsComponent', () => {
  let component: CrmInteractionsComponent;
  let fixture: ComponentFixture<CrmInteractionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrmInteractionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
