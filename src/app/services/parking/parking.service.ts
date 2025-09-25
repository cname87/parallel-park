import { Injectable } from '@angular/core';
import {
  TPoint,
  EDirection,
  EManoeuvre,
  ELock,
  EMoveType,
  IPark,
  IParkParameters,
  LoggingLevel,
  TCondition,
  TMoveStraight,
  TMoveArc,
  TSteer,
  TMoveStraightOrArc,
  TMovie,
  EDistOut,
} from '../../shared/types';
import { ConfigService } from '../config.service';
import { LoggerService } from '../logger.service';
import { ObjectsService } from '../objects.service';
import { InformationService } from './information.service';
import { RulesService } from './rules.service';
import { StreetService } from '../street.service';
/**
 * @packageDocumentation
 *
 * * Description:
 *
 * The public getParking method is the entry point to the service. It gets an
 * IParkingParameters object and returns an IPark object - see descriptions
 * below. The returned IPark object contains a movie object which contains
 * the moves to draw the parking manoeuvre. Each move in the movie object are
 * calculated using the other methods in this service.
 *
 *  * Glossary:
 * CoR: Center of Rotation. Each element of the car rotates in a circle around
 * this center point.
 * OC: The front corner of the car that is on the outer side of the turning
 * circle.
 * IC: The front corner of the car that is on the inner side of the turning
 * circle.
 * CA: The center of the rear axle of the car.
 * Rmin: Distance from the CoR to the OC at fu ll steer angle. This is equal
 * to the minimum turning radius of the car.
 * PP: The outer corner of the parked front car that faces the parking space,
 * offset by the safety gap. This is the called the pivot point, even though
 * not all parking manoeuvres pivot from here.
 *
* * Example Park3Rotate1StraightMinAngle manoeuvre
This parking manoeuvre is the one where the car first reverses straight back to a pivot point, then steers the wheel to aim the front out, then reverses to swing the front out, then steers the wheel to aim straight, then reverses straight back to a second pivot point, then steers the wheel to aim the
front in, then reverses to swing the front in, then touches the rear car, (backed off by the safety gap), then steers the wheel to aim the front in
and finally moves forward to pull the car into a parallel position. (The '3' refers to the 3 turning movements, 1Straight refers to the 1 straight movement, and min angle refers to the fact that the car pivots to pull in at a minimum angle).
 *
 * getParking first calls getParkingSpace to calculate the required parkingspace for this manoeuvre.
 * - getParkingSpace calls getExtraParkingSpace to calculate the extra spacerequired above that needed for the car and safty gaps.
 * - For manouvres with 3 rotations, getExtraParkingSpace calls
 * getExtraParkingSpace3Rotate to get the required extra space.
 * - getExtraParkingSpace3Rotate calls getCollisionAngle to get the angle the car is at when it touches the rear car, which is needed to calculate the
 required parking space.
 * - getCollisionAngle uses a number of parameters to calculate the angle including the distance from the kerb at which the car must turn in to avoid the rear corner of the car swinging over the kerb  It can't call
 getParkedKerbDistance as that would create a loop so an estimate for the parked kerb distance is used. See the notes in getCollisionAngle for the estimate used.
 *
 * getParking then calls getStartPosition to get the car starting position.
 * - getStartPosition calls getPivot to get the PP. (See definition of PP
 * above).
 * - getPivot calls getPivotPointFromKerb to get the distance from the PP to
 * the kerb.
 * - getPivot calls getStartRelativePosition to get the car's OC position
 * relative to the PP.
 * - getStartRelativePosition calls getcarDistXFromBumperMedToPivot to get
 * the distance from the car's bumper to the PP.
 * - getStartRelativePosition calSide to get the distance
 * from the car's side to the PP.
 * getcarDistXFromBumperMedToPivot aSide both call
 * getFirstTurnAngle to get the first turn angle for the manoeuvre. The car's
 * starting position is dependent on the first turn angle.
 * - For this manoeuvre, getFirstTurnAngle calls getFirstTurnAngle3R1SMin to
 * calculate the first turn angle.
 * getFirstTurnAngle3R1SMin calls getCollisionAngle to get the collision angle.
 * getFirstTurnAngle3R1SMin calls getParkedKerbDistance to get distance the car
 * rear inner corner is out from the kerb when the car needs to start turning in
 * to avoid the rear corner of the car swinging over the kerb.
 *- getParkedKerbDistance calls getCollisionAngle to get the collision angle. See the note above on a potential loop between getParkedKerbDistance and getCollisionAngle.
 *
 * getParking then calls getParkedKerbDistance to get to get distance the car rear inner corner is out from the kerb when the car needs to start turning in to avoid the rear corner of the car swinging over the kerb
 *
 * getParking then creates a set of moves which are returned in a movie
 * object, and are used by the move service to create the manoeuvre. A move can
 * be one of 4 types TSteer, TMoveStraight,   TMoveArc or TMoveStraightOrArc. See types.ts for definitions.
 *
 * Each second move is a steering move, i.e. it just moves the steering wheel.
 * - move2ndStraightirstSteer sets the steering wheel to the center.
 * - move2ndStraightirstStraight calls getMove1stArcist1 to get the distance to move.
 * -- getMove1stArcist1 calls getStartRelativePosition and
 * getcarDistXFromBumperMedToPivot - see above.
 * - move2ndSteer sets the steering wheel counter-clockwise.
 * - move1stArc calls getMove1stArcAngle to get the angle to turn.
 * -- getMove1stArcAngle calls getFirstTurnAngle as above.
 * -move3rdSteer calls getMove3rdSteer to get the steering angle.  It simply returns to
 * center the wheel.
 * - move2ndStraight calls getMove2ndStraight which simply returns to reverse a certain distance.
 * - move4thSteer turns the steering wheel clockwise.
 * - move2ndArc calls getMove2ndArcAngle to get the angle to be turned.
 * -- getMove2ndArcAngle subtracts getCollisionAngle from getMove1stArcAngle (see above).
 * - move5thSteer calls getMove5thSteer to get the steering angle. It sets the steering
 * angle to counter-clockwise.
 * move3rdArc calls getMove3rdArcAngle to get the angle to turn.
 * -- getMove3rdArcAngle which returns the collision angle by calling
 * getCollisionAngle.
 * move6thSteer calls getMove6thSteer to get the steering angle.  It sets the steering
 * angle to clockwise.
 * move4thArc calls getMove4thArc which returns a move object directing the car to
 * reverse by an amount set by a call to getExtraParkingSpace.
 *
 Note that many moves call getMoveXCondition which can set a condition to stop the move by returning true.  For this manoeuvre they all return false
 i.e. they're not used.
 Note that many moves also call getMoveXMessage to provide a message to be printed on the screen during the move.

 * * Note on adding new move types
 *
 * See move4thArc which calls getMove4thArc for the best way to add new moves. getMove4thArc can return any required move object.
 */

