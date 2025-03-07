import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecoverymeasurePageComponent } from './recoverymeasure-page.component';

describe('RecoverymeasurePageComponent', () => {
  let component: RecoverymeasurePageComponent;
  let fixture: ComponentFixture<RecoverymeasurePageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RecoverymeasurePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverymeasurePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
