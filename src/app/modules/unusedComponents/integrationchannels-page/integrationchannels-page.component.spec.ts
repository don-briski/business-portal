import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IntegrationchannelsPageComponent } from './integrationchannels-page.component';

describe('IntegrationchannelsPageComponent', () => {
  let component: IntegrationchannelsPageComponent;
  let fixture: ComponentFixture<IntegrationchannelsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IntegrationchannelsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationchannelsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
