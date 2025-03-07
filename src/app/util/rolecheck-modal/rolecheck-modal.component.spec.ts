import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RolecheckModalComponent } from './rolecheck-modal.component';

describe('RolecheckModalComponent', () => {
  let component: RolecheckModalComponent;
  let fixture: ComponentFixture<RolecheckModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RolecheckModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RolecheckModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
