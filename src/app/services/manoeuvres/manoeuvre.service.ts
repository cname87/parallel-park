import { Injectable } from '@angular/core';
import {
  TPoint,
  EDirection,
  EManoeuvre,
  ELock,
  EMoveType,
  TMoveStraight,
  TMove,
  TCondition,
  LoggingLevel,
  TMoveArc,
  TSteer,
} from '../../shared/types';
import { CarService } from '../car.service';
import { ConfigService } from '../config.service';
import { StreetService } from '../street.service';
import { CalculationService } from '../calculation.service';
import { LoggerService } from '../logger.service';
import { InformationService } from './information.service';

/**
 * @packageDocumentation
 *
 * * Description:
 * The getManoeuvre method is the entry point to the module. It gets an IParams
 * object and returns an IManoeuvre-type object - see descriptions below. The
 * values for each move in the movie object are calculated using the other
 * methods in this service.
 *
 *  * Glossary:
 * CoR: Center of Rotation. Each element of the car rotates in a circle around
 * this center point.
 * OC: The front corner of the car that is on the outer side of the turning
 * circle.
 * IC: The front corner of the car that is on the inner side of the turning
 * circle.
 * CA: The center of the rear axle of the car.
 * Rmin: Distance from the CoR to the OC at full steer angle. This is equal
 * to the minimum turning radius of the car.
 * PP: The outer corner of the parked front car (that faces the parking space),
 * with x and y values offset by the safety gap. This is the called the pivot
 * point, even though not all parking manoeuvres pivot from here.
 *
 * * Example Park3Rotate1StraightMinAngle manoeuvre
 * This parking manoeuvre is one where the car first moves straight back to a
 * pivot point, then turns in, moving back and swinging the front out
 * (first turn-in) , then goes straight back to a second pivot point, then
 * turns in, moving back and swinging the front in, then touches the rear car,
 * (backed off by the safety gap), and finally moves forward whilst turning in
 * to a parallel position. (The '3' refers to the 3 turning movements).
 *
 * getManoeuvre first calls getParkingSpace.
 *
 * For this specific manoeuvre, getExtraParkingSpace3Rotate is then called
 * which calls getCollisionAngle to get the collision angle which is needed to
 * calculate the parking space.
 *
 * getCollisionAngle returns the angle the car is at when it touches the rear
 * car. It uses a number of parameters including the kerb distance to calculate
 * the angle. It can't call getMinKerbDistance as that would create a loop so
 * an estimate for the kerb distance is used. See the notes in
 * getCollisionAngle for the estimate used.
 *
 * getManoeuvre then calls getStartPosition.
 *
 * This calls getPivot and getStartRelativePosition which in turn calls
 * getcarFromBumperMedToPivot and getCarSideToPivot. Both of these call
 * getFirstTurnAngle.
 *
 * For this specific manoeuvre, getFirstTurnAngle calls
 * getFirstTurnAngle3R1SMin. This calls getCollisionAngle and
 * gteMinKerbDistance.
 *
 * getMinKerbDistance calculates the minimum required kerb distance to avoid
 * the rear corner of the car swinging over the kerb. It needs to call
 * getCollisionAngle.
 *
 * getManoeuvre then calls getMinKerbDistance - see above.
 *
 * getManoeuvre returns a set of moves which are later called by the move service.
 * Each second move is a steering move, i.e. it just moves the steering wheel.
 * moveB calls getMoveDist1. This again calls getStartRelativePosition and
 * getcarFromBumperMedToPivot - see above.
 * moveD calls getMove2Angle which calls getFirstTurnAngle - see above.
 * moveF calls getMove3 which does not need to call other methods. It also calls
 * getmove3Condition which returns false.
 * moveH calls getMove4Angle. This subtracts getCollisionAngle from
 * getMove2Angle (see above). It also calls getMove4Condition which returns
 * false.
 * moveJ calls getMove5Angle which returns the collision angle by calling
 * getCollisionAngle.
 * moveL calls getMove6 which calls getExtraParkingSpace - see above.
 *
 * * Note on adding new move types
 *
 * See the final steer move, which is defined in getMove6, for the best way to
 * add new moves.  This set up is very flexible i.e. a number of different
 * moves types for different manoeuvres can be defined.
 */

/**
 * This parameter object is passed in by an external call to the getManoeuvre
 * function and is passed to all functions in this module.
 *
 * @typeParam IParams - Parameter for all functions in this module
 *
 * The properties are as follows:
 *
 * @param manoeuvre - The manoeuvre is passed in to define the parking
 * manoeuvre to be created.
 *
 * There are a number of manoeuvres:
 *
 * * Park Manoeuvres:
 * - Park2Rotate1StraightMinAngle: The car turns in, moves straight back so
 * the OC is at the PP (i.e. turn in angle is minimum), and then rotates back
 * to parallel in one turn.
 * - Park3Rotate1StraightMinAngle: The car turns in, moves straight back so
 * the OC is at the PP  (i.e. turn in angle is minimum), rotates back towards
 * parallel and then takes a 2nd rotation forward to parallel.
 * - Park2Rotate0Straight: The car turns in and then rotates back to parallel
 * without any straight move. The turn-in angle is large.
 * - Park2Rotate1StraightSetManual: The car turns in, moves straight back, and
 * then rotates back to parallel in one turn. The angle is set manually and is
 * greater than the minimum.
 * - Park3UsingRulesMediumAngle: Each move is not the result of an optimal
 * calculation but rather rules (e.g.: move back until corner is 400mm from the
 * kerb).
 *
 * @param street - The street instance being used
 * @param car - The car instance being used
 * @param config - The config instance with configuration data
 */
interface IParams {
  readonly manoeuvre: EManoeuvre;
  readonly street: StreetService;
  readonly car: CarService;
  readonly config: ConfigService;
}

/**
 * This object is returned by the module's public method and allows one
 * complete parking manoeuvre be drawn.
 *
 * @typeParam IManoeuvre - Manoeuvre object used to create one full parking
 * manoeuvre.
 *
 * The properties are as follows:
 *
 * @param parkingSpaceLength - The full length of the required parking space.
 * Used to set up the parking space required for the manoeuvre.
 * @param startPosition - The point coordinates of the car OC when the
 * manoeuvre starts. Used to set up the starting position of the car
 * @param minKerbDistance - The car should park this distance from the kerb.
 * This is only used for information printouts. That is, it is not used in any
 * manoeuvre calculations.
 * @param movie - The set of moves that are passed to the move service to draw
 * the manoeuvre.
 */
