import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatHint, MatLabel, MatError } from '@angular/material/form-field';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
} from 'rxjs/operators';
import { ECar, ICar, ICarForm } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';

/**
 * Displays the car selection menu.
 */
@Component({
  selector: 'app-car',
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.scss'],
    standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    // MatHint, MatLabel, MatError are included via MatFormFieldModule in recent Angular Material versions
  ],
})
export class CarComponent implements OnInit {
  cars: Array<[ECar, string]>;
  carForm!: FormGroup;
  #carInitialFormValue: ICarForm;
  #car$!: Observable<ECar>;
  #car!: ICar;

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.cars = this.objects.cars;
    /* Note that the select group formControlName is 'car' */
    this.#carInitialFormValue = {
      car: ECar.VW_T5_LWB_Van_2005,
    };
  }

  ngOnInit(): void {
    this.carForm = this.formBuilder.group(this.#carInitialFormValue);
    this.#car$ = this.carForm.valueChanges.pipe(
      startWith(this.#carInitialFormValue),
      map((carFormValue: ICarForm) => carFormValue.car),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.#car = {
      carForm: this.carForm,
      car$: this.#car$,
    };
    this.data.setCar(this.#car);
  }
}
