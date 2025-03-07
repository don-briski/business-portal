import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonoComponent } from './mono.component';

describe('MonoComponent', () => {
  let component: MonoComponent;
  let fixture: ComponentFixture<MonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MonoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
