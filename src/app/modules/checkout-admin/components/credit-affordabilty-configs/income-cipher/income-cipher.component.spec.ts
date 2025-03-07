import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeCipherComponent } from './income-cipher.component';

describe('IncomeCipherComponent', () => {
  let component: IncomeCipherComponent;
  let fixture: ComponentFixture<IncomeCipherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IncomeCipherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeCipherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
