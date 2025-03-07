import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacklogTransactionsComponent } from './backlog-transactions.component';

describe('BacklogTransactionsComponent', () => {
  let component: BacklogTransactionsComponent;
  let fixture: ComponentFixture<BacklogTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BacklogTransactionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacklogTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
