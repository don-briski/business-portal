import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkDisbFailedComponent } from './mark-disb-failed.component';

describe('MarkDisbFailedComponent', () => {
  let component: MarkDisbFailedComponent;
  let fixture: ComponentFixture<MarkDisbFailedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkDisbFailedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkDisbFailedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
