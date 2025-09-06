/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import { EManoeuvre, ISnackOpen, LoggingLevel } from '../../shared/types';
import { LoggerService } from '../logger.service';
import { ConfigService } from '../config.service';
import { CarService } from '../car.service';
import { StreetService } from '../street.service';
import { RulesService } from './rules.service';

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
  constructor(
    private logger: LoggerService,
    private rules: RulesService,
    private config: ConfigService,
  ) {}

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveFirstSteerMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveFirstSteerMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate1StraightMinAngle:
        return {
          message:
            'This manoeuvre starts turning early and enters the parking space at the minimum angle.',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate0Straight:
        return {
          message:
            'This manoeuvre starts turning late and takes one wide turn only, with no straight reverse, and enters at the maximum angle',
          snackConfig: {
            duration: this.config.infoMessageDuration,
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
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: 'This manoeuvre uses manually set parameters',
          snackConfig: {
            duration: this.config.infoMessageDuration,
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
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 1: Start with an extra ' +
            this.rules.r1_grossExtraParkingSpace * this.config.distScale +
            'mm parking space, and start ' +
            this.rules.r1_startDistYToRearCarSide * this.config.distScale +
            'mm out from the front car',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: 'Rule 1: TBC',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveBMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveBMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 1: Reverse until the rear bumper of the car is ' +
            this.rules.r1_startDistXToRearCarBumper * this.config.distScale +
            'mm beyond the rear bumper of the rear car',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveDMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveDMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 2: Rotate until the inner side of the car is inline with a point ' +
            this.rules.r1_moveDProjectedDistFromRearCar *
              this.config.distScale +
            'mm forward of the parked rear car',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: 'custom-snackbar',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: 'Rule 2: TBC',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
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
  getMoveFMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveFMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 3: If the rear outer corner gets closer to the rear car than the minimum distance then stop. Otherwise reverse until the car front inner corner is beyond the rear bumper of the front parked car by ' +
            this.rules.r1_beyondRearBumperDist * this.config.distScale +
            'mm the minimum distance AND the rear inner corner is within ' +
            this.rules.r1_distFromKerb * this.config.distScale +
            'mm of the kerb.',
          snackConfig: {
            duration: this.config.infoMessageDuration + 2000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveHMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveHMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 5: Rotate in until the car comes within the allowed distance of the rear car, touches the kerb, or is horizontal',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveIMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveIMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message:
            'Rule 6: Rotate forward until you touch the front parked car',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };

  /**
   * @returns Returns an information message displayed to the user during a move.
   *
   * @throws Error
   * Thrown if an invalid manoeuvre is passed in.
   */
  getMoveLMessage = ({ manoeuvre }: IParams): ISnackOpen => {
    this.logger.log(`getMoveLMessage called`, LoggingLevel.TRACE);

    switch (manoeuvre) {
      case EManoeuvre.Park2Rotate0Straight:
      case EManoeuvre.Park2Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightFixedStart:
      case EManoeuvre.Park3Rotate1StraightMinAngle:
      case EManoeuvre.Park2Rotate1StraightSetManual:
        return {
          message: '',
        };
      case EManoeuvre.Park4UsingRules1:
        return {
          message: 'Rule 7: Rotate backwards until parallel with the kerb',
          snackConfig: {
            duration: this.config.infoMessageDuration,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: false,
        };
      case EManoeuvre.Park4UsingRules2:
        return {
          message: '',
        };
      default:
        throw new Error('Unexpected manoeuvre');
    }
  };
}
