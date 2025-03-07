import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditHeaderComponent } from './add-edit-header.component';

describe('AddEditHeaderComponent', () => {
  let component: AddEditHeaderComponent;
  let fixture: ComponentFixture<AddEditHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