export interface IManoeuvre {
  readonly parkingSpaceLength: number;
  readonly startPosition: TPoint;
  readonly minKerbDistance: number;
  readonly movie: { [key: string]: TMove };
}

@Injectable({
  providedIn: 'root',
})
export class ManoeuvreService {
  //
  constructor(
    private calc: CalculationService,
    private logger: LoggerService,
    private info: InformationService,
  ) {}
  //
  /**
   * Returns the y-axis distance from the PP to the kerb.
   *
   * @remarks
   * The PP is offset from the kerb (y-axis) by the front car's distance from
   * kerb, its width, and the safety gap.
   * @returns The distance in scaled mm that the the PP is out from the kerb.
   *
   */
  private getPivotPointFromKerb = ({ street }: IParams): number => {
    this.logger.log(`getPivotPointFromKerb called`, LoggingLevel.TRACE);
    return street.carFromKerb + street.frontCarWidth + street.safetyGap;
  };

  /**
   * Returns the final turn-in angle for those manoeuvres that touch the rear
   * car at an angle.
   *
   * @remarks
   * This applies only to those manoeuvres where the car reverses back until it
   * touches the rear car before it is parallel and then rotates forward to the
   * parked position. This returns a shorter parking space than a manoeuvre
   * where the car rotates back all the way a parallel position.
   *
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   *
   * @returns The angle in radians that the the car is at when it touches the
   * rear parked car.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getCollisionAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getCollisionAngle called`, LoggingLevel.TRACE);

    /* arcsin(rb2 - rc2 - m2 / (2rc * (m2 + n2)**0.5)) + arctan(m/n) */
    const rb = car.farRearAxleSideTurningRadius(ELock.Counterclockwise);
    const rc =
      2 * car.farRearAxleSideTurningRadius(ELock.Counterclockwise) - car.width;
    /* The minimum distance to the kerb is required but you can't call
    getMinKerbDistance as it calls this getCollisionAngle method resulting in
    an infinite loop, so an estimate is made.
    If the estimated minimum kerb distance is bigger than the value returned by
    getMinKerbDistance then the car will cross the safety gap. Even if the
    safety gap is zero and the car collides with the rear car it will turn in
    and park albeit slightly off parallel.
    If the estimated minimum kerb distance is smaller than the value returned
    by getMinKerbDistance then the car will collide with the kerb and the
    parking parking attempt will fail.
    So go for a relatively large value e.g. 400mm.
    */
    const minKerbDistance = 400 / config.distScale;
    const m =
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
      minKerbDistance -
      car.width +
      street.carFromKerb +
      street.frontCarWidth +
      street.safetyGap;
    const n = car.rearAxleToFront;
    const numerator = Math.pow(rb, 2) - Math.pow(rc, 2) - Math.pow(m, 2);
    const denominator = 2 * rc * Math.sqrt(Math.pow(m, 2) + Math.pow(n, 2));
    const angle = Math.asin(numerator / denominator) + Math.atan(m / n);
    this.logger.log(`Collision angle: ${angle}`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return 0;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return angle;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns the extra parking space for certain manoeuvres.
   *
   * @remarks
   * This is used by all manoeuvres where the final pull-in is one turn, i.e.
   * the car does NOT touch the rear car (out by the safety gap) at an angle
   * and then execute the final pull-in.
   *
   * * Theory
   * Consider the car to be positioned with the OC to be at the PP.
   * Consider the triangle formed by:
   * - a line from the CoR to the OC (which is the minimum turning radius,
   * Rmin)
   * - a line from the CoR towards the position of the rear axle when the car
   * was parked parallel to the kerb before movement to a point offset from the
   * kerb by the same amount that the car outer corner is offset from the kerb
   * by the front car.
   * - a line from the PP parallel to the kerb which is equal to the distance
   * from the rear axle to the front car bumper + the extra parking space.
   *
   * @returns The extra parking space above safety gaps and the car length, in
   * scaled mm, for certain manoeuvres.
   */
  private getExtraParkingSpace2Rotate = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getExtraParkingSpace2Rotate called`, LoggingLevel.TRACE);
    const lineToCarCorner = Math.pow(car.minTurningRadius, 2);
    const centreOfRotationFromKerb =
      this.getMinKerbDistance({ manoeuvre, street, car, config }) +
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise);
    const pivotPointFromKerb = this.getPivotPointFromKerb({
      manoeuvre,
      street,
      car,
      config,
    });
    const lineTowardsRearAxle = Math.pow(
      centreOfRotationFromKerb - pivotPointFromKerb,
      2,
    );
    const lineAlongSideOfCar = Math.sqrt(lineToCarCorner - lineTowardsRearAxle);
    const extraParkingSpace = lineAlongSideOfCar - car.rearAxleToFront;
    return extraParkingSpace;
  };

  /**
   * Returns the extra parking space for certain manoeuvres.
   *
   * @remarks
   * This is used by the manoeuvre where the car touches the rear car (out by
   * the safety gap) at an angle and then executes the final pull-in, i.e.
   * where the pull-in consists of 2 turns.
   *
   * * Theory
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   *
   * @returns The extra parking space above safety gaps and the car length, in
   * scaled mm, for a particular manoeuvre.
   */
  private getExtraParkingSpace3Rotate = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getExtraParkingSpace3Rotate called`, LoggingLevel.TRACE);

