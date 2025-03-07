import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfricaTalkingComponent } from './africa-talking.component';

describe('AfricaTalkingComponent', () => {
  let component: AfricaTalkingComponent;
  let fixture: ComponentFixture<AfricaTalkingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AfricaTalkingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AfricaTalkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
