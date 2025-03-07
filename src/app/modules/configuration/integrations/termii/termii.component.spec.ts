import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermiiComponent } from './termii.component';

describe('TermiiComponent', () => {
  let component: TermiiComponent;
  let fixture: ComponentFixture<TermiiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TermiiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermiiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
