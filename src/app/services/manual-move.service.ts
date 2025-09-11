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
} from '../shared/types';
import { CarService } from './car.service';
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

  #moveForwardSteerClockwise: TMoveStraight | TMoveArc = {
    type: () => EMoveType.MoveArc,
    fwdOrReverseFn: () => EDirection.Forward,
    deltaAngleFn: () => this.#infinite,
    deltaPositionFn: () => this.#infinite,
  };

  #moveReverseSteerClockwise: TMoveArc = {
    type: () => EMoveType.MoveArc,
    fwdOrReverseFn: () => EDirection.Reverse,
    deltaAngleFn: () => this.#infinite,
    deltaPositionFn: () => this.#infinite,
  };

  #steerCenter: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Center,
  };

  #steerCounterlockwise: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Counterclockwise,
  };

  #steerClockwise: TSteer = {
    type: () => EMoveType.Steer,
    steeringWheelAngle: ELock.Clockwise,
  };

  #running: boolean;
  #moveForwardSteerClockwiseRunning: boolean;
  #moveReverseSteerClockwiseRunning: boolean;
  #steerCenterRunning: boolean;
  #steerClockwiseRunning: boolean;
  #steerCounterlockwiseRunning: boolean;
  #resetToStreetRunning: boolean;
  #resetToParkedRunning: boolean;

  constructor(
    private mover: MoveService,
    private street: StreetService,
    private car: CarService,
    private config: ConfigService,
    private logger: LoggerService,
    private data: DataService,
  ) {
    /* Lock out repeated moves from one keypress */
    this.#running = false;
    /* Use individual flags to lock out all but the key in operation when you are releasing a key */
    this.#moveForwardSteerClockwiseRunning = false;
    this.#moveReverseSteerClockwiseRunning = false;
    this.#steerCenterRunning = false;
    this.#steerClockwiseRunning = false;
    this.#steerCounterlockwiseRunning = false;
    this.#resetToStreetRunning = false;
    this.#resetToParkedRunning = false;
    this.#keydown = async (event: any): Promise<void> => {
      switch (event.key) {
        case EButtonLabels.Forward:
          if (!this.#running && !this.#moveForwardSteerClockwiseRunning) {
            this.#running = true;
            this.#moveForwardSteerClockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#moveForwardSteerClockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Back:
          if (!this.#running && !this.#moveReverseSteerClockwiseRunning) {
            this.#running = true;
            this.#moveReverseSteerClockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#moveReverseSteerClockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Left:
          if (!this.#running && !this.#steerCounterlockwiseRunning) {
            this.#running = true;
            this.#steerCounterlockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerCounterlockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Center:
          if (!this.#running && !this.#steerCenterRunning) {
            this.#running = true;
            this.#steerCenterRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerCenter);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Right:
          if (!this.#running && !this.#steerClockwiseRunning) {
            this.#running = true;
            this.#steerClockwiseRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            await this.mover.routeMove(this.#steerClockwise);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Start:
          if (!this.#running && !this.#resetToStreetRunning) {
            this.#running = true;
            this.#resetToStreetRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            // const startPosition: TPoint = {
            //   x:
            //     this.street.rearCarFromLeft +
            //     this.street.rearCarLength +
            //     this.street.parkingSpaceLength +
            //     this.config.defaultCarRearForwardFromRearOfFrontCar +
            //     this.car.length,
            //   y:
            //     this.street.carFromKerb +
            //     this.street.frontCarWidth +
            //     this.street.safetyGap +
            //     this.config.defaultCarOutFromSafetyOfFrontCar +
            //     this.car.width,
            // };
            // this.car.draw(startPosition, 0);
            const startPosition: TPoint = {
              x:
                this.street.rearCarFromLeft +
                this.street.rearCarLength +
                175 / this.config.distScale,
              y: this.car.length,
            };
            this.car.draw(startPosition, Math.PI / 2);
            /* Trigger key up and reset all buttons (as no stop move is called) */
            await this.#keyup({ key: EButtonLabels.Start });
            Array.from(this.config.manualModeRunTexts.keys()).map((item) =>
              this.data.getButton(item).enableRun(),
            );
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
        case EButtonLabels.Park:
          if (!this.#running && !this.#resetToParkedRunning) {
            this.#running = true;
            this.#resetToParkedRunning = true;
            this.logger.log(`${event.key} pressed`, LoggingLevel.TRACE);
            const startPosition: TPoint = {
              x:
                this.street.rearCarFromLeft +
                this.street.rearCarLength +
                this.street.safetyGap +
                this.car.length,
              y: this.street.carFromKerb + this.car.width,
            };
            this.car.draw(startPosition, 0);
            this.logger.log(`${event.key} move exit`, LoggingLevel.TRACE);
          }
          break;
      }
    };
    this.#keyup = async (event) => {
      switch (event.key) {
        case EButtonLabels.Forward:
          if (this.#moveForwardSteerClockwiseRunning) {
            this.#running = false;
            this.#moveForwardSteerClockwiseRunning = false;
            this.logger.log(`${event.key} released`, LoggingLevel.TRACE);
            createjs.Ticker.dispatchEvent('stop');
          }
          break;
        case EButtonLabels.Back:
          if (this.#moveReverseSteerClockwiseRunning) {
            this.#running = false;
            this.#moveReverseSteerClockwiseRunning = false;
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

  #enableStop = (keyToPress: string): Subscription => {
    /* Subscribe to reset after any move stop */
    return this.data.getStopMoveCalled().subscribe(() => {
      this.#keyup({ key: keyToPress });
      Array.from(this.config.manualModeRunTexts.keys()).map((item) =>
        this.data.getButton(item).enableRun(),
      );
    });
  };

  #enableButton = (key: TButtonNames, keyToPress: string): Subscription => {
    //
    /* Subscribe to track the button status from the last click */
    return this.data
      .getButton(key)
      .buttonLastClick$.pipe(
        this.logger.tapLog(`${key} button click:`, LoggingLevel.TRACE),
      )
      .subscribe((status: EButtonStatus) => {
        if (status === EButtonStatus.Run) {
          this.data.getButton(key).enableReset();
          this.#keydown({ key: keyToPress });
          Array.from(this.config.manualModeRunTexts.keys())
            .filter((item) => item !== key)
            .map((item) => this.data.getButton(item).disable());
        }
        if (status === EButtonStatus.Reset) {
          this.#keyup({ key: keyToPress });
          Array.from(this.config.manualModeRunTexts.keys()).map((item) =>
            this.data.getButton(item).enableRun(),
          );
        }
      });
  };

  runKeyboard(): void {
    this.logger.log(`Running keyboard operation`, LoggingLevel.TRACE);
    window.addEventListener('keydown', this.#keydown, true);
    window.addEventListener('keyup', this.#keyup, true);
    /* Track each button */
    for (const [key, value] of this.config.manualModeRunTexts) {
      const keyToPress = value.slice(-2)[0];
      this.#subscriptions.push(this.#enableButton(key, keyToPress));
      this.#subscriptions.push(this.#enableStop(keyToPress));
    }
  }

  cancelKeyboard(): void {
    this.logger.log(`Cancelling keyboard operation`, LoggingLevel.DEBUG);
    window.removeEventListener('keydown', this.#keydown, true);
    window.removeEventListener('keyup', this.#keyup, true);
    for (const subscription of this.#subscriptions) {
      subscription.unsubscribe();
    }
  }
}
