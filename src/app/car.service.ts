import { Injectable } from '@angular/core';
import { Car } from './car';

@Injectable({
  providedIn: 'root',
})
export class CarService {
  car = new Car();

  getCar() {
    return this.car;
  }
}
