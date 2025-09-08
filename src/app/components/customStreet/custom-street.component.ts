import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  startWith,
  shareReplay,
  map,
  filter,
  distinctUntilChanged,
} from 'rxjs/operators';
import {
  EMode,
  EStreet,
  ICustomStreet,
  ICustomStreetForm,
  TStreetSetup,
} from '../../shared/types';
import { ConfigService } from '../../services/config.service';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';
import { StdErrorStateMatcher } from '../../shared/utilities';

/**
 * * NOTE: 8-Sep-25: Not implemented yet. This component would need to be imported in the menu module to show the custom car form.
 */

/**
 * Displays the custom street form.
 */

@Component({
  selector: 'app-custom-street',
  templateUrl: './custom-street.component.html',
  styleUrls: ['./custom-street.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class CustomStreetComponent implements OnInit {
  customStreetForm!: FormGroup;
  #customStreetInitialFormValue: ICustomStreetForm;
  #customStreet$!: Observable<TStreetSetup>;
  #customStreet!: ICustomStreet;
  showParkingSpace = 'none';
  matcher = new StdErrorStateMatcher();
  minFrontCarWidth: number;
  maxFrontCarWidth: number;
  minDistFromKerb: number;
  maxDistFromKerb: number;
  minSafetyGap: number;
  maxSafetyGap: number;
  minParkingSpace: number;
  maxParkingSpace: number;

  constructor(
    private config: ConfigService,
    private data: DataService,
    private fb: FormBuilder,
    private objects: ObjectsService,
  ) {
    this.minSafetyGap = this.config.minSafetyGap;
    this.maxSafetyGap = this.config.maxSafetyGap;
    this.minFrontCarWidth = this.config.minFrontCarWidth;
    this.maxFrontCarWidth = this.config.maxFrontCarWidth;
    this.minDistFromKerb = this.config.minDistFromKerb;
    this.maxDistFromKerb = this.config.maxDistFromKerb;
    this.minParkingSpace = this.config.minParkingSpace;
    this.maxParkingSpace = this.config.maxParkingSpace;

    /* Read initial form value from objects database */
    this.#customStreetInitialFormValue = {
      frontCarWidth: this.objects.Custom_Street.frontCarWidth,
      distFromKerb: this.objects.Custom_Street.carFromKerb,
      safetyGap: this.objects.Custom_Street.safetyGap,
      parkingSpace: this.objects.Custom_Street.parkingSpace,
    };

    this.customStreetForm = this.fb.group({
      frontCarWidth: [
        this.#customStreetInitialFormValue.frontCarWidth,
        [
          Validators.required,
          Validators.min(this.minFrontCarWidth),
          Validators.max(this.maxFrontCarWidth),
        ],
      ],
      distFromKerb: [
        this.#customStreetInitialFormValue.distFromKerb,
        [
          Validators.required,
          Validators.min(this.minDistFromKerb),
          Validators.max(this.maxDistFromKerb),
        ],
      ],
      safetyGap: [
        this.#customStreetInitialFormValue.safetyGap,
        [
          Validators.required,
          Validators.min(this.minSafetyGap),
          Validators.max(this.maxSafetyGap),
        ],
      ],
      parkingSpace: [
        this.#customStreetInitialFormValue.parkingSpace,
        [
          Validators.required,
          Validators.min(this.minParkingSpace),
          Validators.max(this.maxParkingSpace),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.#customStreet$ = this.customStreetForm.valueChanges.pipe(
      startWith(this.#customStreetInitialFormValue),
      filter(() => {
        return this.customStreetForm.valid;
      }),
      /* Convert to a full street object */
      map((streetForm: ICustomStreetForm) => {
        const result: TStreetSetup = {
          name: EStreet.Custom_Street,
          rearCarWidth: streetForm.frontCarWidth,
          frontCarWidth: streetForm.frontCarWidth,
          carFromKerb: streetForm.distFromKerb,
          safetyGap: streetForm.safetyGap,
          parkingSpace: streetForm.parkingSpace,
        };
        return result;
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.#customStreet = {
      customStreetForm: this.customStreetForm,
      customStreet$: this.#customStreet$,
    };
    this.data.setCustomStreet(this.#customStreet);

    /* Store the updated form value in the Custom Street object */
    this.#customStreet$.subscribe((street) => {
      this.objects.Custom_Street = street;
    });

    this.data.getMode().mode$.subscribe((value: EMode) => {
      if (value === EMode.Keyboard) {
        this.customStreetForm.controls['parkingSpace'].enable();
      } else {
        this.customStreetForm.controls['parkingSpace'].disable();
        /* Clear parking space length whenever field is disabled */
        this.customStreetForm.get('parkingSpace')?.setValue('0');
      }
    });
  }
}