/**
 * This parameter object is passed in by an external call to the getParking
 * function and is passed to all functions in this module.  It contains
 * parameters for all functions in this module
 *
 * The properties are as follows:
 *
 * @param manoeuvre - A manoeuvre is passed in to define the parking manoeuvre
 * to be created. See const enum EManoeuvre in types.ts for the definition of
 * all manouvres.
 * @param street - The street instance being used
 * @param car - The car instance being used
 * @param config - The config instance with configuration data
 */

/**
 * This object is returned by the getParking method and allows one
 * complete parking manoeuvre be drawn.
 *
 * The properties are as follows:
 *
 * @param parkingSpaceLength - The full length of the required parking space.
 * Used to set up the parking space required for the manoeuvre.
 * @param startPosition - The point coordinates of the car OC when the
 * manoeuvre starts. Used to set up the starting position of the car
 * @param minKerbDistance - The car should park this distance out from the
 * kerb. This is only used for information printouts. That is, it is not used in any
 * manoeuvre calculations.
 * @param movie - The set of moves that are passed to the move service to draw
 * the manoeuvre.
 */

@Injectable({
  providedIn: 'root',
})
export class ParkingService {
  //
  constructor(
    private logger: LoggerService,
    private info: InformationService,
    private config: ConfigService,
    private rulesService: RulesService,
    private objects: ObjectsService,
    private street: StreetService,
  ) {}

  /**
   * @returns The angle in radians that the the car is at when it touches the
   * rear parked car.
   * @remarks
   * This applies only to those manoeuvres where the car reverses back until it touches the rear car before it is parallel and then rotates forward and inwards to the parked position. This returns a shorter parking space than a manoeuvre where the car rotates back all the way to a parallel position.
   * @remarks
   * Calculation of the collision angle requires the parked kerb distance, but getParkedKerbDistance calls this getCollisionAngle method for the relevant manoeuvres resulting in an infinite loop, so an estimate is made - see comment below.
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getCollisionAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getCollisionAngle called', LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /* Return zero as getCollisionAngle is called by some move calculations and these manoeuvres must return zero as they don't collide */
        return 0;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* arcsin(rb2 - rc2 - m2 / (2rc * (m2 + n2)**0.5)) + arctan(m/n) */
        const rb = car.farRearAxleSideTurningRadius(ELock.Counterclockwise);
        const lockDirection = ELock.Counterclockwise;
        const farRearAxleRadius =
          car.farRearAxleSideTurningRadius(lockDirection);
        const rc = 2 * farRearAxleRadius - car.width;
        /* The parked distance to the kerb is required but you can't call getParkedKerbDistance as the manoeuvres needing the collision angle  call this getCollisionAngle method from getParkedKerbDistance resulting in an infinite loop, so an estimate is made.
        If the estimated parked kerb distance is bigger than the value returned by getParkedKerbDistance then the car will cross the safety gap to the rear car. Even if the safety gap is zero and the car collides with the rear car it will turn in and park albeit slightly off parallel.
        If the estimated parked kerb distance is smaller than the value returned by getParkedKerbDistance then the car will collide with the kerb and the parking parking attempt will fail.
        So go for a relatively large value e.g. 300mm or 400mm. */
        const parkedKerbDistance = 300 / config.distScale;
        const m =
          car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
          parkedKerbDistance -
          car.width +
          street.carFromKerb +
          street.frontCarWidth +
          street.safetyGap;
        const n = car.rearAxleToFront;
        const numerator = Math.pow(rb, 2) - Math.pow(rc, 2) - Math.pow(m, 2);
        const denominator = 2 * rc * Math.sqrt(Math.pow(m, 2) + Math.pow(n, 2));
        const angle = Math.asin(numerator / denominator) + Math.atan(m / n);
        this.logger.log(`Collision angle: ${angle}`, LoggingLevel.DEBUG);
        return angle;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        /* Not needed for rules-based manoeuvres */
        return 0;
      case EManoeuvre.BayPark1:
        return 0;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The extra required parking space above safety gaps and the car
   * length, in scaled mm, for a given manoeuvre.
   * @remarks
   * This is used by all manoeuvres where the final pull-in is one turn, i.e.
   * the car does NOT touch the rear car (out by the safety gap) at an angle
   * and then execute the final pull-in.
   * @theory
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
   */
  private getExtraParkingSpace2Rotate = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getExtraParkingSpace2Rotate called', LoggingLevel.TRACE);
    const lineToCarCorner = Math.pow(car.minTurningRadius, 2);
    const centreOfRotationFromKerb =
      this.getParkedKerbDistance({ manoeuvre, street, car, config }) +
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
   * @returns The extra required parking space above safety gaps and the car
   * length, in scaled mm, for a given manoeuvre.
   * @remarks
   * This is used by all manoeuvres where the car touches the rear car (out by
   * the safety gap) at an angle and then executes the final pull-in, i.e.
   * where the pull-in consists of 2 turns.
   * @theory
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   */
  private getExtraParkingSpace3Rotate = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getExtraParkingSpace3Rotate called', LoggingLevel.TRACE);

