import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigLayoutComponent } from './config-layout.component';

describe('ConfigLayoutComponent', () => {
  let component: ConfigLayoutComponent;
  let fixture: ComponentFixture<ConfigLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