    return (
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise) *
        Math.sin(this.getCollisionAngle({ manoeuvre, street, car, config })) -
      car.rearOverhang *
        (1 -
          Math.cos(this.getCollisionAngle({ manoeuvre, street, car, config })))
    );
  };

  /**
   * Returns the extra required parking space.
   *
   * @returns The extra parking space above safety gaps and the car length, in scaled mm.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getExtraParkingSpace = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getExtraParkingSpace called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return this.getExtraParkingSpace2Rotate({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getExtraParkingSpace3Rotate({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return this.getExtraParkingSpace3Rotate({
          manoeuvre,
          street,
          car,
          config,
        });
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns the total parking space.
   *
   * @remarks
   * Adds the fore and rear safety gaps and the car length to the extra car
   * space.
   *
   * @returns The parking space, in scaled mm, including safety gaps, car
   * length and the extra space required.
   */
  private getParkingSpace = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getParkingSpace called`, LoggingLevel.TRACE);

    let extraParkingSpace = 0;
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
        extraParkingSpace = this.getExtraParkingSpace({
          manoeuvre,
          street,
          car,
          config,
        });
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    const parkingSpace = 2 * street.safetyGap + car.length + extraParkingSpace;
    this.logger.log(`Parking space: ${parkingSpace}`, LoggingLevel.TRACE);
    return parkingSpace;
  };

  /**
   * Returns the first turn in angle for a particular manoeuvre.
   *
   * @remarks
   * * Theory
   * Consider the angle formed by the line from the CoR to the rear axle and
   * the line from the CoR to the OC when the car is parked parallel to the
   * kerb.
   * Consider the angle formed by the same first line but with the second line
   * moved to the position of the OC when the OC is at the PP.
   *
   * @returns The angle in radians of the first turn in for a particular
   * manoeuvre.
   */
  private getFirstTurnAngle2R1SMin = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getFirstTurnAngle2R1SMin called`, LoggingLevel.TRACE);
    /* Consider the angle formed by the by the line from the CoR to the rear
    axle but with the second line moved to the position of the OC when the OC
    is at the PP. */
    const angleYToPP = Math.asin(
      (car.rearAxleToFront +
        this.getExtraParkingSpace2Rotate({ manoeuvre, street, car, config })) /
        car.minTurningRadius,
    );
    /* Consider the angle formed by the line from the CoR to the rear axle and
    the line from the CoR to the OC when the car is parked parallel to the kerb. */
    const angleYToOCParked = Math.asin(
      car.rearAxleToFront / car.minTurningRadius,
    );
    /* The turn angle is the difference between these two angles. */
    return angleYToPP - angleYToOCParked;
  };

  /**
   * Returns the first turn in angle for a particular manoeuvre.
   *
   * @remarks
   * This applies to the manoeuvre requiring 2 final turn-ins (as opposed to
   * the 1 used by other manoeuvres).
   *
   * @returns The angle in radians of the first turn in for a particular
   * manoeuvre.
   */
  private getFirstTurnAngle3R1SMin = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getTurnAngle3R1SMin called`, LoggingLevel.TRACE);

    /* Calculate the angle between the vertical y-axis to a line from CoR to
    the PP.
    tan(angleYToPP) = (rc * Sin(alpha) + n) / (rc * Cos(alpha) - m) */
    const rc =
      2 * car.farRearAxleSideTurningRadius(ELock.Counterclockwise) - car.width;
    const alpha = this.getCollisionAngle({ manoeuvre, street, car, config });
    const m =
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
      this.getMinKerbDistance({ manoeuvre, street, car, config }) -
      car.width +
      street.carFromKerb +
      street.frontCarWidth +
      street.safetyGap;
    const n = car.rearAxleToFront;
    const angleYToPP = Math.atan(
      (rc * Math.sin(alpha) + n) / (rc * Math.cos(alpha) - m),
    );
    /* Consider the angle formed by the line from the CoR to the rear axle and
    the line from the CoR to the OC when the car is parked parallel to the
    kerb. */
    const angleYToOCParked = Math.asin(
      car.rearAxleToFront / car.minTurningRadius,
    );
    /* The turn angle is the difference between these two angles. */
    return angleYToPP - angleYToOCParked;
  };

  /**
   * Returns the first turn in angle for a particular manoeuvre.
   *
   * @returns The angle in radians of the first turn in for a particular
   * manoeuvre.
   */
  private getFirstTurnAngle2R0S = ({ street, car }: IParams): number => {
    this.logger.log(`getFirstTurnAngle2R0S called`, LoggingLevel.TRACE);
    /**
     * alpha = arccos((2r − (w + p)/2r)
     * r = Turning radius to midpoint of rear axle
     * w = width of front car
     * p = Ending y distance out from front car
     */
    const excessGapAboveSafety = street.safetyGap;
    return Math.acos(
      (2 * car.centerRearAxleTurningRadius(ELock.Counterclockwise) -
        (street.frontCarWidth + street.safetyGap + excessGapAboveSafety)) /
        (2 * car.centerRearAxleTurningRadius(ELock.Counterclockwise)),
    );
  };

  /**
   * Returns the first turn in angle for a particular manoeuvre.
   *
   * @returns The angle in radians of the first turn in for a particular
   * manoeuvre.
   * @throws Error
   * Thrown if the calculated angle is greater than 45 degrees or less than 0
   * degrees.
   */
  private getFirstTurnAngle2R1SMinFixedStart = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(
      `getFirstTurnAngle2R1SMinFixedStart called`,
      LoggingLevel.TRACE,
    );
    /* Solve 2 equations with two unknowns - angle (alpha) and straight
    distance moved (d3)...

    1. Car rear axle x position after movement + x-axis movement  = defined
    position of rear axle at start (opposite rear bumper of front car):

    street.rearCarCorner.x + street.safetyGap + car.rearOverhang +
    2 * car.centerRearAxleTurningRadius * Math.sin(alpha) +
    d3 * Math.cos(alpha) +
    = street.rearCarCorner.x + parkingSpaceLength

    2. Car side y position after movement + y-axis movement = defined position
    of side at start (an extra safety gap outside the front car safety gap):

    this.getMinKerbDistance +
    2 * car.centerRearAxleTurningRadius * (1 - Math.cos(alpha)) +
    d3 * Math.sin(alpha)
    = street.carFromKerb + street.frontCarWidth + street.safetyGap +
    excessSafetyGap

    Eliminate d3...
    1. d3 = (parkingSpaceLength - street.safetyGap – car.rearOverhang
    - 2 * car.centerRearAxleTurningRadius * Math.sin(alpha)) / Math.cos(alpha)
    i.e. d3 = (c1 - c2Sin(a)) / Cos(a)
    2. d3 = (street.carFromKerb + street.frontCarWidth
    + street.safetyGap + excessSafetyGap - this.getMinKerbDistance
    - 2 * car.centerRearAxleTurningRadius
    + (2 * car.centerRearAxleTurningRadius)Cos(a)) / Sin(a)
    i.e. d3 = (c3 + c2Cos(a)) / Sin(a)

    From 1. and 2. c1Sin(a) – c3Cos(a) – c2 = 0

    => c1Sin(a) – c2  = c3Cos(a)
    => c1**2Sin**2(a) – 2c1c2Sin(a) + c2**2 = c3**2Cos**2(a)
    => c1**2Sin**2(a) – 2c1c2Sin(a) + c2**2 = c3**2(1 - Sin**2(a))
    => (c1**2 + c3**2)Sin**2(a) – 2c1c2Sin(a) + (c2**2 - c3**2) = 0

    => sin(a) = (2c1c2 +/- sqrt((2c1c2)**2 – 4(c1**2+c3**2)(c2**2-c3**2)))
    / 2 *(c1**2+c3**2)

    */

    const excessSafetyGap = street.safetyGap;
    const c1 =
      this.getParkingSpace({ manoeuvre, street, car, config }) -
      street.safetyGap -
      car.rearOverhang;
    const c2 = 2 * car.centerRearAxleTurningRadius(ELock.Counterclockwise);
    const c3 =
      street.carFromKerb +
      street.frontCarWidth +
      street.safetyGap +
      excessSafetyGap -
      this.getMinKerbDistance({ manoeuvre, street, car, config }) -
      2 * car.centerRearAxleTurningRadius(ELock.Counterclockwise);

    const a = Math.pow(c1, 2) + Math.pow(c3, 2);
    const b = -2 * c1 * c2;
    const c = Math.pow(c2, 2) - Math.pow(c3, 2);

    let alpha1 = 0;
    try {
      alpha1 = Math.asin(
        (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
      );
    } catch {
      this.logger.log(
        `1st root calculation threw an error.`,
        LoggingLevel.ERROR,
      );
      alpha1 = Math.PI;
    }

    let alpha2 = 0;
    try {
      alpha2 = Math.asin(
        (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
      );
    } catch {
      this.logger.log(
        `2nd root calculation threw an error.`,
        LoggingLevel.ERROR,
      );
      alpha2 = Math.PI;
    }

    const alpha = Math.min(alpha1, alpha2);
    if (alpha > Math.PI / 4 || alpha < 0) {
      throw new Error(
        'Calculated angle greater than 45 degrees or less than 0.',
      );
    }

    return alpha;
  };

  /**
   * Returns the first turn in angle for all manoeuvres.
   *
   * @returns The angle in radians that the car rotates on it's first rotation
   * from it's starting position parallel to the x-axis.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getFirstTurnAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getTurnAngle called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
        return this.getFirstTurnAngle2R1SMin({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return this.getFirstTurnAngle3R1SMin({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park2Rotate0Straight:
        return this.getFirstTurnAngle2R0S({ manoeuvre, street, car, config });
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /**
         * Note: Set manually.
         * Only certain values are valid - roughly between the value for a
         * 2RotateMin1Straight and 2Rotate0Straight.
         */
        return 32.31 * config.DEG_TO_RAD;
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return this.getFirstTurnAngle2R1SMinFixedStart({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        /* Return a large angle as the rotation will be limited by the supplied
        condition function */
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The distance travelled by the car, in scaled mm, in the x and y
   * directions, when the car (starting parallel to the x-axis) rotates first
   * in one direction and then in the opposite direction by the same angle.
   */
  private getDistFrom2Turns = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TPoint => {
    this.logger.log(`getDistFrom2Turns called`, LoggingLevel.TRACE);
    /* deltaX = 2r(sin(alpha)) */
    const x =
      2 *
      car.centerRearAxleTurningRadius(ELock.Counterclockwise) *
      Math.sin(this.getFirstTurnAngle({ manoeuvre, street, car, config }));
    const y =
      2 *
      car.centerRearAxleTurningRadius(ELock.Counterclockwise) *
      (1 -
        Math.cos(this.getFirstTurnAngle({ manoeuvre, street, car, config })));
    return {
      x: x,
      y: y,
    };
  };

  /**
   *   * @returns A set of distances and condition functions used by the manoeuvre
   * Park3UsingRulesMediumAngle, that is defined by 'rules' as opposed to
   * optimal calculations.
   */
  private getRules = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): {
    carSideOutMed: number;
    carSideOutMin: number;
    carFromBumperMed: number;
    carFromBumperMin: number;
    move2ConditionMed: TCondition;
    move2ConditionMin: TCondition;
    move3ConditionMed: TCondition;
    move3ConditionMin: TCondition;
    move4Condition: TCondition;
    move5SteerCondition: TCondition;
    move5Condition: TCondition;
    move6SteerCondition: TCondition;
    move6Condition: TCondition;
  } => {
    this.logger.log(`getRules called`, LoggingLevel.TRACE);

    const baseFrontCarOut = config.baseFrontCarOut;
    const baseGap = config.baseGap;
    const adjustForFrontCarWidthFactor =
      street.frontCarWidth + street.carFromKerb <= baseFrontCarOut ? 0.5 : 1;

    /* Always park at a fixed distance out from the kerb, or else a fixed
    distance out from the front car if the front car is more than a base
    distance out from the kerb. The idea is to always park where you park for a
    typical front car */
    const carSideOutMed = Math.max(
      baseFrontCarOut + baseGap,
      street.carFromKerb + street.frontCarWidth + baseGap,
    );

    /* Always park at a fixed distance out from the from the front car */
    const carSideOutMin = street.carFromKerb + street.frontCarWidth + baseGap;

    /* The starting bumper x-position stays constant in absolute terms for
    front cars nearer to the kerb than the base, but this is equivalent to the
    car moving to the right with respect to the rear of the front car for front
    cars less than the base width (as narrower front cars result in a smaller
    car space) */
    /* The starting bumper x-position moves forward with respect to the rear of
    the front car for front cars wider than the base width (as wider front cars
    allow you start the straight move in closer to the front car outer corner
    for the same turned-in angle as you can move in more to clear the corner)
    */
    const differenceFromBase =
      baseFrontCarOut - (street.frontCarWidth + street.carFromKerb);
    const adjustment = adjustForFrontCarWidthFactor * differenceFromBase;
    const carFromBumperMed =
      -car.rearOverhang + street.safetyGap + Math.abs(adjustment);

    /* The starting bumper x-position is level with the rear bumper of the
    front car */
    const carFromBumperMin = street.safetyGap;

    /* Rotate until rear axle side has moved in by a fixed amount. (This is
    equivalent to a rotation of about 30 degrees). The idea is to know how to
    rotate through this distance and not have to adjust angles for different
    situations */
    const move2ConditionMed = (carInUse: CarService, _tick: any) => {
      const move2Turn = config.move2TurnMed;
      const start =
        this.getStartPosition({ manoeuvre, street, car, config }).y - car.width;
      return start - carInUse.readRearPortAxleSide.y >= move2Turn;
    };

    /* Rotate until passenger side is lined up with a point a fixed distance
    forward from the rear car front bumper. */
    const move2ConditionMin = (carInUse: CarService, _tick: any) => {
      const fontCarBumperX = street.rearCarCorner.x;
      const distFromFrontBumper = config.move2TurnMin;
      return (
        Math.abs(
          carInUse.readRearPortAxleSide.x -
            carInUse.readRearPortAxleSide.y /
              Math.tan(carInUse.readCarRotation) -
            fontCarBumperX -
            distFromFrontBumper,
        ) < 1
      );
    };

    /* Reverse until the rear port axle is a fixed distance from the kerb */
    /* NOTE:  This can be expressed as a distance from the rear port corner but
    this varies with the rear overhang of the car. Eg it is 300mm for the VW T5
    but 500mm for the Hyundai i10 */
    const move3ConditionMed = (carInUse: CarService, _tick: any) => {
      const distFromKerb = config.distFromKerbMed;
      return carInUse.readRearPortAxleSide.y - distFromKerb < 0.1;
    };
    /*
    If the rear starboard corner gets closer to the rear car than the configured
    minimum distance then stop.
    Otherwise reverse until the car front port corner is level with the rear
    bumper of the front car + safety gap and the rear port corner is within a
    given distance of the kerb.
     */
    const move3ConditionMin = (carInUse: CarService, _tick: any) => {
      return (
        carInUse.readRearStarboardCorner.x -
          street.rearCarCorner.x -
          street.safetyGap -
          config.distFromRearCarMin <
          1 ||
        (carInUse.readFrontPortCorner.x -
          street.frontCarCorner.x +
          street.safetyGap <
          1 &&
          carInUse.readRearPortCorner.y - config.distFromKerbMin < 1)
      );
    };

    /* Rotate in until the car comes within the allowed distance of the rear
    car or is horizontal */
    const move4Condition = (carInUse: CarService, _tick: unknown) => {
      const tooClose =
        carInUse.readRearStarboardCorner.x -
          street.rearCarCorner.x -
          street.safetyGap -
          config.distFromRearCarMin <
        1;
      const isHorizontal = Math.abs(carInUse.readCarRotation) < 0.001;
      return tooClose || isHorizontal;
    };

    /* Stop turning wheels in center position if the car is horizontal */
    const move5SteerCondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < 0.01 &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* Rotate in until the car touches the safety gap of the rear car or is
    horizontal */
    const move5Condition = (carInUse: CarService, tick: unknown) => {
      const collision = this.calc.checkCollision(carInUse, true);
      if (collision && typeof tick === 'number') {
        /* Clear collision */
        do {
          carInUse.readCarRotation -= tick;
        } while (this.calc.checkCollision(carInUse, true));
        {
          carInUse.readCarRotation -= tick;
        }
      }
      const isHorizontal = carInUse.readCarRotation < 0.001;
      return collision || isHorizontal;
    };

    /* Stop turning wheels in center position if the car is horizontal */
    const move6SteerCondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < 0.01 &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* If the car is already horizontal then stop */
    const move6Condition = (carInUse: CarService) => {
      return carInUse.readCarRotation < 0.01;
    };

    return {
      carSideOutMed,
      carSideOutMin,
      carFromBumperMed,
      carFromBumperMin,
      move2ConditionMed,
      move2ConditionMin,
      move3ConditionMed,
      move3ConditionMin,
      move4Condition,
      move5SteerCondition,
      move5Condition,
      move6SteerCondition,
      move6Condition,
    };
  };

  /**
   * @returns The x-axis distance, in unscaled mm, from the rear bumper of the
   * car to the PP just before the car rotates in.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getcarFromBumperMedToPivot = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getRearBumperToPivot called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* It calculates by adding the distance the IC is forward in the x-axis
        direction before rotating, to the distance the IC moves in the x-axis
        direction when the car rotates back to being parallel with the x-axis,
        and then subtracting the length of the car.*/

        /* This is the distance that the car corner, that is closest to the
        front parked car, is forward (in the x-axis direction) from the parked
        car just after it has turned and is about to reverse, i.e. when its
        rear axle is at the PP.*/
        const cornerFwdXFromPivot =
          car.rearAxleToFront *
          Math.cos(this.getFirstTurnAngle({ manoeuvre, street, car, config }));
        /* This is the angle between the CoR and the IC when the car has
        returned to be parallel to the x-axis. (Angles are measured positive in
        he clockwise direction which is the case throughout this application).
        This can be derived by looking at the car when parallel to the x-axis.
        The angle between the x-axis and a line from the CoR to the IC is
        (PI/2 - alpha) where alpha is the angle formed by a line from the rear
        axle to the COR and a line from the CoR to the IC.*/
        const endAngleRads =
          1.5 * Math.PI -
          Math.atan(
            car.rearAxleToFront /
              car.nearRearAxleSideTurningRadius(ELock.Counterclockwise),
          );
        /* This is the angle to be turned */
        const turnedAngleRads = this.getFirstTurnAngle({
          manoeuvre,
          street,
          car,
          config,
        });
        /* The turned angle is added to the end angle as the starting angle is
        further clockwise than the end angle */
        const startAngleRads = endAngleRads + turnedAngleRads;
        /* Formula to find the Y direction move for a chord (where the angles
        are with respect to the x-axis). */
        const distMovedXDuringTurn =
          car.frontInnerCornerTurningRadius(ELock.Counterclockwise) *
          (Math.cos(endAngleRads) - Math.cos(startAngleRads));
        /* This is the distance the car rear bumper is behind the OC */
        const distOCToRearBumper = car.length;
        return cornerFwdXFromPivot - distMovedXDuringTurn - distOCToRearBumper;
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /* This is the x-axis position of the rear bumper after moving from the
        parked position to the point where it begins rotating in */
        const distRearBumperX =
          street.rearCarCorner.x +
          street.safetyGap +
          this.getDistFrom2Turns({ manoeuvre, street, car, config }).x +
          this.getMove3({ manoeuvre, street, car, config }).deltaPositionFn(
            car,
          ) *
            Math.cos(
              this.getFirstTurnAngle({ manoeuvre, street, car, config }),
            );
        return (
          distRearBumperX - this.getPivot({ manoeuvre, street, car, config }).x
        );
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* Position rear axle at the front car rear corner */
        return -car.rearOverhang + street.safetyGap;
      case EManoeuvre.Park3UsingRulesMinAngle:
        /* Position rear bumper at the front car rear bumper */
        return this.getRules({ manoeuvre, street, car, config })
          .carFromBumperMin;
      case EManoeuvre.Park3UsingRulesMediumAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .carFromBumperMed;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The y-axis distance from the side of the car to the side of the
   * front parked car just before the car rotates in.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getCarSideToPivot = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getCarSideToPivot called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* It calculates by adding the distance the IC is out in the y-axis
        direction before rotating, to the distance the IC moves in the y-axis
        direction when the car rotates back to being parallel with the x-axis.
        */
        /* This is the distance that the car corner, that is closest to the
        front parked car, is out (in the y-axis direction) from the parked car
        just after it has turned and is about to reverse, i.e. when its rear
        axle is at the PP. */
        const cornerOutYFromFrontCar =
          car.rearAxleToFront *
            Math.sin(
              this.getFirstTurnAngle({ manoeuvre, street, car, config }),
            ) +
          street.safetyGap;
        /* This is the angle between the CoR and the IC when the car has
        returned to be parallel to the x-axis. (Angles are measured positive in
        the clockwise direction which is the case throughout this application).
        This can be derived by looking at the car when parallel to the x-axis.
        The angle between the x-axis and a line from the CoR to the IC is PI/2 
        - where a is the angle fromed by a line from the rear axle to the COR
        and a line from the CoR to the IC. */
        const endAngleRads =
          1.5 * Math.PI -
          Math.atan(
            car.rearAxleToFront /
              car.nearRearAxleSideTurningRadius(ELock.Counterclockwise),
          );
        /* This is the angle to be turned */
        const turnedAngleRads = this.getFirstTurnAngle({
          manoeuvre,
          street,
          car,
          config,
        });
        /* The turned angle is added to the end angle as the starting angle is
        further clockwise than the end angle */
        const startAngleRads = endAngleRads + turnedAngleRads;
        /* Formula to find the Y direction move for a chord (where the angles
        are with respect to the a-axis). */
        const distMovedYDuringTurn =
          car.frontInnerCornerTurningRadius(ELock.Counterclockwise) *
          (Math.sin(endAngleRads) - Math.sin(startAngleRads));
        /* This is the distance the PP is out from the front car */
        const distPivotYToCar = street.safetyGap;
        return cornerOutYFromFrontCar - distMovedYDuringTurn - distPivotYToCar;
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /* This is the distance the car side is at in the y-axis direction,
        i.e. the distance from the kerb and the distance moved */
        const distSideY =
          this.getMinKerbDistance({ manoeuvre, street, car, config }) +
          this.getDistFrom2Turns({ manoeuvre, street, car, config }).y +
          this.getMove3({ manoeuvre, street, car, config }).deltaPositionFn(
            car,
          ) *
            Math.sin(
              this.getFirstTurnAngle({ manoeuvre, street, car, config }),
            );
        return distSideY - this.getPivot({ manoeuvre, street, car, config }).y;
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* Position one safety gap out from the PP */
        return street.safetyGap;
      case EManoeuvre.Park3UsingRulesMediumAngle:
        return (
          this.getRules({ manoeuvre, street, car, config }).carSideOutMed -
          this.getPivot({ manoeuvre, street, car, config }).y
        );
      case EManoeuvre.Park3UsingRulesMinAngle:
        return (
          this.getRules({ manoeuvre, street, car, config }).carSideOutMin -
          this.getPivot({ manoeuvre, street, car, config }).y
        );
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A point containing the unscaled x/y coordinates of the PP.
   */
  private getPivot = ({ manoeuvre, street, car, config }: IParams): TPoint => {
    this.logger.log(`getPivot called`, LoggingLevel.TRACE);
    return {
      /* The PP is offset from the x-axis by the rear car and the parking space
      less a safety gap. */
      x:
        street.rearCarFromLeft +
        street.rearCarLength +
        this.getParkingSpace({ manoeuvre, street, car, config }) -
        street.safetyGap,
      y: this.getPivotPointFromKerb({ manoeuvre, street, car, config }),
    };
  };

  /**
   * @returns A point containing the scaled x/y coordinates of the OC when the
   * car first starts.
   */
  private getStartRelativePosition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TPoint => {
    this.logger.log(`getStartRelativePosition called`, LoggingLevel.TRACE);

    /* Position the to the right of the PP */
    const startGap = config.defaultCarOuterCornerStartFromPP;
    return {
      x:
        this.getcarFromBumperMedToPivot({ manoeuvre, street, car, config }) +
        car.length +
        startGap,
      y: car.width + this.getCarSideToPivot({ manoeuvre, street, car, config }),
    };
  };

  /**
   * @returns A point containing the scaled x/y coordinates of the OC when the
   * car first starts.
   */
  private getStartPosition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TPoint => {
    this.logger.log(`getStartPosition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
        const value = {
          x:
            this.getPivot({ manoeuvre, street, car, config }).x +
            this.getStartRelativePosition({ manoeuvre, street, car, config }).x,
          y:
            this.getPivot({ manoeuvre, street, car, config }).y +
            this.getStartRelativePosition({ manoeuvre, street, car, config }).y,
        };
        this.logger.log(`Starting position x: ${value.x}`, LoggingLevel.TRACE);
        this.logger.log(`Starting position y: ${value.y}`, LoggingLevel.TRACE);
        return value;
        return {
          x:
            street.rearCarFromLeft +
            street.rearCarLength +
            street.safetyGap +
            car.length,
          y: street.carFromKerb + car.width,
        };

      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns the required minimum distance from the kerb that the car has to
   * park at in order to avoid touching the kerb.
   *
   * @remarks
   * Used in the Park3Rotate1StraightMinAngle manoeuvre to set a minimum
   * distance from kerb so the rear car corner does not touch the kerb.
   * NOTE: You could set up so a collision is only detected when the rear wheel
   * (not the corner) touches the kerb and then the formula below must be
   * edited and the minimum distance would be much shorter.
   *
   * Theory for the 3 move manoeuvre
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   *
   * @param collisionAngle - getCollisionAngle calls this method, which in turn
   * calls getCollisionAngle. To avoid an infinite loop an approximate angle is
   * passed in from getCollisionAngle (only) which is used in this method
   * instead of calling getCollisionAngle.
   *
   * @returns The minimum distance, in scaled units, from the kerb at which the
   * car parks in order that its rear corner (NOT wheel) not to touch the kerb.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMinKerbDistance = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getMinKerbDistance called`, LoggingLevel.TRACE);

    const collisionAngle = this.getCollisionAngle({
      manoeuvre,
      street,
      car,
      config,
    });

    /* Add a buffer to the result to avoid spurious collisions */
    const buffer = config.collisionBuffer; // ~1mm
    /* Set a default minimum distance to the kerb */
    const minDefault = config.defaultMinFromKerb;

    /* Calculate the maximum allowed taking advantage of a very wide front car:
    When the car is being parked, only require the car to turn in so it's outer
    side is level with the front car. This allows a large kerb size under
    certain circumstances but limit it to half the legal maximum. */
    let maxDerivedFromFrontCar = Math.max(
      minDefault,
      street.carFromKerb + street.frontCarWidth - car.width,
    );
    maxDerivedFromFrontCar = Math.min(
      config.maxLegalKerbGap / 2,
      maxDerivedFromFrontCar,
    );

    /* Calculate a minimum kerb gap size to avoid the rear corner crossing the
    kerb */
    let minDerivedFromTurnIn = 0;
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* The rear corner will swing out further than the rear tyre, on the
        outer side of the turn circle, by an amount equal to the difference of
        the rear corner and the rear side at the rear-axle turning circles */
        minDerivedFromTurnIn =
          car.rearOuterCornerTurningRadius(ELock.Counterclockwise) -
          car.farRearAxleSideTurningRadius(ELock.Counterclockwise) +
          buffer;
        break;
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* The rear corner can cross the kerb as it approaches the rear car */
        // min = (1 - cos(alpha)) * (rb - w0) + jSin(alpha)
        minDerivedFromTurnIn =
          (1 - Math.cos(collisionAngle)) *
            (car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
              car.width) +
          car.rearOverhang * Math.sin(collisionAngle) +
          buffer;
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    const value = Math.max(maxDerivedFromFrontCar, minDerivedFromTurnIn);
    this.logger.log(`Min. kerb distance: ${value}`, LoggingLevel.TRACE);
    return value;
  };

  /**
   * @remarks
   * The car moves straight until its OC is at a calculated distance from the PP.
   *
   * @returns The distance in unscaled units that the car first moves.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove1Dist = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getMove1Dist called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
        const startRelPositionX = this.getStartRelativePosition({
          manoeuvre,
          street,
          car,
          config,
        }).x;
        const endRelPositionX =
          car.length +
          this.getcarFromBumperMedToPivot({ manoeuvre, street, car, config });
        return Math.abs(startRelPositionX - endRelPositionX);
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The angle in radians through which the car rotates when it first
   * turns in.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove2Angle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getMove2Angle called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
        return this.getFirstTurnAngle({ manoeuvre, street, car, config });
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove2Condition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove2Condition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move2ConditionMed;
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move2ConditionMin;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The car steering wheel setting.
   */
  private getMove3Steer = ({ manoeuvre }: IParams): number => {
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return ELock.Center;
      default:
        console.log(manoeuvre)
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @remarks
   * At one stage I could return a rotation or a straight move as move 3. The
   * idea was to allow a small rotation in move 3 but I couldn't find any
   * useful manoeuvre requiring such a rotation so now getMove3 only returns
   * straight moves. I'm leaving getmove3 as it's structured in case I want to
   * bring that functionality back.
   * @returns The distance in unscaled units the car moves straight back after
   * its first rotation.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove3 = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TMoveStraight => {
    this.logger.log(`getMove3 called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => car.rearAxleToFront,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        const excessGapAboveSafety = street.safetyGap;
        const deltaY =
          street.carFromKerb -
          this.getMinKerbDistance({ manoeuvre, street, car, config }) +
          street.frontCarWidth +
          street.safetyGap +
          excessGapAboveSafety -
          this.getDistFrom2Turns({ manoeuvre, street, car, config }).y;
        const delta =
          deltaY /
          Math.sin(this.getFirstTurnAngle({ manoeuvre, street, car, config }));
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => delta,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        /* The move distance is large as the condition will stop the move */
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => 1000,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park2Rotate0Straight:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => 0,
          deltaAngleFn: () => 0,
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getmove3Condition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getmove3Condition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move3ConditionMed;
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move3ConditionMin;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The angle in radians through which the car rotates on its second
   * rotation.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove4Angle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getMove4Angle called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return (
          this.getMove2Angle({ manoeuvre, street, car, config }) -
          this.getCollisionAngle({ manoeuvre, street, car, config })
        );
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove4Condition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove4Condition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).move4Condition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The car steering wheel setting.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5Steer = ({ manoeuvre }: IParams): number => {
    this.logger.log(`getMove5Steer called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return ELock.Center;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return ELock.Counterclockwise;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5SteerCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove5SteerCondition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move5SteerCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The angle in radians through which the car rotates on its third
   * rotation.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5Angle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): number => {
    this.logger.log(`getMove5Angle called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return 0;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return this.getCollisionAngle({ manoeuvre, street, car, config });
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        /* Return a large angle as the rotation will be limited by the
        condition */
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5Condition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove5Condition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).move5Condition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * This is used in a steering move (type = EMoveType.Steer) to set the target
   * setting of the steering wheel, i.e. the steering wheel is rotated from the
   * ending position of the last move to this new position.
   *
   * @remarks The steering wheel movement can be stopped by a steering condition.
   *
   * @returns The car target steering wheel setting for the move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6Steer = ({ manoeuvre }: IParams): ELock => {
    this.logger.log(`getMove6Steer called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return ELock.Center;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return ELock.Clockwise;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * This condition can stop the steering wheel movement e.g. stops the
   * steering wheel on the center position rather than move all the way
   * clockwise or anticlockwise.
   *
   * @remarks The condition function is tested by the move every tick and the
   * move will stop when it returns true.
   *
   * @returns The condition function that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6SteerCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove6SteerCondition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({ manoeuvre, street, car, config })
          .move6SteerCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The condition that halts the related move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6Condition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TCondition => {
    this.logger.log(`getMove6Condition called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return () => false;
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        return this.getRules({ manoeuvre, street, car, config }).move6Condition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A move, which could be a straight move or an arc move.
   *
   * @remarks For most manoeuvres, the move is a straight move and moves the
   * distance in unscaled units that positions the car as it finally moves
   * forward or reverse into the middle of the parking space.  For the
   * Park3UsingRulesMediumAngle manoeuvre it might be a final reverse rotation
   * to the horizontal position.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6 = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParams): TMoveStraight | TMoveArc => {
    this.logger.log(`getMove6 called`, LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Forward,
          deltaPositionFn: () =>
            this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2,
        };
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () =>
            this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2,
        };
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        const midPoint =
          street.rearCarFromLeft +
          street.rearCarLength +
          street.safetyGap +
          car.length +
          this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2;
        return {
          type: (carInUse) => {
            return Math.abs(carInUse.readCarRotation) < 0.01
              ? EMoveType.MoveStraight
              : EMoveType.MoveArc;
          },
          fwdOrReverseFn: () => EDirection.Reverse,
          /* Return a large angle as the condition will stop the rotation */
          deltaAngleFn: () => 0.5 * Math.PI,
          deltaPositionFn: (carInUse) => {
            return Math.abs(carInUse.readFrontStarboardCorner.x - midPoint);
          },
          condition: (carInUse: CarService) => {
            return Math.abs(carInUse.readCarRotation) < 0.01
              ? () => false
              : this.getMove6Condition({ manoeuvre, street, car, config });
          },
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   *
   * @returns The set of data that defines a complete manoeuvre - see
   * IManoeuvre description.
   */
  public getManoeuvre({
    manoeuvre,
    street,
    car,
    config
  }: IParams): IManoeuvre {
    this.logger.log(`getManoeuvre called`, LoggingLevel.TRACE);

    let parkingSpaceLength = 0;
    let startPosition: TPoint = { x: 0, y: 0 };
    let minKerbDistance = 0;
    let movie: { [key: string]: TMove } = {};
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3UsingRulesMediumAngle:
      case EManoeuvre.Park3UsingRulesMinAngle:
        parkingSpaceLength = this.getParkingSpace({
          manoeuvre,
          street,
          car,
          config,
        });
        startPosition = this.getStartPosition({
          manoeuvre,
          street,
          car,
          config,
        });
        minKerbDistance = this.getMinKerbDistance({
          manoeuvre,
          street,
          car,
          config,
        });
        movie = {
          moveA: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: ELock.Center,
            message: this.info.getMoveAMessage({
              manoeuvre,
              street,
              car,
              config,
            }),
          },
          moveB: {
            type: () => EMoveType.MoveStraight,
            fwdOrReverseFn: () => EDirection.Reverse,
            deltaPositionFn: () =>
              this.getMove1Dist({ manoeuvre, street, car, config }),
            deltaAngleFn: () => 0,
          },
          moveC: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: ELock.Counterclockwise,
            message: this.info.getMoveCMessage({
              manoeuvre,
              street,
              car,
              config,
            }),
          },
          moveD: {
            type: () => EMoveType.MoveArc,
            fwdOrReverseFn: () => EDirection.Reverse,
            deltaPositionFn: () => 0,
            deltaAngleFn: () =>
              this.getMove2Angle({ manoeuvre, street, car, config }),
            condition: () =>
              this.getMove2Condition({
                manoeuvre,
                street,
                car,
                config,
              }),
          },
          moveE: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: this.getMove3Steer({
              manoeuvre,
              street,
              car,
              config,
            }),
            message: this.info.getMoveEMessage({
              manoeuvre,
              street,
              car,
              config,
            }),
          },
          moveF: {
            type: this.getMove3({ manoeuvre, street, car, config }).type,
            fwdOrReverseFn: this.getMove3({ manoeuvre, street, car, config })
              .fwdOrReverseFn,
            deltaAngleFn: () => 0,
            deltaPositionFn: this.getMove3({ manoeuvre, street, car, config })
              .deltaPositionFn,
            condition: () =>
              this.getmove3Condition({
                manoeuvre,
                street,
                car,
                config,
              }),
          },
          moveG: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: ELock.Clockwise,
            message: this.info.getMoveGMessage({
              manoeuvre,
              street,
              car,
              config,
            }),
          },
          moveH: {
            type: () => EMoveType.MoveArc,
            fwdOrReverseFn: () => EDirection.Reverse,
            deltaPositionFn: () => 0,
            deltaAngleFn: () =>
              this.getMove4Angle({ manoeuvre, street, car, config }),
            condition: () =>
              this.getMove4Condition({
                manoeuvre,
                street,
                car,
                config,
              }),
          },
          moveI: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: this.getMove5Steer({
              manoeuvre,
              street,
              car,
              config,
            }),
            condition: () =>
              this.getMove5SteerCondition({
                manoeuvre,
                street,
                car,
                config,
              }),
            message: this.info.getMoveIMessage({
              manoeuvre,
              street,
              car,
              config,
            }),
          },
          moveJ: {
            type: () => EMoveType.MoveArc,
            fwdOrReverseFn: () => EDirection.Forward,
            deltaPositionFn: () => 0,
            deltaAngleFn: () =>
              this.getMove5Angle({ manoeuvre, street, car, config }),
            condition: () =>
              this.getMove5Condition({
                manoeuvre,
                street,
                car,
                config,
              }),
          },
          moveK: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: this.getMove6Steer({
              manoeuvre,
              street,
              car,
              config,
            }),
            condition: () =>
              this.getMove6SteerCondition({
                manoeuvre,
                street,
                car,
                config,
              }),
          } as TSteer,
          moveL: {
            type: this.getMove6({ manoeuvre, street, car, config }).type,
            fwdOrReverseFn: this.getMove6({ manoeuvre, street, car, config })
              .fwdOrReverseFn,
            deltaAngleFn: this.getMove6({ manoeuvre, street, car, config })
              .deltaAngleFn,
            deltaPositionFn: this.getMove6({ manoeuvre, street, car, config })
              .deltaPositionFn,
            condition: this.getMove6({ manoeuvre, street, car, config })
              .condition,
          } as TMoveStraight | TMoveArc,
          moveM: {
            type: () => EMoveType.Steer,
            steeringWheelAngle: ELock.Center,
          } as TSteer,
        };
        break;
    }

    return {
      parkingSpaceLength,
      startPosition,
      minKerbDistance,
      movie,
    };
  }
}
