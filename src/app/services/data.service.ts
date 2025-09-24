import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import {
  IButton,
  ICar,
  IRunMode,
  IManoeuvre,
  IStreet,
  TButtonNames,
  IParkMode,
} from '../shared/types';

/**
 * Receives and shares all data sources.
 */

@Injectable({
  providedIn: 'root',
})
export class DataService {
  //
  #manoeuvre!: IManoeuvre;
  #car!: ICar;
  #street!: IStreet;
  #runMode!: IRunMode;
  #parkMode!: IParkMode;
  #stopMoveCalled$!: Observable<boolean>;

  #buttons = new Map();

  getRunMode = (): IRunMode => this.#runMode;
  getParkMode = (): IParkMode => this.#parkMode;
  getManoeuvre = (): IManoeuvre => this.#manoeuvre;
  getCar = (): ICar => this.#car;
  getStreet = (): IStreet => this.#street;
  getStopMoveCalled = (): Observable<boolean> => this.#stopMoveCalled$;

  setRunMode = (group: IRunMode): void => {
    this.#runMode = group;
  };
  setParkMode = (parkMode: IParkMode): void => {
    this.#parkMode = parkMode;
  };
  setManoeuvre = (manoeuvre: IManoeuvre): void => {
    this.#manoeuvre = manoeuvre;
  };
  setCar = (car: ICar): void => {
    this.#car = car;
  };
  setStreet = (street: IStreet): void => {
    this.#street = street;
  };
  setStopMoveCalled = (stopMove$: Observable<boolean>): void => {
    this.#stopMoveCalled$ = stopMove$;
  };

  setButton = (name: TButtonNames, button: IButton): void => {
    this.#buttons.set(name, button);
  };
  getButton = (name: TButtonNames): IButton => this.#buttons.get(name);
}
