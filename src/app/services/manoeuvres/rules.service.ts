import { Injectable } from '@angular/core';
import { CarService } from '../car.service';
import { ConfigService } from '../config.service';
import { StreetService } from '../street.service';
import { CalculationService } from '../calculation.service';
import { LoggerService } from '../logger.service';
import { TCondition, EManoeuvre } from '../../shared/types';
import { LoggingLevel } from '../../shared/types';

interface IParams {
  readonly manoeuvre: EManoeuvre;
  readonly street: StreetService;
  readonly car: CarService;
  readonly config: ConfigService;
}

@Injectable({
  providedIn: 'root',
})
export class RulesService {
  constructor(
    private calc: CalculationService,
    private logger: LoggerService,
  ) {}

  getRules({ manoeuvre, street, car, config }: IParams): {
    carSideOutMed: number;
    carSideOutMin: number;
    carDistXFromBumperMed: number;
    carDistXFromBumperMin: number;
    moveDConditionMed: TCondition;
    moveDConditionMin: TCondition;
    moveFConditionMed: TCondition;
    moveFConditionMin: TCondition;
    moveHCondition: TCondition;
    moveICondition: TCondition;
    moveJCondition: TCondition;
    moveKCondition: TCondition;
    moveLCondition: TCondition;
  } {
    this.logger.log('getRules called', LoggingLevel.TRACE);

    /**
     * * Park by Park3UsingRulesMinAngle manoeuvre constants
     */
    /* Minimum front car out from kerb gap*/
    const baseMinFrontCarOut = 2000 / config.distScale;
    /* Starting distance out from front car */
    const baseSideGaptoFrontCar = 500 / config.distScale;
    /* MedAngle Manoeuvre: Move in by this amount */
    const moveDDistXMed = 400 / config.distScale;
    /* MinAngle Manoeuvre: Aim at this point forward of the rear car */
    const moveDProjectedDistFromRearCarMin = 1250 / config.distScale;
    /* MedAngle: Reverse until this close to kerb */
    const distFromKerbMed = 900 / config.distScale;
    /* MinAngle: Reverse until this close to kerb */
    const distFromKerbMin = 400 / config.distScale;
    /* Reverse until this close to rear car */
    const distFromRearCarMin = config.defaultSafetyGap / config.distScale;

    /* Dummy until I refactor */
    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
        break;
      default:
        break;
    }

    const adjustForFrontCarWidthFactor =
      street.frontCarWidth + street.carFromKerb <= baseMinFrontCarOut ? 0.5 : 1;
    /* Always park at a fixed distance out from the kerb, or else a fixed
    distance out from the front car if the front car is more than a minimum
    distance out from the kerb. The idea is to always park where you park for a
    typical front car */
    const carSideOutMed = Math.max(
      baseMinFrontCarOut + baseSideGaptoFrontCar,
      street.carFromKerb + street.frontCarWidth + baseSideGaptoFrontCar,
    );

    /* Always park at a fixed distance out from the from the front car */
    const carSideOutMin =
      street.carFromKerb + street.frontCarWidth + baseSideGaptoFrontCar;

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
      baseMinFrontCarOut - (street.frontCarWidth + street.carFromKerb);
    const adjustment = adjustForFrontCarWidthFactor * differenceFromBase;
    const carDistXFromBumperMed =
      -car.rearOverhang + street.safetyGap + Math.abs(adjustment);

    /* The starting bumper x-position with repect to the OC is the safety gao which is equivalent to being level with the rear bumper of the front car */
    const carDistXFromBumperMin = street.safetyGap;

    /* Rotate until rear axle side has moved in by a fixed amount. (This is
    equivalent to a rotation of about 30 degrees). The idea is to know how to
    rotate through this distance and not have to adjust angles for different
    situations */
    const moveDConditionMed = (carInUse: CarService, _tick: any) => {
      return carSideOutMed - carInUse.readRearPortAxleSide.y >= moveDDistXMed;
    };

    /* Rotate until a line through the port side of the car intersects the kerb at a point that is a fixed distance forward from the rear car front bumper. */
    const moveDConditionMin = (carInUse: CarService, _tick: any) => {
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
            moveDProjectedDistFromRearCarMin,
        ) < 1
      );
    };

    /* Reverse until the rear port axle is a fixed distance from the kerb */
    /* NOTE:  This can be expressed as a distance from the rear port corner but
    this varies with the rear overhang of the car. Eg it is 300mm for the VW T5
    but 500mm for the Hyundai i10 */
    const moveFConditionMed = (carInUse: CarService, _tick: any) => {
      const distFromKerb = distFromKerbMed;
      return carInUse.readRearPortAxleSide.y - distFromKerb < 0.1;
    };
    /*
    If the rear starboard corner gets closer to the rear car than the configured
    minimum distance then stop.
    Otherwise reverse until the car front port corner is level with the rear
    bumper of the front car + safety gap and the rear port corner is within a
    given distance of the kerb.
     */
    const moveFConditionMin = (carInUse: CarService, _tick: any) => {
      return (
        carInUse.readRearStarboardCorner.x -
          street.rearCarCorner.x -
          street.safetyGap -
          distFromRearCarMin <
          1 ||
        (carInUse.readFrontPortCorner.x -
          street.frontCarCorner.x +
          street.safetyGap <
          1 &&
          carInUse.readRearPortCorner.y - distFromKerbMin < 1)
      );
    };

    /* Rotate in until the car comes within the allowed distance of the rear
    car or is horizontal */
    const moveHCondition = (carInUse: CarService, _tick: unknown) => {
      const tooClose =
        carInUse.readRearStarboardCorner.x -
          street.rearCarCorner.x -
          street.safetyGap -
          distFromRearCarMin <
        1;
      const isHorizontal = Math.abs(carInUse.readCarRotation) < 0.001;
      return tooClose || isHorizontal;
    };

    /* Keep turnng the wheels until counter-clockwise, stopping in the center position only if the car is horizontal */
    const moveICondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < 0.01 &&
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
      const isHorizontal = carInUse.readCarRotation < 0.001;
      return collision || isHorizontal;
    };

    /* Keep turning the wheels until clockwise, stopping in the center position only if the car is horizontal */
    const moveKCondition = (carInUse: CarService) => {
      return Math.abs(carInUse.readCarRotation) < 0.01 &&
        Math.abs(carInUse.readFrontPortWheelRotation) < 0.01
        ? true
        : false;
    };

    /* If the car is horizontal then stop */
    const moveLCondition = (carInUse: CarService) => {
      return carInUse.readCarRotation < 0.01;
    };

    return {
      carSideOutMed,
      carSideOutMin,
      carDistXFromBumperMed,
      carDistXFromBumperMin,
      moveDConditionMed,
      moveDConditionMin,
      moveFConditionMed,
      moveFConditionMin,
      moveHCondition,
      moveICondition,
      moveJCondition,
      moveKCondition,
      moveLCondition,
    };
  }
}
