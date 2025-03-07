import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextAreaWithCharLimitComponent } from './text-area-with-char-limit.component';

describe('TextAreaWithCharLimitComponent', () => {
  let component: TextAreaWithCharLimitComponent;
  let fixture: ComponentFixture<TextAreaWithCharLimitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextAreaWithCharLimitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextAreaWithCharLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
