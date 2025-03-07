import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NarrationCipherComponent } from './narration-cipher.component';

describe('NarrationCipherComponent', () => {
  let component: NarrationCipherComponent;
  let fixture: ComponentFixture<NarrationCipherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NarrationCipherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NarrationCipherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
