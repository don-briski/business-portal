import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffordProfileComponent } from './afford-profile.component';

describe('AffordProfileComponent', () => {
  let component: AffordProfileComponent;
  let fixture: ComponentFixture<AffordProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AffordProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffordProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
