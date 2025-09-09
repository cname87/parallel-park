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
import { EParkMode, EStreet, IStreet, IStreetForm } from '../../shared/types';
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
  private streetInitialFormValue!: IStreetForm;
  private street$!: Observable<EStreet>;
  private street!: IStreet;
  public message = '';
  public hint = '';

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.streets = this.objects.parallelStreets;
    /* Note that the select group formControlName is 'street' */
    this.streetInitialFormValue = {
      street: this.streets[0][0],
    };
  }

  ngOnInit(): void {
    //
    this.streetForm = this.formBuilder.group(this.streetInitialFormValue);
    /* Initialise dependent on the parking mode - parallel parking or bay parking */
    this.data.getParkMode().parkMode$.subscribe((value: EParkMode) => {
      if (value === EParkMode.Parallel) {
        this.streets = this.objects.parallelStreets;
        this.streetForm.setValue({ street: EStreet.Width_1904mm });
        this.message = 'Select a front car width';
        this.hint = 'The set of available front car widths';
      } else if (value === EParkMode.Bay) {
        this.streets = this.objects.bayStreets;
        this.streetForm.setValue({ street: EStreet.Bay_2400mm });
        this.message = 'Select a bay width';
        this.hint = 'The set of available bay widths';
      }
    });

    this.street$ = this.streetForm.valueChanges.pipe(
      startWith(this.streetInitialFormValue),
      map((streetFormValue: IStreetForm) => streetFormValue.street),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.street = {
      streetForm: this.streetForm,
      street$: this.street$,
    };
    this.data.setStreet(this.street);
  }
}
