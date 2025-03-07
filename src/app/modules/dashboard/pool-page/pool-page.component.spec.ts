import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PoolPageComponent } from './pool-page.component';

describe('PoolPageComponent', () => {
  let component: PoolPageComponent;
  let fixture: ComponentFixture<PoolPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PoolPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
