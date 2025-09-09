import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  takeUntil,
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
export class StreetComponent implements OnInit, OnDestroy {
  streets: Array<[EStreet, string]>;
  streetForm!: FormGroup;
  /* Note that the select group formControlName is 'street' */
  private streetInitialFormValue!: IStreetForm;
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
    this.streetInitialFormValue = {
      street: this.streets[0][0],
    };
  }

  ngOnInit(): void {
    // 1. Build form.
    this.streetForm = this.formBuilder.group(this.streetInitialFormValue);

    // 2. Create observable pipeline BEFORE any programmatic setValue calls.
    this.street$ = this.streetForm.valueChanges.pipe(
      startWith(this.streetInitialFormValue),
      map((streetFormValue: IStreetForm) => streetFormValue.street),
      distinctUntilChanged(),
      shareReplay(1),
    );

    // 3. Register (form observable) struct with data service early.
    this.street = {
      streetForm: this.streetForm,
      street$: this.street$,
    };
    this.data.setStreet(this.street);

    // 4. React to park mode changes.
    this.data
      .getParkMode()
      .parkMode$.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value: EParkMode) => {
        if (value === EParkMode.Parallel) {
          this.streets = this.objects.parallelStreets;
          const newVal = EStreet.Width_1904mm;
          this.message = 'Select a front car width';
          this.hint = 'The set of available front car widths';
          this.setStreetIfDifferent(newVal);
        } else if (value === EParkMode.Bay) {
          this.streets = this.objects.bayStreets;
          // This will now emit through valueChanges because pipeline already exists.
          const newVal = EStreet.Bay_2400mm;
          this.message = 'Select a bay width';
          this.hint = 'The set of available bay widths';
          this.setStreetIfDifferent(newVal);
        }
      });
  }

  private setStreetIfDifferent(newStreet: EStreet) {
    const current = (this.streetForm.value as IStreetForm).street;
    if (current !== newStreet) {
      // Default emitEvent is true; explicit for clarity.
      this.streetForm.setValue({ street: newStreet }, { emitEvent: true });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
