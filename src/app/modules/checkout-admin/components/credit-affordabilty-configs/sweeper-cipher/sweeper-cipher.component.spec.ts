import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweeperCipherComponent } from './sweeper-cipher.component';

describe('SweeperCipherComponent', () => {
  let component: SweeperCipherComponent;
  let fixture: ComponentFixture<SweeperCipherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SweeperCipherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SweeperCipherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
