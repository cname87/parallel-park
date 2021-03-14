import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomCarComponent } from './custom-car.component';

describe('CustomComponent', () => {
  let component: CustomCarComponent;
  let fixture: ComponentFixture<CustomCarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomCarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomCarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