    return (
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise) *
        Math.sin(this.getCollisionAngle({ manoeuvre, street, car, config })) -
      car.rearOverhang *
        (1 -
          Math.cos(this.getCollisionAngle({ manoeuvre, street, car, config })))
    );
  };

  /**
   * @returns The extra parking space above safety gaps and the car length, in
   * scaled mm for a given manoeuvre
   * @remarks
   * This calls the appropriate method for the particular manoeuvre.
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getExtraParkingSpace = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getExtraParkingSpace called', LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
        return this.getExtraParkingSpace2Rotate({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return this.config.setManualExtraParkingSpace / config.distScale;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return this.getExtraParkingSpace3Rotate({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.Park4UsingRules1:
        return this.rulesService.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).extraParkingSpace;
      case EManoeuvre.BayPark1:
        /* Bay parking space is fixed */
        return 0;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The total parking length, in scaled mm, including safety gaps, car
   * length and the extra required space.
   * @remarks
   * Sums the fore and rear safety gaps, the car length and the extra required
   * parking space.
   */
  private getParkingSpace = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getParkingSpace called', LoggingLevel.TRACE);

    let extraParkingSpace = 0;

    /* Handle EDistOut manoeuvres. EDistOut manoeuvres are used for the Keyboard mode. Return the street parking space value */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      return street.parkingSpaceLength;
    }
    /* Handle automated manoeuvres */
    switch (manoeuvre as EManoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        extraParkingSpace = this.getExtraParkingSpace({
          manoeuvre,
          street,
          car,
          config,
        });
        const parkingSpace =
          2 * street.safetyGap + car.length + extraParkingSpace;
        this.logger.log(`Parking space: (${parkingSpace}`, LoggingLevel.TRACE);
        return parkingSpace;
      case EManoeuvre.BayPark1:
        /* Return the bay width set by the chosen street*/
        return street.parkingSpaceLength;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns the distance, in scaled mm, that the car ends up parked from the kerb.
   * @remarks
   * There are three inputs:
   * - A default minimum value set in the config file.
   * - An allowed maximum value derived from the front car distance from the kerb and the legal maximum.
   * - A minimum value derived from avoiding the rear corner of the kerb going over the kerb.
   -- For 2-turn manoeuvres this is derived from where the car ends up parked if it starts turning in at the minimum distance the car rear inner corner must be out from the kerb in order to avoid the rear corner of the car swinging over the kerb.
   -- For 3-turn manoeuvres this is derived from where the car ends up parked when the the rear corner touches the kerb as the car touches the rear car at an angle.
   -- NOTE: You could set up so that a minimum is set when the rear wheel (not the corner) touches the kerb and then the formula below must be edited and the minimum distances would be much shorter.
   @theory for the 3 move manoeuvre
   * See {@link http://www.talljerome.com/NOLA/parallelparking/attempt3.html}
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getParkedKerbDistance = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getParkedKerbDistance called', LoggingLevel.TRACE);

    /* Add a minimal buffer to the end result to avoid spurious collisions */
    const buffer = config.collisionBuffer;

    /* Set a value based on a default required minimum distance to the kerb */
    const minDefault = config.defaultMinFromKerb;

    /* Set a value based on taking advantage of a very wide front car but limited by a legal maximum. Allow the car to be out from the kerb so the car's outer side is level with the outer side of the front car. This allows a large kerb size if the front car is wide. But do not go above the legal maximum. */
    const maxDerivedFromFrontCar = Math.min(
      street.carFromKerb + street.frontCarWidth - car.width,
      config.maxLegalKerbGap,
    );

    /* Set a minimum parked kerb gap based on the need to avoid the rear corner crossing the kerb during the parking manoeuvre */
    let minDerivedFromTurnIn = 0;
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /* For these manoeuvres, the car rotates in with the rear corner out further than the rear tyre by an amount equal to the difference between the rear corner and the rear outer tyre turning circles.  That is, the car ends up parked out from the kerb as a minimum by the amount the rear corner swings out further than the rear tyre. (If the rear corner did not swing out further than the rear tyre then the car would park with the tyres at the kerb.)  */
        minDerivedFromTurnIn =
          car.rearOuterCornerTurningRadius(ELock.Counterclockwise) -
          car.farRearAxleSideTurningRadius(ELock.Counterclockwise) +
          buffer;
        break;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* For these manoeuvres, the rear corner could cross the kerb as it approaches the rear car. When it just touches the kerb and then pulls forward the parked kerb distance is calculated as follows:
        min = (1 - cos(alpha)) * (rb - w0) + jSin(alpha).
        This is the closest the car can park to the kerb without the rear corner crossing the kerb during the parking manoeuvre.*/
        const collisionAngle = this.getCollisionAngle({
          manoeuvre,
          street,
          car,
          config,
        });
        minDerivedFromTurnIn =
          (1 - Math.cos(collisionAngle)) *
            (car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
              car.width) +
          car.rearOverhang * Math.sin(collisionAngle) +
          buffer;
        break;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        /* Not needed for rules-based or bay parking manoeuvres */
        minDerivedFromTurnIn = 0;
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    const value = Math.max(
      minDefault,
      maxDerivedFromFrontCar,
      minDerivedFromTurnIn,
    );
    this.logger.log(`Min. kerb distance: ${value}`, LoggingLevel.TRACE);
    return value;
  };

  /**
   * @returns The angle in radians of the first turn in for a given
   * manoeuvre.
   * @remarks
   * This applies to the manoeuvre with the first turn at a minimum angle as part of a 2-turn, 1 straight manoeuvre.
   * @theory
   * The first turning angle from parallel to a turned position is the same as the turning angle from the turned position to parallel. That is, a rotation from a position where the car OC is at the PP to a position where the car OC is at the kerb. To calculate this angle consider the difference between two angles:
   1. OC at PP position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the PP.
   2. OC at parked position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the OC.
   */
  private getFirstTurnAngle2R1SMin = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getFirstTurnAngle2R1SMin called', LoggingLevel.TRACE);
    /* Car at PP position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the PP. */
    const angleYToPP = Math.asin(
      (car.rearAxleToFront +
        this.getExtraParkingSpace2Rotate({ manoeuvre, street, car, config })) /
        car.minTurningRadius,
    );
    /* OC at parked position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the OC. */
    const angleYToOCParked = Math.asin(
      car.rearAxleToFront / car.minTurningRadius,
    );
    /* The turn angle is the difference between these two angles. */
    return angleYToPP - angleYToOCParked;
  };

  /**
   * @returns The angle in radians of the first turn in for a given
   * manoeuvre.
   * @remarks
   * This applies to the manoeuvre with the first turn at a minimum angle as part of a 3-turn, 1 straight manoeuvre.
   * @theory
   * The first turning angle from parallel to a turned position is the same as the turning angle from the turned position to parallel. That is, a rotation from a position where the car OC is at the PP and the car is at the collission angle to the rear car to a position where the car OC is at the kerb. To calculate this angle consider the difference between two angles:
   1. OC at PP position and car at collision angle to rear car: The angle formed by the vertical y-axis and a line from the CoR to the PP.
   2. OC at parked position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the OC.
   */
  private getFirstTurnAngle3R1SMin = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getTurnAngle3R1SMin called', LoggingLevel.TRACE);
    /* OC at PP position and car at collision angle to rear car: The angle formed by the vertical y-axis and a line from the CoR to the PP:
    tan(angleYToPP) = (rc * Sin(alpha) + n) / (rc * Cos(alpha) - m) */
    const rc =
      2 * car.farRearAxleSideTurningRadius(ELock.Counterclockwise) - car.width;
    const alpha = this.getCollisionAngle({ manoeuvre, street, car, config });
    const m =
      car.farRearAxleSideTurningRadius(ELock.Counterclockwise) -
      this.getParkedKerbDistance({ manoeuvre, street, car, config }) -
      car.width +
      street.carFromKerb +
      street.frontCarWidth +
      street.safetyGap;
    const n = car.rearAxleToFront;
    const angleYToPP = Math.atan(
      (rc * Math.sin(alpha) + n) / (rc * Math.cos(alpha) - m),
    );
    /* OC at parked position: The angle formed by a line from the CoR to the rear axle and a line from the CoR to the OC. */
    const angleYToOCParked = Math.asin(
      car.rearAxleToFront / car.minTurningRadius,
    );
    /* The turn angle is the difference between these two angles. */
    return angleYToPP - angleYToOCParked;
  };

  /**
   * @returns The angle in radians of the first turn in for a given
   * manoeuvre.
   * @remarks
   * This applies to the manoeuvre with the first turn at a maximum angle as part of a 2-turn, no straight section manoeuvre.
   * @returns The angle in radians of the first turn in for a particular
   * manoeuvre.
   */
  private getFirstTurnAngle2R0SMax = ({
    street,
    car,
  }: IParkParameters): number => {
    this.logger.log('getFirstTurnAngle2R0S called', LoggingLevel.TRACE);
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
   * @returns The angle in radians of the first turn in for a given
   * manoeuvre.
   * @remarks
   * This applies to the manoeuvre with the first turn angle set by the start position as part of a 2-turn, 1 straight section manoeuvre.
   * @throws Error
   * Thrown if the calculated angle is greater than 45 degrees or less than 0
   * degrees.
   */
  private getFirstTurnAngle2R1SFixedStart = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log(
      'getFirstTurnAngle2R1SMinFixedStart called',
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

    this.getParkedKerbDistance +
    2 * car.centerRearAxleTurningRadius * (1 - Math.cos(alpha)) +
    d3 * Math.sin(alpha)
    = street.carFromKerb + street.frontCarWidth + street.safetyGap +
    excessSafetyGap

    Eliminate d3...
    1. d3 = (parkingSpaceLength - street.safetyGap – car.rearOverhang
    - 2 * car.centerRearAxleTurningRadius * Math.sin(alpha)) / Math.cos(alpha)
    i.e. d3 = (c1 - c2Sin(a)) / Cos(a)
    2. d3 = (street.carFromKerb + street.frontCarWidth
    + street.safetyGap + excessSafetyGap - this.getParkedKerbDistance
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
      this.getParkedKerbDistance({ manoeuvre, street, car, config }) -
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
   * @returns The distance travelled by the car, in scaled mm, in the x and y
   * directions, when the car (starting parallel to the x-axis) rotates first
   * in one direction and then in the opposite direction, by the same angle.
   *
   * @remarks This is needed for calculations in other functions.
   */
  private getDistFrom2Arcs = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TPoint => {
    this.logger.log('getDistFrom2Arcs called', LoggingLevel.TRACE);
    /* deltaX = 2r(sin(alpha)) */
    const x =
      2 *
      car.centerRearAxleTurningRadius(ELock.Counterclockwise) *
      Math.sin(this.getFirstTurnAngle({ manoeuvre, street, car, config }));
    /* deltaY = 2r(1 - cos(alpha)) */
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
   * @returns The angle in radians that the car rotates on it's first rotation
   * from it's starting position parallel to the x-axis.
   *
   * @remarks This is called by all manoeuvre and calls out to more specific functions, depending on the manoeuvre, to calculate the angle.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getFirstTurnAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getTurnAngle called', LoggingLevel.TRACE);

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
        return this.getFirstTurnAngle2R0SMax({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park2Rotate1StraightSetManual:
        /* Only certain values are valid - roughly between the value for a 2RotateMin1Straight and 2Rotate0Straight */
        return this.config.setManualFirstTurnAngle * config.DEG_TO_RAD;
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return this.getFirstTurnAngle2R1SFixedStart({
          manoeuvre,
          street,
          car,
          config,
        });
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.BayPark1:
        /* Return a large angle as the rotation will be limited by the supplied
        condition function */
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns
   * X-axis setups: The x-axis distance from a y-axis line along the rear bumper of the car to a y-axis line through the PP at the point when the car starts the first turn.
   * Y-axis setups: The x-axis distance from the Pivot Point to the Outer Corner of the car at the point when the car starts the first turn.
   */
  private getStartXDistToPivot = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getStartXDistToPivot called', LoggingLevel.TRACE);

    /* Handle EDistOut manoeuvres. EDistOut manoeuvres are used for the Keyboard mode. Use the EDistOut value for bay parking, as the x-axis represents the distance from the parked car in bay parking, and a configuration value for parallel parking. */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      if (this.street.type === 'bay') {
        const value =
          this.objects[manoeuvre as EDistOut].distance / config.distScale;
        this.logger.log(
          `x-distance to pivot: ${value * config.distScale}`,
          LoggingLevel.DEBUG,
        );
        return value;
      } else if (this.street.type === 'parallel') {
        const value =
          this.config.parallelKeyboardModeStartDistFromRearToPivot /
          config.distScale;
        this.logger.log(
          `x-distance to pivot: ${value * config.distScale}`,
          LoggingLevel.DEBUG,
        );
        return value;
      }
    }

    /* Handle automated manoeuvres */
    let value = 0;
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
        const startingAngleRads = endAngleRads + turnedAngleRads;
        /* Formula to find the Y direction move for a chord (where the angles
        are with respect to the x-axis). */
        const distMovedXDuringTurn =
          car.frontInnerCornerTurningRadius(ELock.Counterclockwise) *
          (Math.cos(endAngleRads) - Math.cos(startingAngleRads));
        /* This is the distance the car rear bumper is behind the OC */
        const distOCToRearBumper = car.length;
        value = cornerFwdXFromPivot - distMovedXDuringTurn - distOCToRearBumper;
        break;
      case EManoeuvre.Park2Rotate0Straight:
        /* This is the x-axis position of the rear bumper after moving from the
        parked position to the point where it begins rotating in */
        const distRearBumperX =
          street.rearCarOuterCorner.x +
          street.safetyGap +
          this.getDistFrom2Arcs({ manoeuvre, street, car, config }).x +
          this.getMove2ndStraight({
            manoeuvre,
            street,
            car,
            config,
          }).deltaPositionFn(car) *
            Math.cos(
              this.getFirstTurnAngle({ manoeuvre, street, car, config }),
            );
        value =
          distRearBumperX - this.getPivot({ manoeuvre, street, car, config }).x;
        break;
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* Position the rear axle at the front car rear corner */
        value = -car.rearOverhang + street.safetyGap;
        break;
      case EManoeuvre.Park2Rotate1StraightSetManual:
        value =
          this.config.setManualStartDistFromRearToPivot / config.distScale;
        break;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        value = this.rulesService.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).startDistXToPivot;
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    this.logger.log(
      'Dist from rear to pivot when 1st arc move starts: ' +
        `${value * config.distScale}`,
      LoggingLevel.DEBUG,
    );
    return value;
  };

  /**
   * @returns
   * X-axis setups: The y-axis distancefrom the inner side of the parking car to the x-axis line drawn through the PP of the front parked car at the point when the car starts the first turn.
   * Y-axis setups: The x-axis distance from the Pivot Point to the Outer Corner of the car at the point when the car starts the first turn.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getStartYDistToPivot = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getStartDistYToPivot called', LoggingLevel.TRACE);

    /* Handle EDistOut manoeuvres. EDistOut manoeuvres are used for the Keyboard mode. Use the EDistOut value for parallel parking, as the y-axis represents the distance from the parked car in bay parking, and a configuration value for bay parking. */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      if (this.street.type === 'bay') {
        const value =
          this.config.bayKeyboardModeStartDistFromRearToPivot /
          config.distScale;
        this.logger.log(
          `y-distance to pivot: ${value * config.distScale}`,
          LoggingLevel.DEBUG,
        );
        return value;
      } else if (this.street.type === 'parallel') {
        const value =
          this.objects[manoeuvre as EDistOut].distance / config.distScale;
        this.logger.log(
          `y-distance to pivot: ${value * config.distScale}`,
          LoggingLevel.DEBUG,
        );
        return value;
      }
    }

    /* Handle automated manoeuvres */
    let value = 0;
    switch (manoeuvre as EManoeuvre) {
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
        const startingAngleRads = endAngleRads + turnedAngleRads;
        /* Formula to find the Y direction move for a chord (where the angles
          are with respect to the a-axis). */
        const distMovedYDuringTurn =
          car.frontInnerCornerTurningRadius(ELock.Counterclockwise) *
          (Math.sin(endAngleRads) - Math.sin(startingAngleRads));
        /* This is the distance the PP is out from the front car */
        const distPivotYToCar = street.safetyGap;
        value = cornerOutYFromFrontCar - distMovedYDuringTurn - distPivotYToCar;
        break;
      case EManoeuvre.Park2Rotate0Straight:
        /* This is the distance the car side is at in the y-axis direction,
          i.e. the distance from the kerb and the distance moved */
        const distSideY =
          this.getParkedKerbDistance({ manoeuvre, street, car, config }) +
          this.getDistFrom2Arcs({ manoeuvre, street, car, config }).y +
          this.getMove2ndStraight({
            manoeuvre,
            street,
            car,
            config,
          }).deltaPositionFn(car) *
            Math.sin(
              this.getFirstTurnAngle({ manoeuvre, street, car, config }),
            );
        value = distSideY - this.getPivot({ manoeuvre, street, car, config }).y;
        break;
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return this.config.setManualStartDistSideToPivot / config.distScale;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        value = this.rulesService.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).startDistYToPivot;
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    this.logger.log(
      'Dist from side to pivot when 1st arc move starts: ' +
        `${value * config.distScale}`,
      LoggingLevel.DEBUG,
    );
    return value;
  };

  /**
   * @returns The distance in scaled mm that the the PP is out from the kerb.
   *
   * @remarks
   * The PP is offset from the kerb (y-axis) by the front car's distance from
   * kerb, its width, and the safety gap.
   */
  private getPivotPointFromKerb = ({ street }: IParkParameters): number => {
    this.logger.log('getPivotPointFromKerb called', LoggingLevel.TRACE);
    /* The PP is offset from the kerb (y-axis) by the front car's distance from the kerb, its width, and the safety gap. */
    return street.carFromKerb + street.frontCarWidth + street.safetyGap;
  };

  /**
   * @returns A point containing the scaled x/y coordinates of the PP.
   */
  private getPivot = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TPoint => {
    this.logger.log('getPivot called', LoggingLevel.TRACE);

    let value = {} as TPoint;
    const parkingSpace = this.getParkingSpace({
      manoeuvre,
      street,
      car,
      config,
    });
    const fromKerb = this.getPivotPointFromKerb({
      manoeuvre,
      street,
      car,
      config,
    });

    /* EDistOut manoeuvres are used for the Keyboard mode so set the manoeuvre to an bay or parallel manoeuvre to return an appropriate value */
    /* NOTE: If the pivot point in keyboard mode ever differs from the automated manoeuvres chosen below then this must be edited */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      if (this.street.type === 'bay') {
        /* The bay parking keyboard mode pivot point is the same as in the BayPark1 manoeuvre */
        manoeuvre = EManoeuvre.BayPark1;
      } else if (this.street.type === 'parallel') {
        /* The parallel parking keyboard mode pivot point is the same for all parallel manoeuvre, so use one at random*/
        manoeuvre = EManoeuvre.Park2Rotate1StraightMinAngle;
      }
    }
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        value = {
          /* The PP is offset from the x-axis by the rear car and the parking space less a safety gap. */
          x:
            street.rearCarFromLeft +
            street.rearCarLength +
            parkingSpace -
            street.safetyGap,
          y: fromKerb,
        };
        break;
      case EManoeuvre.BayPark1:
        value = {
          /* The PP is offset from the x-axis (kerb) by the rear car distance from the x-axis + the front car length + the safety gap. */
          x: street.frontCarFromLeft + street.frontCarLength + street.safetyGap,
          /* The PP is offset from the y-axis by the front car's distance
          from the kerb, its width, the parking space and the safety gap. */
          y:
            street.rearCarFromTop +
            street.rearCarWidth +
            parkingSpace -
            street.safetyGap,
        };
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    this.logger.log(
      'Pivot Point: (' +
        value.x * config.distScale +
        ',' +
        value.y * config.distScale +
        ')',
      LoggingLevel.DEBUG,
    );
    return value;
  };

  /**
   * @returns A point containing the scaled x/y coordinates of the OC relative
   * to the PP when the car first starts.
   */
  private getStartRelativePosition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TPoint => {
    this.logger.log('getStartRelativePosition called', LoggingLevel.TRACE);

    /* X-Axis setups: The distance from the pivot to the rear of the car when in the start position
    Y-Axis setups: The distance from the pivot to the OC of the car when in the start position */
    const startDistx = this.getStartXDistToPivot({
      manoeuvre,
      street,
      car,
      config,
    });
    const startDisty = this.getStartYDistToPivot({
      manoeuvre,
      street,
      car,
      config,
    });

    /* The gap between a calculated manoeuvre start position and where the car is placed for the start of the parking attempt */
    const startGap = config.defaultCarOuterCornerStartFromPP;
    this.logger.log(
      `Added gap from start position to pivot: ${startGap * config.distScale}`,
      LoggingLevel.DEBUG,
    );

    /* Handle EDistOut manoeuvres. EDistOut manoeuvres are used for the Keyboard mode. Set to an appropriate bay or parallel parking value. */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      if (this.street.type === 'bay') {
        return {
          x: startDistx,
          y: startDisty + startGap,
        };
      } else if (this.street.type === 'parallel') {
        return {
          x: car.length + startDistx + startGap,
          y: car.width + startDisty,
        };
      }
    }

    let value = {} as TPoint;
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        /* X-Axis: The OC is offset from the PP in the x-axis by the distance from the rear of the car + the distance to move to where the 1st arc starts + and anadded gap, and in the y-axis by the width of the car and the distance from the side of the car to the pivot. */
        value = {
          x: car.length + startDistx + startGap,
          y: car.width + startDisty,
        };
        break;
      case EManoeuvre.BayPark1:
        /* Y-Axis: The OC is offset from the PP by the distance from the side of the car + the distance to move to where the 1st arc starts + and added gap. */
        value = {
          x: startDistx,
          y: startDisty + startGap,
        };
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }

    this.logger.log(
      `Start position relative to pivot: (${
        value.x * config.distScale
      },${value.y * config.distScale})`,
      LoggingLevel.DEBUG,
    );
    return value;
  };

  /**
   * @returns A point containing the scaled x/y coordinates of the OC when the
   * car first starts.
   */
  public getStartPosition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TPoint => {
    this.logger.log('getStartPosition called', LoggingLevel.TRACE);

    const pivotPoint = this.getPivot({ manoeuvre, street, car, config });

    const startRelativePosition = this.getStartRelativePosition({
      manoeuvre,
      street,
      car,
      config,
    });

    const value = {
      x: pivotPoint.x + startRelativePosition.x,
      y: pivotPoint.y + startRelativePosition.y,
    };
    this.logger.log(
      'Starting position: (' +
        value.x * config.distScale +
        ',' +
        value.y * config.distScale +
        ')',
      LoggingLevel.DEBUG,
    );
    return value;
  };

  /**
   * @returns The angle in radians, made by a line through the side of the car to the negative x-axis with positive in the clockwise direction, that the car is at when drawn
   */
  private getStartAngle = ({ manoeuvre }: IParkParameters): number => {
    this.logger.log('getStartAngle called', LoggingLevel.TRACE);

    /* Handle EDistOut manoeuvres. EDistOut manoeuvres are used for the Keyboard mode. Set to the Pi/2 for bay, and zero for parallel parking value. */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (distOutValues.includes(manoeuvre as EDistOut)) {
      if (this.street.type === 'bay') {
        return Math.PI / 2;
      } else {
        return 0;
      }
    }

    /* Handle automated manoeuvres */
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        return 0;
      case EManoeuvre.BayPark1:
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };
  /**
   * @returns The distance in scaled units that the car first moves in a straight reverse.
   *
   * @remarks
   * The car moves straight until its OC is at a calculated distance from the PP.
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove1stStraightDist = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getMove1stStraightDist called', LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        const startRelPositionX = this.getStartRelativePosition({
          manoeuvre,
          street,
          car,
          config,
        }).x;
        const endRelPositionX =
          car.length +
          this.getStartXDistToPivot({ manoeuvre, street, car, config });
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
  private getMove1stArcAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getMove1stArcAngle called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.getFirstTurnAngle({ manoeuvre, street, car, config });
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the first turn if it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove1stArcCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove1stArcCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move1stArcCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The distance in unscaled units the car moves straight back after
   * its first rotation.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove2ndStraight = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TMoveStraight => {
    this.logger.log('getMove2ndStraight called', LoggingLevel.TRACE);
    let deltaY = 0;
    let delta = 0;
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => car.rearAxleToFront,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        deltaY =
          street.carFromKerb +
          street.frontCarWidth +
          street.safetyGap +
          this.getStartYDistToPivot({ manoeuvre, street, car, config }) -
          this.getParkedKerbDistance({ manoeuvre, street, car, config }) -
          this.getDistFrom2Arcs({ manoeuvre, street, car, config }).y;
        delta =
          deltaY /
          Math.sin(this.getFirstTurnAngle({ manoeuvre, street, car, config }));
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => delta,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park2Rotate0Straight:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => 0,
          deltaAngleFn: () => 0,
        };
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        /* The move distance is large as the condition will stop the move */
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () => 1000,
          deltaAngleFn: () => 0,
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the first straight rverse if it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove2ndStraightCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove2ndStraightCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move2ndStraightCondition;
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
  private getMove2ndArcAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getMove2ndArcAngle called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return (
          this.getMove1stArcAngle({ manoeuvre, street, car, config }) -
          this.getCollisionAngle({ manoeuvre, street, car, config })
        );
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return this.config.setManualFirstTurnAngle * config.DEG_TO_RAD;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        /* Return a large angle as the rotation will be limited by the supplied
        condition function */
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the second rotation if it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove2ndArcCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove2ndArcCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).move2ndArcCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The car steering wheel setting following the straight reverse move.
   *
   * @remarks
   * This is counterclockwise for 3-turn manoeuvres.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5thSteer = ({ manoeuvre }: IParkParameters): number => {
    this.logger.log('getMove5thSteer called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return ELock.Center;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        return ELock.Counterclockwise;
      case EManoeuvre.BayPark1:
        return ELock.Counterclockwise;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the related move if it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5thSteerCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove5thSteerCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move5thSteerCondition;
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
  private getMove3rdArcAngle = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): number => {
    this.logger.log('getMove3rdArcAngle called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return 0;
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return this.getCollisionAngle({ manoeuvre, street, car, config });
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        /* Return a large angle as the rotation will be limited by the
        condition */
        return Math.PI / 2;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the 3rd rotation if it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove3rdArcCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove3rdArcCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({
          manoeuvre,
          street,
          car,
          config,
        }).move3rdArcCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The car target steering wheel setting for the move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6thSteer = ({ manoeuvre }: IParkParameters): ELock => {
    this.logger.log('getMove6thSteer called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return ELock.Center;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        return ELock.Clockwise;
      case EManoeuvre.BayPark1:
        return ELock.Clockwise;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the related move if it returns true.
   *
   * @remarks This condition can stop the steering wheel movement e.g. stops the steering wheel on the center position rather than move all the way clockwise or anticlockwise.The condition function is tested by the move every tick and the move will stop when it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove6thSteerCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove6thSteerCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres skip this steering and stay centered */
        return () => true;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move6thSteerCondition;
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
   * Park4UsingRules manoeuvres it might be a final reverse rotation
   * to the horizontal position.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove4thArc = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TMoveStraight | TMoveStraightOrArc => {
    this.logger.log('getMove4thArc called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Forward,
          deltaPositionFn: () =>
            this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2,
        };
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Forward,
          deltaPositionFn: () => 0,
        };
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () =>
            this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2,
        };
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move4thArc;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns The car target steering wheel setting for the move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove7thSteer = ({ manoeuvre }: IParkParameters): ELock => {
    this.logger.log('getMove7thSteer called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return ELock.Center;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
        return ELock.Counterclockwise;
      case EManoeuvre.BayPark1:
        return ELock.Counterclockwise;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A condition function that takes as parameters a car service and
   * a tick angle, and halts the related move if it returns true.
   *
   * @remarks This condition can stop the steering wheel movement e.g. stops the steering wheel on the center position rather than move all the way clockwise or anticlockwise.The condition function is tested by the move every tick and the move will stop when it returns true.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove7thSteerCondition = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TCondition => {
    this.logger.log('getMove7thSteerCondition called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        /* These manoeuvres are not stopped by the condition function */
        return () => false;
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move7thSteerCondition;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns A final straight move for rules-based manoeuvres.
   *
   * @remarks For the Park4UsingRules manoeuvres it might be a final straight move to center the car.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove5thArc = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TMoveStraight | TMoveStraightOrArc => {
    this.logger.log('getMove5thArc called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Forward,
          deltaPositionFn: () => 0,
        };
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move5thArc;
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
   * Park4UsingRules manoeuvres it might be a final reverse rotation
   * to the horizontal position.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  private getMove3rdStraight = ({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): TMoveStraight | TMoveStraightOrArc => {
    this.logger.log('getMove3rdStraight called', LoggingLevel.TRACE);
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Forward,
          deltaPositionFn: () => 0,
        };
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          type: () => EMoveType.MoveStraight,
          fwdOrReverseFn: () => EDirection.Reverse,
          deltaPositionFn: () =>
            this.getExtraParkingSpace({ manoeuvre, street, car, config }) / 2,
        };
      case EManoeuvre.Park4UsingRules1:
      case EManoeuvre.Park4UsingRules2:
      case EManoeuvre.BayPark1:
        return this.rulesService.getRules({ manoeuvre, street, car, config })
          .move3rdStraight;
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns An empty movie object with minimal moves for keyboard mode
   */
  private createEmptyMovie(): TMovie {
    return {
      move1stSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
        message: {
          message: 'NOTE: Bay parking has no automated manoeuvres yet',
        },
      },
      move1stStraight: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        deltaAngleFn: () => 0,
        message: undefined,
      },
      move2ndSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move1stArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        deltaAngleFn: () => 0,
        message: undefined,
      },
      move3rdSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move2ndStraight: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        deltaAngleFn: () => 0,
        message: undefined,
      },
      move4thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move2ndArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        deltaAngleFn: () => 0,
        message: undefined,
      },
      move5thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move3rdArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        deltaAngleFn: () => 0,
        message: undefined,
      },
      move6thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move4thArc: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
        message: undefined,
      },
      move7thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move5thArc: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
      },
      move8thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move3rdStraight: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.NoMove,
        deltaPositionFn: () => 0,
      },
    };
  }

  /**
   * @returns The set of data that defines a complete manoeuvre - see
   * IPark description.
   */
  public getParking({
    manoeuvre,
    street,
    car,
    config,
  }: IParkParameters): IPark {
    this.logger.log('getParking called', LoggingLevel.TRACE);

    let parkingSpaceLength = 0;
    let startPosition: TPoint = { x: 0, y: 0 };
    let startAngleRads = 0;
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
    startAngleRads = this.getStartAngle({ manoeuvre, street, car, config });

    /* Exit at this stage for bay parking manoeuvre or EDistOut manoeuvres as there are no calculated manoeuvres for these */
    const distOutValues = this.objects.distancesOut.map(
      ([enumValue]) => enumValue,
    );
    if (
      /* Handle the sole bay parking manoeuvre by returning an empty movie as there is currently no calculated bay parking manoeuvre */
      manoeuvre === EManoeuvre.BayPark1 ||
      /* EDistOut manoeuvres are only used for Keyboard mode so return anempty movie as there is no calculated parking manoeuvre */
      distOutValues.includes(manoeuvre as EDistOut)
    ) {
      return {
        parkingSpaceLength,
        startPosition,
        startAngleRads,
        movie: this.createEmptyMovie(),
      };
    }

    const movie: TMovie = {
      move1stSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
        message: this.info.getMove1stSteerMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move1stStraight: {
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn: () => EDirection.Reverse,
        deltaPositionFn: () =>
          this.getMove1stStraightDist({
            manoeuvre,
            street,
            car,
            config,
          }),
        deltaAngleFn: () => 0,
        message: this.info.getMove1stStraightMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move2ndSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Counterclockwise,
      },
      move1stArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.Reverse,
        deltaPositionFn: () => 0,
        deltaAngleFn: () =>
          this.getMove1stArcAngle({ manoeuvre, street, car, config }),
        condition: () =>
          this.getMove1stArcCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
        message: this.info.getMove1stArcMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move3rdSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move2ndStraight: {
        type: this.getMove2ndStraight({ manoeuvre, street, car, config }).type,
        fwdOrReverseFn: this.getMove2ndStraight({
          manoeuvre,
          street,
          car,
          config,
        }).fwdOrReverseFn,
        deltaAngleFn: () => 0,
        deltaPositionFn: this.getMove2ndStraight({
          manoeuvre,
          street,
          car,
          config,
        }).deltaPositionFn,
        condition: () =>
          this.getMove2ndStraightCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
        message: this.info.getMove2ndStraightMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move4thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Clockwise,
      },
      move2ndArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.Reverse,
        deltaPositionFn: () => 0,
        deltaAngleFn: () =>
          this.getMove2ndArcAngle({ manoeuvre, street, car, config }),
        condition: () =>
          this.getMove2ndArcCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
        message: this.info.getMove2ndArcMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move5thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: this.getMove5thSteer({
          manoeuvre,
          street,
          car,
          config,
        }),
        condition: () =>
          this.getMove5thSteerCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
      },
      move3rdArc: {
        type: () => EMoveType.MoveArc,
        fwdOrReverseFn: () => EDirection.Forward,
        deltaPositionFn: () => 0,
        deltaAngleFn: () =>
          this.getMove3rdArcAngle({ manoeuvre, street, car, config }),
        condition: () =>
          this.getMove3rdArcCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
        message: this.info.getMove3rdArcMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      },
      move6thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: this.getMove6thSteer({
          manoeuvre,
          street,
          car,
          config,
        }),
        condition: () =>
          this.getMove6thSteerCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
      } as TSteer,
      move4thArc: {
        type: this.getMove4thArc({ manoeuvre, street, car, config }).type,
        fwdOrReverseFn: this.getMove4thArc({ manoeuvre, street, car, config })
          .fwdOrReverseFn,
        deltaAngleFn: this.getMove4thArc({ manoeuvre, street, car, config })
          .deltaAngleFn,
        deltaPositionFn: this.getMove4thArc({ manoeuvre, street, car, config })
          .deltaPositionFn,
        condition: this.getMove4thArc({ manoeuvre, street, car, config })
          .condition,
        message: this.info.getMove4thArcMessage({
          manoeuvre,
          street,
          car,
          config,
        }),
      } as TMoveStraight | TMoveArc,
      move7thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: this.getMove7thSteer({
          manoeuvre,
          street,
          car,
          config,
        }),
        condition: () =>
          this.getMove7thSteerCondition({
            manoeuvre,
            street,
            car,
            config,
          }),
      } as TSteer,
      move5thArc: {
        type: this.getMove5thArc({ manoeuvre, street, car, config }).type,
        fwdOrReverseFn: this.getMove5thArc({ manoeuvre, street, car, config })
          .fwdOrReverseFn,
        deltaAngleFn: this.getMove5thArc({ manoeuvre, street, car, config })
          .deltaAngleFn,
        deltaPositionFn: this.getMove5thArc({ manoeuvre, street, car, config })
          .deltaPositionFn,
        condition: this.getMove5thArc({ manoeuvre, street, car, config })
          .condition,
      } as TMoveStraight,
      move8thSteer: {
        type: () => EMoveType.Steer,
        steeringWheelAngle: ELock.Center,
      },
      move3rdStraight: {
        type: this.getMove3rdStraight({ manoeuvre, street, car, config }).type,
        fwdOrReverseFn: this.getMove3rdStraight({
          manoeuvre,
          street,
          car,
          config,
        }).fwdOrReverseFn,
        deltaAngleFn: this.getMove3rdStraight({
          manoeuvre,
          street,
          car,
          config,
        }).deltaAngleFn,
        deltaPositionFn: this.getMove3rdStraight({
          manoeuvre,
          street,
          car,
          config,
        }).deltaPositionFn,
        condition: this.getMove3rdStraight({ manoeuvre, street, car, config })
          .condition,
      } as TMoveStraight,
    };

    return {
      parkingSpaceLength,
      startPosition,
      startAngleRads,
      movie,
    };
  }
}
