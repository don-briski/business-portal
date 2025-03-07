import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDisbLimitComponent } from './add-edit-disb-limit.component';

describe('AddEditDisbLimitComponent', () => {
  let component: AddEditDisbLimitComponent;
  let fixture: ComponentFixture<AddEditDisbLimitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditDisbLimitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditDisbLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
