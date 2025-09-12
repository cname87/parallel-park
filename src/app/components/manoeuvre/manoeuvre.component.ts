import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
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
  ERunMode,
  EDistOut,
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
  manoeuvres: Array<[EManoeuvre | EDistOut, string]>;
  manoeuvreForm!: FormGroup;
  private manoeuvreInitialFormValue: IManoeuvreForm;
  private manoeuvre$!: Observable<EManoeuvre | EDistOut>;
  private manoeuvre!: IManoeuvre;
  public message = '';
  public hint = '';

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.manoeuvres = this.objects.parallelManoeuvres;
    this.manoeuvreInitialFormValue = {
      manoeuvre: this.manoeuvres[0][0],
    };
  }

  ngOnInit(): void {
    //
    this.manoeuvreForm = this.formBuilder.group(this.manoeuvreInitialFormValue);

    this.manoeuvre$ = this.manoeuvreForm.valueChanges.pipe(
      startWith(this.manoeuvreInitialFormValue),
      /* Note that the select group formControlName is 'manoeuvre' */
      map((manoeuvreFormValue: IManoeuvreForm) => manoeuvreFormValue.manoeuvre),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.manoeuvre = {
      manoeuvreForm: this.manoeuvreForm,
      manoeuvre$: this.manoeuvre$,
    };
    this.data.setManoeuvre(this.manoeuvre);

    /* Combined subscription for both parking mode and run mode */
    combineLatest([
      this.data.getParkMode().parkMode$,
      this.data.getRunMode().runMode$,
    ]).subscribe(([parkMode, runMode]: [EParkMode, ERunMode]) => {
      // Handle parkMode changes
      if (runMode === ERunMode.Single) {
        if (parkMode === EParkMode.Parallel) {
          this.manoeuvres = this.objects.parallelManoeuvres;
          this.manoeuvreForm.setValue({
            manoeuvre: this.manoeuvres[0][0],
          });
          this.message = 'Select a manoeuvre';
          this.hint = 'The set of possible parking manoeuvres';
        } else if (parkMode === EParkMode.Bay) {
          this.manoeuvres = this.objects.bayManoeuvres;
          this.manoeuvreForm.setValue({ manoeuvre: this.manoeuvres[0][0] });
          this.message = 'Select a manoeuvre';
          this.hint = 'The set of possible parking manoeuvres';
        }
      } else if (runMode === ERunMode.Keyboard) {
        console.log('Setting distances out');
        this.manoeuvres = this.objects.distancesOut;
        this.manoeuvreForm.setValue({
          manoeuvre: this.manoeuvres[0][0],
        });
        this.message = 'Select a distance out from the parked car';
        this.hint = 'The set of possible distances out from the parked car';
      }
    });
  }
}
