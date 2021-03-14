import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomStreetComponent } from './custom-street.component';

describe('CustomComponent', () => {
  let component: CustomStreetComponent;
  let fixture: ComponentFixture<CustomStreetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomStreetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomStreetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
