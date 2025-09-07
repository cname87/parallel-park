import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';
import { CarService } from '../car.service';
import { CalculationService } from '../calculation.service';
import { LoggerService } from '../logger.service';
import {
  TCondition,
  EManoeuvre,
  EDirection,
  EMoveType,
  TMoveStraight,
  TMoveStraightOrArc,
} from '../../shared/types';
import { LoggingLevel } from '../../shared/types';
import { IParams } from '../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class RulesService {
  public r1_grossExtraParkingSpace: number;
  public r1_startDistXToRearCarBumper: number;
  public r1_startDistYToRearCarSide: number;
  public r1_moveDProjectedDistFromRearCar: number;
  public r1_beyondRearBumperDist: number;
  public r1_distFromKerb: number;

  constructor(
    private calc: CalculationService,
    private logger: LoggerService,
    private config: ConfigService,
  ) {
    this.r1_grossExtraParkingSpace = 1200 / this.config.distScale;
    this.r1_startDistXToRearCarBumper = -300 / this.config.distScale;
    this.r1_startDistYToRearCarSide = 500 / this.config.distScale;
    this.r1_moveDProjectedDistFromRearCar = 1250 / this.config.distScale;
    this.r1_distFromKerb = 200 / config.distScale;
    this.r1_beyondRearBumperDist = -this.config.defaultSafetyGap;
  }

  /* The getRules function returns the rules for the rules-based manoeuvres. Park4UsingRules1 is the key manoeuvre used for testing and coming up with an algorithm for parking. It has a stable implementation - see detail below. Park4UsingRules2 can be used for experimental testing and does not necessarily have a stable implementation. */

  getRules({ manoeuvre, street, car, config }: IParams): {
    extraParkingSpace: number;
    startDistXToPivot: number;
    startDistYToPivot: number;
    moveDCondition: TCondition;
    moveFCondition: TCondition;
    moveHCondition: TCondition;
    moveICondition: TCondition;
    moveJCondition: TCondition;
    moveKCondition: TCondition;
    moveL: TMoveStraight | TMoveStraightOrArc;
    moveMCondition: TCondition;
    moveN: TMoveStraight | TMoveStraightOrArc;
    moveP: TMoveStraight;
  } {
    this.logger.log('getRules called', LoggingLevel.TRACE);

    /* Limit to how close the car can get to the rear car for all manoeuvres */
    const distFromRearCarMin = config.defaultSafetyGap / config.distScale;
    /* Starting distance car bumper is out from the front car */
    let startDistXToPivot: number;
    /* Condition that stops the first rotation */
    let moveDCondition: TCondition = () => false;
    /* Condition that stops the straight reverse */
    let moveFCondition: TCondition = () => false;
    /* Horizontal test must not be less than a certain value as the readCarRotation angle will go from a positive value to a negative value at a certain point */
    const horizontalTestAngle = 0.015;

    /* Set the extra parking space (i.e the space between the front and rear cars minus the length of the car being parked, minus two safety gaps) to a fixed value for rules-based manoeuvres */
    const extraParkingSpace =
      this.r1_grossExtraParkingSpace - 2 * street.safetyGap;

    /* Starting distance car side is out from the front car */
    /* The starting side y-axis position to the PP is a fixed default minus the safety gap which meaans the car side is the fixed default distance out from the front car */
    const startDistYToPivot =
      this.r1_startDistYToRearCarSide - street.safetyGap;

    const midPoint =
      street.rearCarFromLeft +
      street.rearCarLength +
      street.safetyGap +
      car.length +
      extraParkingSpace / 2;

    /* The switch statement sets different rules for each manoeuvre */
    switch (manoeuvre) {
      case EManoeuvre.Park4UsingRules1:
        /* The starting rear bumper x-axis position to the PP is the safety gap which is equivalent to the car rear bumper being level with the rear bumper of the front car */
        startDistXToPivot =
          this.r1_startDistXToRearCarBumper + street.safetyGap;
        /* Rotate until a line through the port side of the car intersects the kerb at a point that is a fixed distance forward from the rear car front bumper. This is the most critical move in the manoeuvre. */
        moveDCondition = (carInUse: CarService, _tick: any) => {
          return (
            Math.abs(
              /* Rear axle x-axis value */
              carInUse.readRearPortAxleSide.x -
                /* How far the car will move in the x-axis direction before it intersects the kerb */
                carInUse.readRearPortAxleSide.y /
                  Math.tan(carInUse.readCarRotation) -
                /* Rear car corner x-axis value */
                street.rearCarCorner.x -
                /* Distance in front of the rear car of the intersection point of a line through the port side to the kerb */
                this.r1_moveDProjectedDistFromRearCar,
            ) < 1
          );
        };
        /* If the rear outer corner gets closer to the rear car than the configured minimum distance, or the rear inner corner is gets within a given distance of the kerb, or the car front inner corner is beyond the rear bumper of the front car by a given amount then stop */
        moveFCondition = (carInUse: CarService, _tick: any) => {
          const tooCloseToRearCar =
            carInUse.readRearStarboardCorner.x -
              street.rearCarCorner.x -
              street.safetyGap -
              distFromRearCarMin <
            1;
          const rearBumperRelativePosition =
            carInUse.readFrontPortCorner.x - street.frontCarCorner.x;
          const beyondRearBumper =
            rearBumperRelativePosition - this.r1_beyondRearBumperDist < 0.1;
          const withinKerbDistance =
            carInUse.readRearPortCorner.y - this.r1_distFromKerb < 0.1;
          return tooCloseToRearCar || (beyondRearBumper && withinKerbDistance);
        };
        break;
      case EManoeuvre.Park4UsingRules2:
        /* The starting rear bumper x-axis position to the PP is minus the car rear overhang plus the safety gap which is equivalent to the car rear axle being level with the rear axle of the front car */
        startDistXToPivot = -car.rearOverhang + street.safetyGap;
        /* Rotate until rear axle side has moved in by a fixed amount. (This is
        equivalent to a rotation of about 30 degrees). The idea is to know how to rotate through this distance and not have to adjust angles for different situations */
        moveDCondition = (carInUse: CarService, _tick: any) => {
          const distRearPortAxleMove = 350 / config.distScale;
          return (
            street.carFromKerb +
              street.frontCarWidth +
              config.defaultSafetyGap +
              startDistYToPivot -
              carInUse.readRearPortAxleSide.y >=
            distRearPortAxleMove
          );
        };
        /* Reverse until the rear port corner is either within the fixed safety distance to the rear car or within a fixed distance from the kerb */
        /* NOTE: The rear port corner distance to the kerb will vary with the rear overhang of the car so this figure must be adjusted for each chosen car.  You could use the rear axle distance to the kerb which does not vary between cars but this is harder to judge as a driver. */
        moveFCondition = (carInUse: CarService, _tick: any) => {
          const tooCloseToRearCar =
            carInUse.readRearStarboardCorner.x -
              street.rearCarCorner.x -
              street.safetyGap -
              distFromRearCarMin <
            1;
          const distFromKerb = 250 / config.distScale;
          const withinKerbDistance =
            carInUse.readRearPortCorner.y - distFromKerb < 0.1;
          return tooCloseToRearCar || withinKerbDistance;
        };
        break;
      default:
        throw new Error('Unexpected manoeuvre');
    }
    /* Rotate in until the car comes within the allowed distance of the rear
    car, touches the kerb, or is horizontal */
    const moveHCondition = (carInUse: CarService, _tick: unknown) => {
      const tooCloseToRearCar =
        carInUse.readRearStarboardCorner.x -
          street.rearCarCorner.x -
          street.safetyGap -
          distFromRearCarMin <
        1;
      const touchesKerb = carInUse.readRearPortCorner.y <= 0;
      const isHorizontal =
        Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
      return tooCloseToRearCar || touchesKerb || isHorizontal;
    };

    /* Keep turnng the wheels until counter-clockwise, stopping in the center position only if the car is horizontal */
    const moveICondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < horizontalTestAngle &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* Rotate in until the car touches the safety gap of the front car or is
    horizontal */
    const moveJCondition = (carInUse: CarService, tick: unknown) => {
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
      const isHorizontal =
        Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
      return collision || isHorizontal;
    };

    /* Keep turning the wheels until clockwise, stopping in the center position only if the car is horizontal */
    const moveKCondition = (carInUse: CarService) => {
      const isHorizontal =
        Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
      return isHorizontal &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* If the car is horizontal, the move is a straight move and positions the car as it moves forward or reverse into the middle of the parking space. If the car is not horizontal then it is reverse rotation to the horizontal position. */
    const moveL = {
      type: (carInUse: CarService) => {
        return Math.abs(carInUse.readCarRotation) < horizontalTestAngle
          ? EMoveType.MoveStraight
          : EMoveType.MoveArc;
      },
      fwdOrReverseFn: () => EDirection.Reverse,
      /* Return a large angle as the condition will stop the rotation */
      deltaAngleFn: () => 0.5 * Math.PI,
      deltaPositionFn: (carInUse: CarService) => {
        return Math.abs(carInUse.readFrontStarboardCorner.x - midPoint);
      },
      condition: () => {
        return (carInUse: CarService) => {
          const pastHorizontal =
            Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
          return pastHorizontal;
        };
      },
    };

    /* Keep turning the wheels until clockwise, stopping in the center position only if the car is horizontal */
    const moveMCondition = (carInUse: CarService) => {
      const isHorizontal =
        Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
      return isHorizontal &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* If the car is horizontal, the move is a straight move and positions the car as it moves forward or reverse into the middle of the parking space. If the car is not horizontal then it is forward rotation to the horizontal position. */
    const moveN = {
      type: (carInUse: CarService) => {
        return Math.abs(carInUse.readCarRotation) < horizontalTestAngle
          ? EMoveType.MoveStraight
          : EMoveType.MoveArc;
      },
      fwdOrReverseFn: () => EDirection.Forward,
      /* Return a large angle as the condition will stop the rotation */
      deltaAngleFn: () => 0.5 * Math.PI,
      deltaPositionFn: (carInUse: CarService) => {
        return Math.abs(carInUse.readFrontStarboardCorner.x - midPoint);
      },
      condition: () => {
        return (carInUse: CarService) => {
          const pastHorizontal =
            Math.abs(carInUse.readCarRotation) < horizontalTestAngle;
          return pastHorizontal;
        };
      },
    };

    /* The move is a straight move and positions the car as it moves forward or reverse into the middle of the parking space. */
    const moveP = {
      type: (): EMoveType.MoveStraight => EMoveType.MoveStraight,
      fwdOrReverseFn: (carInUse: CarService) =>
        carInUse.readFrontStarboardCorner.x - midPoint > 0
          ? EDirection.Reverse
          : EDirection.Forward,
      deltaPositionFn: (carInUse: CarService) => {
        return Math.abs(carInUse.readFrontStarboardCorner.x - midPoint);
      },
      condition: () => {
        return (_carInUse: CarService) => {
          return false;
        };
      },
    };

    return {
      extraParkingSpace,
      startDistXToPivot,
      startDistYToPivot,
      moveDCondition,
      moveFCondition,
      moveHCondition,
      moveICondition,
      moveJCondition,
      moveKCondition,
      moveL,
      moveMCondition,
      moveN,
      moveP,
    };
  }
}
