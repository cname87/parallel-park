import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  takeUntil,
} from 'rxjs/operators';
import {
  EParkMode,
  EStreet,
  IStreet,
  IStreetForm,
  ERunMode,
} from '../../shared/types';
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
  ],
})
export class StreetComponent implements OnInit, OnDestroy {
  /* Set the form field names as constants */
  readonly FORM_FIELD_NAMES = {
    street: 'street' as const,
  } as const;

  streets: Array<[EStreet, string]>;
  streetForm!: FormGroup;
  /* Note that the select group formControlName is 'street' */
  private parallelStreetInitialValue!: IStreetForm;
  private bayStreetInitialValue!: IStreetForm;
  private street$!: Observable<EStreet>;
  private street!: IStreet;
  public message = '';
  public hint = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.streets = this.objects.parallelStreets;
    /* Note that the select group formControlName is 'street' */
    this.parallelStreetInitialValue = {
      street: EStreet.Width_1904mm,
    };
    this.bayStreetInitialValue = {
      /* I measured 2400mm in Park West */
      street: EStreet.Bay_2400mm,
    };
  }

  private setStreetIfDifferent(newStreet: EStreet) {
    const current = (this.streetForm.value as IStreetForm).street;
    if (current !== newStreet) {
      this.streetForm.setValue(
        { [this.FORM_FIELD_NAMES.street]: newStreet },
        { emitEvent: true },
      );
    }
  }

  ngOnInit(): void {
    this.streetForm = this.formBuilder.group(this.parallelStreetInitialValue);

    this.street$ = this.streetForm.valueChanges.pipe(
      startWith(this.parallelStreetInitialValue),
      map((streetFormValue: IStreetForm) => streetFormValue.street),
      distinctUntilChanged(),
      shareReplay(1),
    );

    this.street = {
      streetForm: this.streetForm,
      street$: this.street$,
    };
    this.data.setStreet(this.street);

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
            this.streets = this.objects.parallelStreets;
            this.setStreetIfDifferent(this.parallelStreetInitialValue.street);
            this.message = 'Select a front car width';
            this.hint = 'The set of possible front car widths';
          } else if (parkMode === EParkMode.Bay) {
            this.streets = this.objects.bayStreets;
            this.setStreetIfDifferent(this.bayStreetInitialValue.street);
            this.message = 'Select a bay width';
            this.hint = 'The set of possible bay widths';
          }
          /* Or handle keyboard mode */
        } else if (runMode === ERunMode.Keyboard) {
          if (parkMode === EParkMode.Parallel) {
            this.streets = this.objects.parallelSpaces;
            this.setStreetIfDifferent(this.parallelStreetInitialValue.street);
            this.message = 'Select a front car width and parking space length';
            this.hint =
              'The set of possible front car widths / parking space lengths';
          } else if (parkMode === EParkMode.Bay) {
            this.streets = this.objects.bayStreets;
            this.setStreetIfDifferent(this.bayStreetInitialValue.street);
            this.message = 'Select a bay width';
            this.hint = 'The set of possible bay widths';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
