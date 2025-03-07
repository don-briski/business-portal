import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GambleCheckComponent } from './gamble-check.component';

describe('GambleCheckComponent', () => {
  let component: GambleCheckComponent;
  let fixture: ComponentFixture<GambleCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GambleCheckComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GambleCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
