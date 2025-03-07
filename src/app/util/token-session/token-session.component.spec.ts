import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TokenSessionComponent } from './token-session.component';

describe('TokenSessionComponent', () => {
  let component: TokenSessionComponent;
  let fixture: ComponentFixture<TokenSessionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenSessionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
