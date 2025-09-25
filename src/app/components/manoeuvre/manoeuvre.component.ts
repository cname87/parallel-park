import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, combineLatest, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  takeUntil,
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
 Displays the manoeuvre menu. The manoeuvre menu can contain either a set of parking manoeuvres (for automated run mode) or a set of start distances out from the parked car (for keyboard run mode).
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
export class ManoeuvreComponent implements OnInit, OnDestroy {
  /* Set the form field names as constants */
  readonly FORM_FIELD_NAMES = {
    manoeuvre: 'manoeuvre' as const,
  } as const;

  manoeuvres: Array<[EManoeuvre | EDistOut, string]>;
  manoeuvreForm!: FormGroup;
  private parallelManoeuvreInitialValue: IManoeuvreForm;
  private bayManoeuvreInitialValue: IManoeuvreForm;
  private keyManoeuvreInitialValue: IManoeuvreForm;
  private manoeuvre$!: Observable<EManoeuvre | EDistOut>;
  private manoeuvre!: IManoeuvre;
  public message = '';
  public hint = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    /* Initial values */
    this.manoeuvres = this.objects.parallelManoeuvres;
    this.parallelManoeuvreInitialValue = {
      [this.FORM_FIELD_NAMES.manoeuvre]:
        EManoeuvre.Park2Rotate1StraightMinAngle,
    };
    this.bayManoeuvreInitialValue = {
      [this.FORM_FIELD_NAMES.manoeuvre]: EManoeuvre.BayPark1,
    };
    this.keyManoeuvreInitialValue = {
      [this.FORM_FIELD_NAMES.manoeuvre]: EDistOut.Out_1000mm,
    };
  }

  ngOnInit(): void {
    /* Initialize the form */
    this.manoeuvreForm = this.formBuilder.group(
      this.parallelManoeuvreInitialValue,
    );

    this.manoeuvre$ = this.manoeuvreForm.valueChanges.pipe(
      startWith(this.parallelManoeuvreInitialValue),
      map(
        (manoeuvreFormValue: IManoeuvreForm) =>
          manoeuvreFormValue[this.FORM_FIELD_NAMES.manoeuvre],
      ),
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
    ])
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(([parkMode, runMode]: [EParkMode, ERunMode]) => {
        /* Handle parkMode changes */
        if (runMode === ERunMode.Automated) {
          if (parkMode === EParkMode.Parallel) {
            this.manoeuvres = this.objects.parallelManoeuvres;
            this.manoeuvreForm.setValue({
              [this.FORM_FIELD_NAMES.manoeuvre]:
                this.parallelManoeuvreInitialValue.manoeuvre,
            });
            this.message = 'Select a manoeuvre';
            this.hint = 'The set of possible parking manoeuvres';
          } else if (parkMode === EParkMode.Bay) {
            this.manoeuvres = this.objects.bayManoeuvres;
            this.manoeuvreForm.setValue({
              [this.FORM_FIELD_NAMES.manoeuvre]:
                this.bayManoeuvreInitialValue.manoeuvre,
            });
            this.message = 'Select a manoeuvre';
            this.hint = 'The set of possible parking manoeuvres';
          }
          /* Or handle keyboard mode */
        } else if (runMode === ERunMode.Keyboard) {
          this.manoeuvres = this.objects.distancesOut;
          this.manoeuvreForm.setValue({
            [this.FORM_FIELD_NAMES.manoeuvre]:
              this.keyManoeuvreInitialValue.manoeuvre,
          });
          this.message = 'Select a distance out from the parked car';
          this.hint = 'The set of possible distances out from the parked car';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
