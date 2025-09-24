import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import {
  EButtonStatus,
  EButtonLabels,
  ELock,
  EMoveType,
  LoggingLevel,
  TButtonNames,
  TMoveArc,
  TMoveStraight,
  TPoint,
  TSteer,
  EDirection,
  IParams,
  EManoeuvre,
  EDistOut,
} from '../shared/types';
import { CarService } from './car.service';
import { ManoeuvreService } from './manoeuvres/manoeuvre.service';
import { ConfigService } from './config.service';
import { MoveService } from './move.service';
import { StreetService } from './street.service';
import { LoggerService } from './logger.service';
import { DataService } from './data.service';
import { Subscription } from 'rxjs';

/**
 * Allows movement of the car via buttons or keyboard keys.
 */

@Injectable({
  providedIn: 'root',
})
export class ManualMoveService {
  //
  /* Movements are essentially infinite i.e. move until you collide with something or until the key is lifted */
  #infinite = 100000;
  #keydown!: (event: any) => Promise<void>;
  #keyup!: (event: any) => Promise<void>;

  #moveForward: TMoveStraight | TMoveArc = {
    type: () => EMoveType.MoveArc,
    fwdOrReverseFn: () => EDirection.Forward,
    deltaAngleFn: () => this.#infinite,
    deltaPositionFn: () => this.#infinite,
  };

  #moveReverse: TMoveArc = {
    type: () => EMoveType.MoveArc,
    fwdOrReverseFn: () => EDirection.Reverse,
    deltaAngleFn: () => this.#infinite,
    deltaPositionFn: () => this.#infinite,
  };

  #steerCenter: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Center,
  };

  #steerClockwise: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Clockwise,
  };

  #steerCounterlockwise: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Counterclockwise,
  };

  #running: boolean;
  #moveForwardRunning: boolean;
  #moveReverseRunning: boolean;
  #steerCenterRunning: boolean;
  #steerClockwiseRunning: boolean;
  #steerCounterlockwiseRunning: boolean;
  #resetToStreetRunning: boolean;
  #resetToParkedRunning: boolean;

  constructor(
    private mover: MoveService,
    private street: StreetService,
    private car: CarService,
    private manoeuvre: ManoeuvreService,
    private config: ConfigService,
    private logger: LoggerService,
    private data: DataService,
  ) {
    /* Use to lock out repeated moves from one keypress */
    this.#running = false;
    /* Use individual flags to lock out all but the key in operation when you are releasing a key */
    this.#moveForwardRunning = false;
    this.#moveReverseRunning = false;
    this.#steerCenterRunning = false;
    this.#steerClockwiseRunning = false;
    this.#steerCounterlockwiseRunning = false;
    this.#resetToStreetRunning = false;
    this.#resetToParkedRunning = false;
    /* Keydown events */
    this.#keydown = async (event: any): Promise<void> => {
      switch (event.key) {
        /* Move forward and steer clockwise */
        case EButtonLabels.Forward:
          if (!this.#running && !this.#moveForwardRunning) {
            this.#running = true;
            this.#moveForwardRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#moveForward);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Move in reverse and steer clockwise */
        case EButtonLabels.Back:
          if (!this.#running && !this.#moveReverseRunning) {
            this.#running = true;
            this.#moveReverseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#moveReverse);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Steer counterclockwise */
        case EButtonLabels.Left:
          if (!this.#running && !this.#steerCounterlockwiseRunning) {
            this.#running = true;
            this.#steerCounterlockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerCounterlockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Steer center */
        case EButtonLabels.Center:
          if (!this.#running && !this.#steerCenterRunning) {
            this.#running = true;
            this.#steerCenterRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerCenter);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Steer clockwise */
        case EButtonLabels.Right:
          if (!this.#running && !this.#steerClockwiseRunning) {
            this.#running = true;
            this.#steerClockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerClockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Move the car to the start position and reset all */
        case EButtonLabels.Start:
          if (!this.#running && !this.#resetToStreetRunning) {
            this.#running = true;
            this.#resetToStreetRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            /* Default for parallel parking is to start horizontal */
            let startAngle = 0;
            const startPosition: TPoint = {
              x: this.calculateStartPosition().x,
              y: this.calculateStartPosition().y,
            };

            if (this.street.type === 'bay') {
              startAngle = Math.PI / 2;
            }
            this.car.draw(startPosition, startAngle);
            /* Trigger key up and reset all buttons (as no stop move is called) */
            await this.#keyup({ key: EButtonLabels.Start });
            Array.from(this.config.manualModeRunTexts.keys()).map((item) => {
              const btn = this.data.getButton(item);
              if (btn) btn.enableRun();
            });
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        /* Move the car to the parked position and reset all */
        case EButtonLabels.Park:
          if (!this.#running && !this.#resetToParkedRunning) {
            this.#running = true;
            this.#resetToParkedRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            let parkPosition: TPoint;
            if (this.street.type === 'bay') {
              parkPosition = {
                x: this.street.carFromKerb + this.car.length,
                y:
                  this.street.frontCarFromTop -
                  (this.street.parkingSpaceLength - this.car.width) / 2,
              };
            } else {
              parkPosition = {
                x:
                  this.street.rearCarFromLeft +
                  this.street.rearCarLength +
                  this.car.length +
                  (this.street.parkingSpaceLength - this.car.length) / 2,
                y: this.street.carFromKerb + this.car.width,
              };
            }
            this.car.draw(parkPosition, 0);
            await this.#keyup({ key: EButtonLabels.Start });
            Array.from(this.config.manualModeRunTexts.keys()).map((item) => {
              const btn = this.data.getButton(item);
              if (btn) btn.enableRun();
            });
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
      }
    };
    /* Stop ticker on key up */
    this.#keyup = async (event) => {
      switch (event.key) {
        case EButtonLabels.Forward:
          if (this.#moveForwardRunning) {
            this.#running = false;
            this.#moveForwardRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Back:
          if (this.#moveReverseRunning) {
            this.#running = false;
            this.#moveReverseRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Left:
          if (this.#steerCounterlockwiseRunning) {
            this.#running = false;
            this.#steerCounterlockwiseRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Center:
          if (this.#steerCenterRunning) {
            this.#running = false;
            this.#steerCenterRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Right:
          if (this.#steerClockwiseRunning) {
            this.#running = false;
            this.#steerClockwiseRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Start:
          if (this.#resetToStreetRunning) {
            this.#running = false;
            this.#resetToStreetRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Park:
          if (this.#resetToParkedRunning) {
            this.#running = false;
            this.#resetToParkedRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
      }
    };
  }

  #subscriptions: Subscription[] = [];
  #manoeuvreName: EManoeuvre | EDistOut =
    EManoeuvre.Park2Rotate1StraightMinAngle;

  /* Tracks the stop move called observable to reset after a stop move */
  #enableStop = (keyToPress: string): Subscription => {
    /* Subscribe to reset after any move stop */
    return this.data.getStopMoveCalled().subscribe(() => {
      this.#keyup({ key: keyToPress });
      Array.from(this.config.manualModeRunTexts.keys()).map((item) => {
        const btn = this.data.getButton(item);
        if (btn) btn.enableRun();
      });
    });
  };

  /* Tracks the main button to identify when RUN or RESET is clicked */
  #enableButton = (key: TButtonNames, keyToPress: string): Subscription => {
    /* Subscribe to track the button status from the last click */
    const button = this.data.getButton(key);
    if (!button) {
      // Return empty subscription if button doesn't exist yet
      return new Subscription();
    }
    return button.buttonLastClick$
      .pipe(this.logger.tapLog(`${key} button click:`, LoggingLevel.TRACE))
      .subscribe((status: EButtonStatus) => {
        if (status === EButtonStatus.Run) {
          const currentButton = this.data.getButton(key);
          if (currentButton) {
            currentButton.enableReset();
          }
          this.#keydown({ key: keyToPress });
          Array.from(this.config.manualModeRunTexts.keys())
            .filter((item) => item !== key)
            .map((item) => {
              const btn = this.data.getButton(item);
              if (btn) btn.disable();
            });
        }
        if (status === EButtonStatus.Reset) {
          this.#keyup({ key: keyToPress });
          Array.from(this.config.manualModeRunTexts.keys()).map((item) => {
            const btn = this.data.getButton(item);
            if (btn) btn.enableRun();
          });
        }
      });
  };

  /**
   * Calculate start position coordinates
   */
  private calculateStartPosition(): TPoint {
    const parameters: IParams = {
      manoeuvre: this.#manoeuvreName,
      street: this.street,
      car: this.car,
      config: this.config,
    };
    return this.manoeuvre.getStartPosition(parameters);
  }

  /* Called externally to start listening for keyboard events */
  runKeyboard(): void {
    this.logger.log(`Running keyboard operation`, LoggingLevel.TRACE);
    window.addEventListener('keydown', this.#keydown, true);
    window.addEventListener('keyup', this.#keyup, true);

    /* Subscribe to manoeuvre changes to keep local variable updated */
    this.#subscriptions.push(
      this.data.getManoeuvre().manoeuvre$.subscribe((manoeuvre) => {
        this.#manoeuvreName = manoeuvre;
      }),
    );

    /* Track each button */
    for (const [key, value] of this.config.manualModeRunTexts) {
      const keyToPress = value.slice(-2)[0];
      this.#subscriptions.push(this.#enableButton(key, keyToPress));
      this.#subscriptions.push(this.#enableStop(keyToPress));
    }
  }

  /* Called externally to stop listening for keyboard events */
  cancelKeyboard(): void {
    this.logger.log(`Cancelling keyboard operation`, LoggingLevel.DEBUG);
    window.removeEventListener('keydown', this.#keydown, true);
    window.removeEventListener('keyup', this.#keyup, true);
    for (const subscription of this.#subscriptions) {
      subscription.unsubscribe();
    }
  }
}
