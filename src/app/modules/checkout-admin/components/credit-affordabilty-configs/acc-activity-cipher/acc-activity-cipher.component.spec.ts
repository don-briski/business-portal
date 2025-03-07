import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccActivityCipherComponent } from './acc-activity-cipher.component';

describe('AccActivityCipherComponent', () => {
  let component: AccActivityCipherComponent;
  let fixture: ComponentFixture<AccActivityCipherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccActivityCipherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccActivityCipherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
