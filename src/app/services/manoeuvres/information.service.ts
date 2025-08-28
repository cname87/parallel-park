/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import { EManoeuvre, ISnackOpen, LoggingLevel } from '../../shared/types';
import { CarService } from '../car.service';
import { ConfigService } from '../config.service';
import { LoggerService } from '../logger.service';
import { StreetService } from '../street.service';

interface IParams {
  readonly manoeuvre: EManoeuvre;
  readonly street: StreetService;
  readonly car: CarService;
  readonly config: ConfigService;
}

@Injectable({
  providedIn: 'root',
})
export class InformationService {
  constructor(private logger: LoggerService) {}

  /**
   * Returns an information message displayed to the user during a move.
   *
   * @returns Information message for a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveFirstSteerMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveFirstSteerMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
        return {
          message:
            'This manoeuvre starts turning late and takes one wide turn only, and enters at a maximum angle',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightMinAngle:
        return {
          message:
            'This manoeuvre starts turning early and enters the parking space at a minimum angle',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightFixedStart:
        return {
          message:
            'This manoeuvre starts turning when the rear axle is opposite the rear car bumper and enters at a medium angle',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park3Rotate1StraightMinAngle:
        return {
          message:
            'This manoeuvre starts turning early and enters the parking space at a minimum angle. It reaches the rear car at an angle and then turns in',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park3UsingRules1:
        return {
          message:
            'Rule 1: Reverse 0.6m out from the front car until the rear bumper of the car is level with the rear bumper of the front car',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message:
            'Condition 1: Start 0.5m out from the front car and reverse until the rear bumper of your car is level with the rear bumper of the front car',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park3UsingRules2:
        return {
          message: 'TBC',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns an information message displayed to the user during a move.
   *
   * @returns Information message for a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveCMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveCMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park3UsingRules1:
        return {
          message:
            'Rule 2: Lock counterclockwise and turn in until your port side mirror lines up with a point 1.25m forward of the rear car',
          snackConfig: {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns an information message displayed to the user during a move.
   *
   * @returns Information message for a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveEMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveEMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park3UsingRules1:
        return {
          message:
            'Rule 3: Straighten the wheel and reverse until the front port corner is in front of the rear bumper of the front car by the required safety gap (0.3m) AND the car is within 0.4m of the kerb',
          snackConfig: {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns an information message displayed to the user during a move.
   *
   * @returns Information message for a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveGMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveGMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park3UsingRules1:
        return {
          message:
            'Rule 4: Lock clockwise and reverse until you are 0.3m, (i.e. the safety gap), from the rear car',
          snackConfig: {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * Returns an information message displayed to the user during a move.
   *
   * @returns Information message for a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveIMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveIMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park3UsingRules1:
        return {
          message:
            'Rule 5: Lock counterclockwise and move forward until you are parallel to the kerb',
          snackConfig: {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightSetManual:
      case EManoeuvre.Park3UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };
}
