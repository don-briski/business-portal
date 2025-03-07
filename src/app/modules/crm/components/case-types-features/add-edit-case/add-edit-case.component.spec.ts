import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditCaseComponent } from './add-edit-case.component';

describe('AddEditCaseComponent', () => {
  let component: AddEditCaseComponent;
  let fixture: ComponentFixture<AddEditCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditCaseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
