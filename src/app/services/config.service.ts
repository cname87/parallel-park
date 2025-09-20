import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Stage } from 'createjs-module';
import { LoggingLevel, TButtonLabels, TButtonNames } from '../shared/types';

/**
 * Provides configuration constants.
 */

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  //

  /**
   * * Debug Settings
   */

  /* This sets the logging level used - set to Error unless debugging */
  loggingLevel = LoggingLevel.DEBUG;

  /**
   * * Dimensions
   *
   * Canvas Dimensions are set in index.html:
   * - Set width to 800 pixels and height to 600 pixels.
   * The canvas width represents 16m actual distance so therefore each pixel represents 16000 / 800 = 20mm.
   * The canvas height represents 12m actual distance so therefore each pixel represents 12000 / 600 = 20mm.
   * Because distances are input in mm, and each pixel equals 20mm, the factor to scale input distances in mm to pixels is 20.
   * Also print a grid with a grid scale of 5, i.e. each small grid box represents 5 pixels x 5 pixels, or 0.1m x 0,1.m, and each large grid box, which is 10 x 10 small boxes, represents 1m x 1m.
   * Run all animations at 100 frames per minute.
   */

  canvas: HTMLCanvasElement;
  stage: Stage;
  canvasH: number;
  canvasW: number;
  distScale = 20;
  gridScale = 5;
  FPS = 100;

  /**
   * Default distances are expressed in real-world distances divided by the scaling factor. Thus, they can be entered with reference to real-world distances but they are stored in sacled distances.
   * Within the program all distances are scaled.
   */

  /* All street defaults */
  defaultStreetType: 'parallel' | 'bay' = 'parallel';
  defaultRearCarFromTop = 150 / this.distScale;
  defaultRearCarLength = 1000 / this.distScale;
  defaultRearCarWidth = 1904 / this.distScale;
  defaultRearCarFromLeft = 0 / this.distScale;
  defaultFrontCarFromLeft = 8000 / this.distScale;
  defaultFrontCarFromTop = 150 / this.distScale;
  defaultFrontCarLength = 5290 / this.distScale;
  defaultFrontCarWidth = 1904 / this.distScale;
  defaultCarFromKerb = 150 / this.distScale;
  /* Note: Do not exceed this.maxSafetyGap */
  defaultSafetyGap = 150 / this.distScale;

  /* The parking space gap */
  defaultExtraParkingSpace = 1500 / this.distScale;
  defaultParkingSpaceLength =
    this.defaultSafetyGap * 2 +
    this.defaultExtraParkingSpace +
    this.defaultFrontCarLength;

  /* All car size defaults */
  defaultRearOverhang = 996 / this.distScale;
  defaultWheelbase = 3400 / this.distScale;
  defaultFrontOverhang = 894 / this.distScale;
  defaultWheelToWheelWidth = 1628 / this.distScale;
  defaultSideOverhang = 138 / this.distScale;
  defaultWheelWidth = 215 / this.distScale;
  defaultWheelLength = 686 / this.distScale;
  defaultMinTurningRadius = 6600 / this.distScale;

  /* Car position defaults */
  defaultCarRearForwardFromRearOfFrontCar = 1000 / this.distScale;
  defaultCarOutFromSafetyOfFrontCar = 250 / this.distScale;
  defaultFrontStarboardCornerFromLeft =
    this.defaultRearCarFromLeft +
    this.defaultRearCarLength +
    this.defaultParkingSpaceLength +
    this.defaultCarRearForwardFromRearOfFrontCar +
    this.defaultRearOverhang +
    this.defaultWheelbase +
    this.defaultFrontOverhang;
  defaultCarOuterCornerStartFromPP = 1000 / this.distScale;
  /* Must be updated when front car width known */
  defaultFrontStarboardCornerFromTop =
    this.defaultCarFromKerb +
    this.defaultSideOverhang +
    this.defaultWheelToWheelWidth +
    this.defaultSideOverhang +
    this.defaultCarOutFromSafetyOfFrontCar;

  /* Limits */
  collisionBuffer = 1 / this.distScale;
  defaultMinFromKerb = 150 / this.distScale;
  maxLegalKerbGap = 500 / this.distScale;

  /**
   * * Car motion defaults
   */
  /* Straight move speed in scaled mm per second - measured 5m in ~8s */
  defaultSpeed = 675 / this.distScale;
  rampStart = 0.25; // Starting speed = defaultSpeed / rampStart
  rampTicks = 100; // Ramp up to full speed over rampTicks
  /* Time in milliseconds to turn the front wheel that is on the inner edge of the turning circle through 1 radian */
  /* Measured ~1.6 radians took 8s =>  5s per radian but using 3s as 5 too slow */
  msPerWheelRadian = 3.0;

  /**
   * * Utility functions
   */
  RAD_TO_DEG = 180 / Math.PI;
  DEG_TO_RAD = Math.PI / 180;
  round(n: number, places = 2): number {
    return Math.round(Math.pow(10, places) * n) / Math.pow(10, places);
  }

  /**
   * Custom car and street defaults and min/max for validators
   */
  minWheelbaseForm = 2300;
  maxWheelbaseForm = 3500;
  minTurningRadiusForm = 4500;
  maxTurningRadiusForm = 6800;
  minWidthForm = 1500;
  maxWidthForm = 2250;
  minFrontOverhangForm = 300;
  maxFrontOverhangForm = 1000;
  minRearOverhangForm = 300;
  maxRearOverhangForm = 1200;
  minSafetyGap = 50;
  maxSafetyGap = 350; // Limited by VW hitting right size of canvas
  minFrontCarWidth = 1565;
  maxFrontCarWidth = 2250;
  minDistFromKerb = 0;
  maxDistFromKerb = 250;
  /* Must be 0 as 0 is used to denote that a calculated value is used */
  minParkingSpace = 0;
  maxParkingSpace = 10000;
  /* Max wheel angle in degrees that avoids avoid calculation errors.  This is used to calculate allowable turning radii for a given wheelbase and front overhang. */
  maxWheelAngleAllowed = 45;
  /* Minimum allowed turning radius in mm calculated with wheelbase = 2300mm and front overhang = 300mm. */
  minTurningRadiusAllowed = 3677;

  /**
   * * Error constants
   */
  /* Distance from kerb above which a parking error is reported */
  errorDistFromKerb = 500 / this.distScale;
  /* Angle in rads above which an error is reported */
  errorParkAngle = 5 * this.DEG_TO_RAD;

  /**
   * * Information message duration on ms
   */
  infoMessageDuration = 2000;

  /**
   * * Manual mode run text for all buttons
   */
  manualModeRunTexts: Map<TButtonNames, TButtonLabels> = new Map([
    ['forward', 'Forward (f)'],
    ['reverse', 'Back (b)'],
    ['left', 'Left (l)'],
    ['center', 'Center (c)'],
    ['right', 'Right (r)'],
    ['start', 'Start (s)'],
  ]);
  /* All button texts in a cloned Map */
  allButtonTexts = new Map(this.manualModeRunTexts).set('main', 'RUN');

  /* Default distance from manoeuvre start position for keyboard mode */
  defaultKeyboardModeStartDistFromRearToPivot = 1000;

  /* Distances in mm for the setManual manoeuvre */
  setManualExtraParkingSpace = 2000;
  setManualMinKerbDistance = this.defaultCarFromKerb;
  setManualFirstTurnAngle = 25.0; // degrees
  setManualStartDistFromRearToPivot = 600;
  setManualStartDistSideToPivot = 250;

  constructor(@Inject(DOCUMENT) private document: Document) {
    /* Read canvas from index.html */
    this.canvas = this.document.getElementById('canvas') as HTMLCanvasElement;
    this.stage = new Stage(this.canvas);
    this.canvasH = this.canvas?.height;
    this.canvasW = this.canvas?.width;
  }
}
