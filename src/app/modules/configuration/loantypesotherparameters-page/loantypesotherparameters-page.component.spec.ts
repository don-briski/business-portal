import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoantypesotherparametersPageComponent } from './loantypesotherparameters-page.component';

describe('LoantypesotherparametersPageComponent', () => {
  let component: LoantypesotherparametersPageComponent;
  let fixture: ComponentFixture<LoantypesotherparametersPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoantypesotherparametersPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoantypesotherparametersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
