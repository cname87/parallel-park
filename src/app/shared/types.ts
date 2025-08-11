import { FormGroup } from '@angular/forms';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { CarService } from '../services/car.service';

export const enum EButtonStatus {
  NotClicked = 'NotClicked',
  Reset = 'Reset',
  Disabled = 'Disabled',
  Run = 'Run',
}
export type TButtonNames =
  | 'main'
  | 'forward'
  | 'reverse'
  | 'left'
  | 'center'
  | 'right'
  | 'start'
  | 'park';
export type TButtonLabels =
  | 'RUN'
  | 'Forward (f)'
  | 'Back (b)'
  | 'Left (l)'
  | 'Center (c)'
  | 'Right (r)'
  | 'Start (s)'
  | 'Park (p)';
export const enum EButtonLabels {
  Forward = 'f',
  Back = 'b',
  Left = 'l',
  Center = 'c',
  Right = 'r',
  Start = 's',
  Park = 'p',
}

export interface IButton {
  enableRun: () => void;
  enableReset: () => void;
  disable: () => void;
  buttonStatus$: Observable<EButtonStatus>;
  buttonLastClick$: Observable<EButtonStatus>;
}

export const enum EMode {
  Loop = 'Loop',
  Single = 'Single',
  Keyboard = 'Keyboard',
}

export interface IModeForm {
  mode: EMode;
}

export interface IMode {
  modeForm: FormGroup;
  mode$: Observable<EMode>;
}

export interface ICustomCarForm {
  minTurningRadius: number;
  wheelbase: number;
  width: number;
  frontOverhang: number;
  rearOverhang: number;
}

export interface ICustomCar {
  customCarForm: FormGroup | null;
  customCar$: Observable<TCarSetup>;
}

export interface ICustomStreetForm {
  frontCarWidth: number;
  distFromKerb: number;
  safetyGap: number;
  parkingSpace: number;
}

export interface ICustomStreet {
  customStreetForm: FormGroup | null;
  customStreet$: Observable<TStreetSetup>;
}

export interface IManoeuvreForm {
  manoeuvre: EManoeuvre;
}

export interface IManoeuvre {
  manoeuvreForm: FormGroup;
  manoeuvre$: Observable<EManoeuvre>;
  manoeuvreInitialFormValue: IManoeuvreForm;
}

export interface ICarForm {
  car: ECar;
}

export interface ICar {
  carForm: FormGroup;
  car$: Observable<ECar>;
}

export interface IStreetForm {
  street: EStreet;
}

export interface IStreet {
  streetForm: FormGroup;
  street$: Observable<EStreet>;
}

export type TPoint = { x: number; y: number };

/* The position of the car is defined by the x & y coordinates of the midpoint of the rear axle and the rotation of the car */
/* The x & y coordinates are in unscaled units and the angle is in radians */
export type TPosition = { point: TPoint; rotation: number };

export type TCarSetup = {
  name: ECar;
  rearOverhang: number;
  wheelbase: number;
  frontOverhang: number;
  wheelToWheelWidth: number;
  sideOverhang: number;
  wheelWidth: number;
  wheelLength: number;
  minTurningRadius: number;
};

export type TStreetSetup = {
  name: string;
  rearCarWidth: number;
  frontCarWidth: number;
  carFromKerb: number;
  safetyGap: number;
  parkingSpace: number;
};

/* Car is moving forward or in reverse */
export const enum EDirection {
  Reverse = -1,
  NoMove = 0,
  Forward = +1,
}

/* The lock on the steering wheel can be either counterclockwise (i.e. the steering wheel is fully rotated counterclockwise) or clockwise.  This is used in the TSteer type. */
export const enum ELock {
  Counterclockwise = -1,
  Center = 0,
  Clockwise = +1,
}

/* The steering wheel angle varies from -1 for a fully anticlockwise locked wheel to +1 for a fully clockwise locked wheel */
export type TSteerAngle = ELock | number;

/* The direction of rotation of the car.  This can be derived from the sign of the steering wheel angle number, which is typed by TSteer. */
export const enum ERotateDirection {
  Counterclockwise = -1,
  NoRotate = 0,
  Clockwise = +1,
}

