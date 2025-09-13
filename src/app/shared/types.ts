import { FormGroup } from '@angular/forms';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { CarService } from '../services/car.service';
import { StreetService } from '../services/street.service';
import { ConfigService } from '../services/config.service';

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

export const enum ERunMode {
  Automated = 'Automated',
  Keyboard = 'Keyboard',
}

export const enum EParkMode {
  Parallel = 'Parallel',
  Bay = 'Bay',
}

export interface IRunModeForm {
  runMode: ERunMode;
}

export interface IParkModeForm {
  parkMode: EParkMode;
}

export interface IRunMode {
  modeForm: FormGroup;
  runMode$: Observable<ERunMode>;
}

export interface IParkMode {
  modeForm: FormGroup;
  parkMode$: Observable<EParkMode>;
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
  manoeuvre: EManoeuvre | EDistOut;
}

export interface IPark {
  readonly parkingSpaceLength: number;
  readonly startPosition: TPoint;
  readonly movie: TMovie;
}

export interface IManoeuvre {
  manoeuvreForm: FormGroup;
  manoeuvre$: Observable<EManoeuvre | EDistOut>;
}

export interface IParams {
  manoeuvre: EManoeuvre | EDistOut;
  street: StreetService;
  car: CarService;
  config: ConfigService;
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
  name: EStreet;
  type: 'parallel' | 'bay';
  rearCarFromLeft: number;
  rearCarFromTop: number;
  rearCarLength: number;
  rearCarWidth: number;
  parkingSpaceLength: number;
  frontCarFromLeft: () => number;
  frontCarFromTop: () => number;
  frontCarLength: number;
  frontCarWidth: number;
  carFromKerb: number;
  safetyGap: number;
};

export type TDistOut = {
  name: EDistOut;
  distance: number;
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
export type TSteeringAngle = ELock | number;

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

/* The manoeuvres are either automated (i.e. calculated optimally by the program) or manual (i.e. set by the user), or using rules (i.e. using rules and collision conditions rather than optimally calculated or manually set angles and distances) */
/* NOTE:  Park4UsingRules1 is the key manoeuvre used for testing and coming up with an algorithm for parking. See the rules service file for detail on the rules used. */
export const enum EManoeuvre {
  /* Automated / 2 rotations / 1 straight reverse
  - Reverse, rotate out by a minimum angle, then reverse straight, and then rotate in to parked */
  Park2Rotate1StraightMinAngle = 'Park2Rotate1StraightMinAngle',
  /* Automated / 2 rotations / no straight reverse
  - Reverse, then rotate out, then rotate in to parked with no straight reverse */
  Park2Rotate0Straight = 'Park2Rotate0Straight',
  /* Automated / Fixed start position / 2 rotations / 1 straight reverse
  - Start from a fixed position, then rotate out, reverse, and rotate in to
  parked */
  Park2Rotate1StraightFixedStart = 'Park2Rotate1StraightFixedStart',
  /* Manual / 2 rotations / 1 straight reverse
  - Reverse to a given position, rotate out by a given angle, reverse by a
  given amount, and then rotate in to parked */
  Park2Rotate1StraightSetManual = 'Park2Rotate1StraightSetManual',
  /* Automated / 3 rotations / 1 straight reverse
  - Reverse, rotate out, reverse straight, rotate in until the car hits the
  rear car, and then rotate in and forward to parked */
  Park3Rotate1StraightMinAngle = 'Park3Rotate1StraightMinAngle',
  /* Using Rules / Up to 4 rotations / 1 straight reverse
  /* Rotate in using rules and collision conditions rather than optimally
  calculated or manually set angles and distances */
  Park4UsingRules1 = 'Park4UsingRules1',
  /* Using Rules / Up to 4 rotations / 1 straight reverse
  /* Rotate in using rules and collision conditions rather than optimally
  calculated or manually set angles and distances */
  Park4UsingRules2 = 'Park4UsingRules2',
  /* Bay parking manoeuvre */
  BayPark1 = 'BayPark1',
}

export const enum EStreet {
  Width_1904mm = 'Width_1904mm',
  Width_1795mm = 'Width_1795mm',
  Width_1852mm = 'Width_1852mm',
  Width_1595mm = 'Width_1595mm',
  Width_2073mm = 'Width_2073mm',
  Width_2426mm = 'Width_2426mm',
  Custom_Street = 'Custom_Street',
  Bay_2400mm = 'Bay_2400mm',
  Bay_2200mm = 'Bay_2200mm',
}

export const enum EDistOut {
  Out_100mm = 'Out_100mm',
  Out_200mm = 'Out_200mm',
  Out_300mm = 'Out_300mm',
  Out_400mm = 'Out_400mm',
  Out_500mm = 'Out_500mm',
  Out_600mm = 'Out_600mm',
  Out_700mm = 'Out_700mm',
  Out_800mm = 'Out_800mm',
  Out_900mm = 'Out_900mm',
  Out_1000mm = 'Out_1000mm',
  Out_1100mm = 'Out_1100mm',
  Out_1200mm = 'Out_1200mm',
  Out_1300mm = 'Out_1300mm',
  Out_1400mm = 'Out_1400mm',
  Out_1500mm = 'Out_1500mm',
  Out_1600mm = 'Out_1600mm',
  Out_1700mm = 'Out_1700mm',
  Out_1800mm = 'Out_1800mm',
  Out_1900mm = 'Out_1900mm',
  Out_2000mm = 'Out_2000mm',
}

export type TScenario = {
  manoeuvre: EManoeuvre;
  carSetup: ECar;
  streetSetup: EStreet;
};

export const enum EMoveType {
  MoveStraight = 'moveStraight',
  MoveArc = '  moveArc',
  Steer = 'steer',
}

export type TCondition = (car: CarService, tick?: unknown) => boolean;

export type TMoveStraight = {
  type: (car: CarService) => EMoveType.MoveStraight;
  fwdOrReverseFn: (car: CarService) => EDirection;
  deltaAngleFn?: (car: CarService) => number;
  deltaPositionFn: (car: CarService) => number;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TMoveArc = {
  type: (car: CarService) => EMoveType.MoveArc;
  fwdOrReverseFn: (car: CarService) => EDirection;
  deltaAngleFn: (car: CarService) => number;
  deltaPositionFn?: (car: CarService) => number;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TMoveStraightOrArc = {
  type: (carInUse: CarService) => EMoveType.MoveStraight | EMoveType.MoveArc;
  fwdOrReverseFn: (car: CarService) => EDirection;
  deltaAngleFn: (car: CarService) => number;
  deltaPositionFn: (car: CarService) => number;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TSteer = {
  type: (car: CarService) => EMoveType.Steer;
  steeringWheelAngle: TSteeringAngle;
  condition?: (car: CarService) => TCondition;
  message?: ISnackOpen;
  speed?: number;
};

export type TMove = TSteer | TMoveStraight | TMoveArc | TMoveStraightOrArc;

export type TMovie = {
  moveFirstSteer: TSteer;
  moveB: TMoveStraight;
  moveC: TSteer;
  moveD: TMoveArc;
  moveE: TSteer;
  moveF: TMoveStraight | TMoveArc;
  moveG: TSteer;
  moveH: TMoveArc;
  moveI: TSteer;
  moveJ: TMoveArc;
  moveK: TSteer;
  moveL: TMoveStraight | TMoveArc;
  moveM: TSteer;
  [key: string]: TSteer | TMoveStraight | TMoveArc;
};

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
