import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
} from 'rxjs/operators';
import { EMode, EStreet, IStreet, IStreetForm } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';

/**
 * Displays the street selection menu.
 */
@Component({
  selector: 'app-street',
  templateUrl: './street.component.html',
  styleUrls: ['./street.component.scss'],
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
export class StreetComponent implements OnInit {
  streets: Array<[EStreet, string]>;
  streetForm!: FormGroup;
  /* Note that the select group formControlName is 'street' */
  #streetInitialFormValue!: IStreetForm;
  #street$!: Observable<EStreet>;
  #street!: IStreet;
  hint = '';

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.streets = this.objects.streets;
    /* Note that the select group formControlName is 'street' */
    this.#streetInitialFormValue = {
      street: EStreet.Width_1904mm,
    };
  }

  ngOnInit(): void {
    this.streetForm = this.formBuilder.group(this.#streetInitialFormValue);
    this.#street$ = this.streetForm.valueChanges.pipe(
      startWith(this.#streetInitialFormValue),
      map((streetFormValue: IStreetForm) => streetFormValue.street),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.#street = {
      streetForm: this.streetForm,
      street$: this.#street$,
    };
    this.data.setStreet(this.#street);

    /* Customise input heading and hint messages */
    this.data.getMode().mode$.subscribe((value: EMode) => {
      if (value === EMode.Keyboard) {
        this.hint = "Select 'Custom' to set up a custom parking space length";
      } else {
        this.hint = "Select 'Custom' to set up custom street dimensions";
      }
    });
  }
}
