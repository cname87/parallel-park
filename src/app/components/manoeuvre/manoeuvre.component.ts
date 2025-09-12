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
import {
  EManoeuvre,
  IManoeuvre,
  IManoeuvreForm,
  EParkMode,
} from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';

/**
 * Displays the manoeuvre menu.
 */

@Component({
  selector: 'app-manoeuvre',
  templateUrl: './manoeuvre.component.html',
  styleUrls: ['./manoeuvre.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class ManoeuvreComponent implements OnInit {
  manoeuvres: Array<[EManoeuvre, string]>;
  manoeuvreForm!: FormGroup;
  private manoeuvreInitialFormValue: IManoeuvreForm;
  private manoeuvre$!: Observable<EManoeuvre>;
  private manoeuvre!: IManoeuvre;
  public message = '';
  public hint = '';

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.manoeuvres = this.objects.parallelManoeuvres;
    /* Note that the select group formControlName is 'manoeuvre' */
    this.manoeuvreInitialFormValue = {
      manoeuvre: this.manoeuvres[0][0],
    };
  }

  ngOnInit(): void {
    //
    this.manoeuvreForm = this.formBuilder.group(this.manoeuvreInitialFormValue);

    this.manoeuvre$ = this.manoeuvreForm.valueChanges.pipe(
      startWith(this.manoeuvreInitialFormValue),
      map((manoeuvreFormValue: IManoeuvreForm) => manoeuvreFormValue.manoeuvre),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.manoeuvre = {
      manoeuvreForm: this.manoeuvreForm,
      manoeuvre$: this.manoeuvre$,
      manoeuvreInitialFormValue: this.manoeuvreInitialFormValue,
    };
    this.data.setManoeuvre(this.manoeuvre);

    /* Initialise dependent on the parking mode - parallel parking or bay parking */
    this.data.getParkMode().parkMode$.subscribe((value: EParkMode) => {
      if (value === EParkMode.Parallel) {
        this.manoeuvres = this.objects.parallelManoeuvres;
        this.manoeuvreForm.setValue({ manoeuvre: EManoeuvre.Park4UsingRules1 });
        this.message = 'Select a manoeuvre';
        this.hint = 'The set of possible parking manoeuvres';
      } else if (value === EParkMode.Bay) {
        this.manoeuvres = this.objects.bayManoeuvres;
        this.manoeuvreForm.setValue({ manoeuvre: EManoeuvre.BayPark1 });
        this.message = 'Select a manoeuvre';
        this.hint = 'The set of possible parking manoeuvres';
      }
    });
  }
}