export const enum ECar {
  VW_T5_LWB_Van_2005 = 'VW_T5_LWB_Van_2005',
  Mercedes_E_Estate_2020 = 'Mercedes_E_Estate_2020',
  Mercedes_C_Saloon_2020 = 'Mercedes_C_Saloon_2020',
  Hyundai_i30_2020 = 'Hyundai_i30_2020',
  Seat_Ibiza_2018 = 'Seat_Ibiza_2018',
  Hyundai_i10_2018 = 'Hyundai_i10_2018',
  Kia_Picanto_2020 = 'Kia_Picanto_2020',
  Custom_Car = 'Custom_Car',
  Fiat_Ducato_MWB_Van_2025 = 'Fiat_Ducato_MWB_Van_2025',
}

export const enum EManoeuvre {
  /* 2 rotations / no straight reverse
  - Reverse to where you can rotate out and then rotate in to parked */
  Park2Rotate0Straight = 'Park2Rotate0Straight',
  /* Fixed start position / 2 rotations / 1 straight reverse
  - Start from a fixed position, then rotate out, reverse, and rotate in to
  parked */
  Park2Rotate1StraightFixedStart = 'Park2Rotate1StraightFixedStart',
  /* 2 rotations / 1 straight reverse
  - Reverse to where you can rotate in so that the car left front corner
  touches the   front car rear outside corner (outside the minimum gap), and
  then rotate in to parked */
  Park2Rotate1StraightMinAngle = 'Park2Rotate1StraightMinAngle',
  /* 2 rotations / 1 straight reverse
  - Reverse to a given position, rotate in to a given angle, reverse by a given
  amount, and then rotate in to parked */
  Park2Rotate1StraightSetManual = 'Park2Rotate1StraightSetManual',
  /* Rotate in using rules and collision conditions rather than optimally calculated angles and distances - medium angle of approach */
  Park3UsingRulesMediumAngle = 'Park3UsingRulesMediumAngle',
  /* Rotate in using rules and collision conditions rather than optimally calculated angles and distances - mimimum angle of approach */
  Park3UsingRulesMinAngle = 'Park3UsingRulesMinAngle',
  /* 3 rotations / 1 straight reverse
  - Reverse to where you can rotate in so that the car left front corner
  touches the front car rear outside corner (outside the minimum gap), and then
  rotate in   so the car hits the back car, then rotate forward to parked */
  Park3Rotate1StraightMinAngle = 'Park3Rotate1StraightMinAngle',
}

export const enum EStreet {
  Width_1904mm = 'Width_1904mm',
  Width_1795mm = 'Width_1795mm',
  Width_1852mm = 'Width_1852mm',
  Width_1595mm = 'Width_1595mm',
  Width_2073mm = 'Width_2073mm',
  Width_2426mm = 'Width_2426mm',
  Custom_Street = 'Custom_Street',
}

export type TScenario = {
  manoeuvre: EManoeuvre;
  carSetup: ECar;
  streetSetup: EStreet;
};

export const enum EMoveType {
  MoveStraight = 'moveStraight',
  MoveArc = 'moveArc',
  Steer = 'steer',
}

export type TCondition = (car: CarService, tick?: unknown) => boolean;

export type TMoveStraight = {
  type: (car: CarService) => EMoveType.MoveStraight | EMoveType.MoveArc;
  fwdOrReverseFn: (car: CarService) => EDirection;
  deltaAngleFn?: (car: CarService) => number;
  deltaPositionFn: (car: CarService) => number;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TMoveArc = {
  type: (car: CarService) => EMoveType.MoveStraight | EMoveType.MoveArc;
  fwdOrReverseFn: (car: CarService) => EDirection;
  deltaAngleFn: (car: CarService) => number;
  deltaPositionFn?: (car: CarService) => number;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TSteer = {
  type: (car: CarService) => EMoveType.Steer;
  steeringWheelAngle: TSteerAngle;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TMove = TMoveStraight | TMoveArc | TSteer;

export enum LoggingLevel {
  TRACE,
  DEBUG,
  INFO,
  ERROR,
}

export interface ISnackOpen {
  message: string;
  snackConfig?: MatSnackBarConfig;
  pause?: boolean;
}
