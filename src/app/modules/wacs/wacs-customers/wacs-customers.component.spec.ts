import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WacsCustomersComponent } from './wacs-customers.component';

describe('WacsCustomersComponent', () => {
  let component: WacsCustomersComponent;
  let fixture: ComponentFixture<WacsCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WacsCustomersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WacsCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
