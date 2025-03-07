import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearlyReviewDialogComponent } from './yearly-review-dialog.component';

describe('YearlyReviewDialogComponent', () => {
  let component: YearlyReviewDialogComponent;
  let fixture: ComponentFixture<YearlyReviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YearlyReviewDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YearlyReviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
