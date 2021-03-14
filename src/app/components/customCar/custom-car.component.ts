import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import {
  startWith,
  shareReplay,
  map,
  filter,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import {
  ECar,
  ICustomCar,
  ICustomCarForm,
  TCarSetup,
} from '../../shared/types';
import { ConfigService } from '../../services/config.service';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';
import { StdErrorStateMatcher } from '../../shared/utilities';

/**
 * Displays the custom car form.
 */

@Component({
  selector: 'app-custom-car',
  templateUrl: './custom-car.component.html',
  styleUrls: ['./custom-car.component.scss'],
})
export class CustomCarComponent {
  customCarForm!: FormGroup;
  #customCarInitialFormValue: ICustomCarForm;
  #customCar$!: Observable<TCarSetup>;
  minTurningRadius$!: Observable<number>;
  #customCar!: ICustomCar;

  private _minTurningRadius: number;
  public get minTurningRadius(): number {
    return this._minTurningRadius;
  }
  public set minTurningRadius(value: number) {
    value = Math.max(this.config.minTurningRadiusAllowed, value);
    value = Math.min(this.maxTurningRadius, value);
    this._minTurningRadius = value;
  }
  readonly maxTurningRadius: number;
  readonly minWheelBase: number;
  readonly maxWheelBase: number;
  readonly minFrontOverhang: number;
  readonly maxFrontOverhang: number;
  readonly minRearOverhang: number;
  readonly maxRearOverhang: number;
  readonly minWidth: number;
  readonly maxWidth: number;

  constructor(
    private config: ConfigService,
    private data: DataService,
    private fb: FormBuilder,
    private objects: ObjectsService,
  ) {
    this.minWheelBase = this.config.minWheelbaseForm;
    this.maxWheelBase = this.config.maxWheelbaseForm;
    this._minTurningRadius = this.config.minTurningRadiusForm;
    this.maxTurningRadius = this.config.maxTurningRadiusForm;
    this.minWidth = this.config.minWidthForm;
    this.maxWidth = this.config.maxWidthForm;
    this.minFrontOverhang = this.config.minFrontOverhangForm;
    this.maxFrontOverhang = this.config.maxFrontOverhangForm;
    this.minRearOverhang = this.config.minRearOverhangForm;
    this.maxRearOverhang = this.config.maxRearOverhangForm;

    /* Read initial form value from objects database */
    this.#customCarInitialFormValue = {
      minTurningRadius: this.objects.Custom_Car.minTurningRadius,
      wheelbase: this.objects.Custom_Car.wheelbase,
      width:
        this.objects.Custom_Car.wheelToWheelWidth +
        2 * this.objects.Custom_Car.sideOverhang,
      frontOverhang: this.objects.Custom_Car.frontOverhang,
      rearOverhang: this.objects.Custom_Car.rearOverhang,
    };

    /**
     * Marks the minTurningRadius invalid if the value of minTurningRadius, wheelbase and frontOverhang is such that a steering wheel angle of great than a determined limit is returned. Otherwise it clears the errors on that field.
     *
     * @remarks
     * Avoids the inconsistency that would result from high steering wheel angles.
     *
     * @param control - The custom car form FormGroup.
     */
    const turningRadiusValidator: ValidatorFn = (
      control: AbstractControl,
    ): ValidationErrors | null => {
      const wheelbase = control.get('wheelbase')?.value;
      const frontOverhang = control.get('frontOverhang')?.value;
      const minTurningRadiusControl = control.get('minTurningRadius');
      const minTurningRadius = minTurningRadiusControl?.value;
      const wheelAngle =
        Math.asin((wheelbase + frontOverhang) / minTurningRadius) *
        this.config.RAD_TO_DEG;
      /* Compare with a maximum wheel angle as the calculations are inconsistent for high steering angles */
      if (
        (!wheelAngle || wheelAngle > this.config.maxWheelAngleAllowed) &&
        minTurningRadius !== this.maxTurningRadius
      ) {
        minTurningRadiusControl?.setErrors({ badTurningRadius: true });
      } else {
        minTurningRadiusControl?.setErrors(null);
      }
      return null;
    };

    this.customCarForm = this.fb.group(
      {
        minTurningRadius: [
          this.#customCarInitialFormValue.minTurningRadius,
          [
            Validators.required,
            Validators.min(this.minTurningRadius),
            Validators.max(this.maxTurningRadius),
          ],
        ],
        wheelbase: [
          this.#customCarInitialFormValue.wheelbase,
          [
            Validators.required,
            Validators.min(this.minWheelBase),
            Validators.max(this.maxWheelBase),
          ],
        ],
        width: [
          this.#customCarInitialFormValue.width,
          [
            Validators.required,
            Validators.min(this.minWidth),
            Validators.max(this.maxWidth),
          ],
        ],
        frontOverhang: [
          this.#customCarInitialFormValue.frontOverhang,
          [
            Validators.required,
            Validators.min(this.minFrontOverhang),
            Validators.max(this.maxFrontOverhang),
          ],
        ],
        rearOverhang: [
          this.#customCarInitialFormValue.rearOverhang,
          [
            Validators.required,
            Validators.min(this.minRearOverhang),
            Validators.max(this.maxRearOverhang),
          ],
        ],
      },
      { validators: turningRadiusValidator },
    );

    this.#customCar$ = this.customCarForm.valueChanges.pipe(
      startWith(this.#customCarInitialFormValue),
      tap((car) => {
        this.minTurningRadius = Math.ceil(
          (car.wheelbase + car.frontOverhang) / Math.sin(Math.PI / 4),
        );
        this.minTurningRadius$ = of(this.minTurningRadius);
      }),
      filter(() => {
        return this.customCarForm.valid;
      }),
      /* Convert to a full car object */
      map((carForm: ICustomCarForm) => {
        const sideOverhangRatio =
          this.objects.Custom_Car.sideOverhang /
          (this.objects.Custom_Car.sideOverhang * 2 +
            this.objects.Custom_Car.wheelToWheelWidth);
        const sideOverhang = carForm.width * sideOverhangRatio;
        const wheelLengthRatio =
          this.objects.Custom_Car.wheelLength /
          (this.objects.Custom_Car.wheelbase +
            this.objects.Custom_Car.frontOverhang +
            this.objects.Custom_Car.rearOverhang);
        const wheelLength =
          (carForm.wheelbase + carForm.frontOverhang + carForm.rearOverhang) *
          wheelLengthRatio;
        const wheelWidthRatio =
          this.objects.Custom_Car.wheelWidth /
          (this.objects.Custom_Car.wheelToWheelWidth +
            2 * this.objects.Custom_Car.sideOverhang);
        const wheelWidth = carForm.width * wheelWidthRatio;
        const result: TCarSetup = {
          name: ECar.Custom_Car,
          ...carForm,
          sideOverhang,
          wheelToWheelWidth: carForm.width - 2 * sideOverhang,
          wheelLength,
          wheelWidth,
        };
        return result;
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.#customCar = {
      customCarForm: this.customCarForm,
      customCar$: this.#customCar$,
    };
    this.data.setCustomCar(this.#customCar);

    /* Store the updated form detail in the Custom Car object. The car detail parameter values are accessed from the objects service when drawing the street or calculating the moves. */
    this.#customCar$.subscribe((car) => {
      this.objects.Custom_Car = car;
    });
  }

  matcher = new StdErrorStateMatcher();
}
