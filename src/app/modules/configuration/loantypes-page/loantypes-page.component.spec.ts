import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoantypesPageComponent } from './loantypes-page.component';

describe('LoantypesPageComponent', () => {
  let component: LoantypesPageComponent;
  let fixture: ComponentFixture<LoantypesPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoantypesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoantypesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
