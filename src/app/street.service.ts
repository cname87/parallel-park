import { Injectable } from '@angular/core';
import { Street } from './street';

@Injectable({
  providedIn: 'root'
})
export class StreetService {

  constructor() { }

  street = new Street();

  getStreet() {
    return this.street;
  }
}
