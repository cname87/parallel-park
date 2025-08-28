import { Injectable } from '@angular/core';
import { CarService } from '../car.service';
import { CalculationService } from '../calculation.service';
import { LoggerService } from '../logger.service';
import { TCondition, EManoeuvre } from '../../shared/types';
import { LoggingLevel } from '../../shared/types';
import { IParams } from '../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class RulesService {
  constructor(
    private calc: CalculationService,
    private logger: LoggerService,
  ) {}

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
    moveLCondition: TCondition;
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
    const horizontalAngle = 0.015;

    /* Set the extra parking space (i.e the space between the front and rear cars minus the length of the car being parked, minus two safety gaps) to a fixed value for rules-based manoeuvres */
    const grossExtraParkingSpace = 1200 / config.distScale;
    const extraParkingSpace = grossExtraParkingSpace - 2 * street.safetyGap;

    /* Starting distance car side is out from the front car */
    /* The starting side y-axis position to the PP is a fixed default minus the safety gap which meaans the car side is the fixed default distance out from the front car */
    const baseStartDistYToPivot = 500 / config.distScale;
    const startDistYToPivot = baseStartDistYToPivot - street.safetyGap;

    /* The switch statement sets different rules for each manoeuvre */
    switch (manoeuvre) {
      case EManoeuvre.Park4UsingRules1:
        /* The starting rear bumper x-axis position to the PP is the safety gap which is equivalent to the car rear bumper being level with the rear bumper of the front car */
        startDistXToPivot = street.safetyGap;
        /* Rotate until a line through the port side of the car intersects the kerb at a point that is a fixed distance forward from the rear car front bumper. */
        moveDCondition = (carInUse: CarService, _tick: any) => {
          const moveDProjectedDistFromRearCar = 1250 / config.distScale;
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
                moveDProjectedDistFromRearCar,
            ) < 1
          );
        };
        /* If the rear starboard corner gets closer to the rear car than the configured minimum distance then stop. Otherwise reverse until the car front port corner is level or beyond the rear bumper of the front car + safety gap, and the rear port corner is within a given distance of the kerb. */
        moveFCondition = (carInUse: CarService, _tick: any) => {
          const tooCloseToRearCar =
            carInUse.readRearStarboardCorner.x -
              street.rearCarCorner.x -
              street.safetyGap -
              distFromRearCarMin <
            1;
          const beyondPP =
            carInUse.readFrontPortCorner.x -
              street.frontCarCorner.x +
              street.safetyGap <
            1;
          const distFromKerb = 400 / config.distScale;
          const withinKerbDistance =
            carInUse.readRearPortCorner.y - distFromKerb < 0.1;
          return tooCloseToRearCar || (beyondPP && withinKerbDistance);
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
      const isHorizontal = Math.abs(carInUse.readCarRotation) < horizontalAngle;
      return tooCloseToRearCar || touchesKerb || isHorizontal;
    };

    /* Keep turnng the wheels until counter-clockwise, stopping in the center position only if the car is horizontal */
    const moveICondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < horizontalAngle &&
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
      const isHorizontal = Math.abs(carInUse.readCarRotation) < horizontalAngle;
      return collision || isHorizontal;
    };

    /* Keep turning the wheels until clockwise, stopping in the center position only if the car is horizontal */
    const moveKCondition = (carInUse: CarService) => {
      const isHorizontal = Math.abs(carInUse.readCarRotation) < horizontalAngle;
      return isHorizontal &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* Stop the car if, or once, horizontal */
    const moveLCondition = (carInUse: CarService) => {
      const pastHorizontal =
        Math.abs(carInUse.readCarRotation) < horizontalAngle;
      return pastHorizontal;
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
      moveLCondition,
    };
  }
}
