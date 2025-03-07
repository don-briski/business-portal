import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultitexterComponent } from './multitexter.component';

describe('MultitexterComponent', () => {
  let component: MultitexterComponent;
  let fixture: ComponentFixture<MultitexterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MultitexterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultitexterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
