import { Injectable } from '@angular/core';
import { MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import * as createjs from 'createjs-module';
import {
  EButtonStatus,
  EDirection,
  EMoveType,
  ERotateDirection,
  LoggingLevel,
  TMoveArc,
  TMoveStraight,
  TPoint,
  TSteer,
  TSteerAngle,
} from '../shared/types';
import { CalculationService } from './calculation.service';
import { CarService } from './car.service';
import { ConfigService } from './config.service';
import { SnackbarService } from './snackbar.service';
import { LoggerService } from './logger.service';
import { DataService } from './data.service';
import { BehaviorSubject } from 'rxjs';

/**
 * Moves the car.
 */

@Injectable({
  providedIn: 'root',
})
export class MoveService {
  //
  #buttonLastClickStatus = EButtonStatus.Run;
  #pause = false;
  #pauseSnackRef: MatSnackBarRef<TextOnlySnackBar> | undefined = undefined;

  #stopMoveCalled = new BehaviorSubject<boolean>(false);
  #stopMoveCalled$ = this.#stopMoveCalled.asObservable();

  constructor(
    private config: ConfigService,
    private car: CarService,
    private calc: CalculationService,
    private data: DataService,
    private snack: SnackbarService,
    private logger: LoggerService,
  ) {
    this.snack.pause$.subscribe(
      (snackRef: MatSnackBarRef<TextOnlySnackBar>) => {
        this.#pause = true;
        this.#pauseSnackRef = snackRef;
        snackRef.afterDismissed().subscribe(() => {
          this.#pause = false;
        });
      },
    );

    this.data.setStopMoveCalled(this.#stopMoveCalled$);
  }

  /* Track the button status */
  /* Called by the root program when the button is enabled */
  public trackButton(): void {
    this.data
      .getButton('main')
      .buttonLastClick$.pipe(
        this.logger.tapLog('Move Service Button click:', LoggingLevel.DEBUG),
      )
      .subscribe((data: EButtonStatus) => {
        this.#buttonLastClickStatus = data;
        if (data === EButtonStatus.Reset) {
          this.#pauseSnackRef?.dismiss();
        }
      });
  }

  /**
   * Stops a move i.e. stops all listeners, including the 'tick' listener.
   * @param eventObjOrResolve If called from a listener then a createjs event is passed in as the first parameter.  If called directly then null is passed in as the first parameter.
   * @param resolveFn If called from a listener then the resolve function is passed in as the second parameter.  If called directly then also the resolve function is passed is as the second paramter.
   */
  private stop = (
    eventObjOrMove: any,
    resolve: (value: void | PromiseLike<void>) => void,
  ) => {
    createjs.Ticker.removeAllEventListeners('tick');
    createjs.Ticker.removeAllEventListeners('stop');

    /* Used by manual move service to know that move stopped */
    this.#stopMoveCalled.next(true);

    this.logger.log(`**********************`);

    switch (eventObjOrMove) {
      case 'steer':
        this.logger.log(`Front wheels stopped at:`);
        this.logger.log(
          `Front startboard wheel angle: ${Math.round(
            this.car.readFrontStarboardWheelRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        this.logger.log(
          `Front port wheel angle: ${Math.round(
            this.car.readFrontPortWheelRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        break;
      case '  moveArc':
        this.logger.log(`Rotation move stopped at:`);
        this.logger.log(
          `Car Rotation: ${this.config.round(
            this.car.readCarRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        this.logger.log(
          `Car Starboard-Side Corner X: ${this.config.round(
            (this.car.readFrontStarboardCorner.x * this.config.distScale) /
              1000,
          )}m`,
        );
        this.logger.log(
          `Car Starboard-Side Corner Y: ${this.config.round(
            (this.car.readFrontStarboardCorner.y * this.config.distScale) /
              1000,
          )}m`,
        );
        break;
      case 'moveStraight':
        this.logger.log(`Straight move stopped at:`);
        this.logger.log(
          `Car Starboard-Side Corner X: ${this.config.round(
            (this.car.readFrontStarboardCorner.x * this.config.distScale) /
              1000,
          )}m`,
        );
        this.logger.log(
          `Car Starboard-Side Corner Y: ${this.config.round(
            (this.car.readFrontStarboardCorner.y * this.config.distScale) /
              1000,
          )}m`,
        );
        break;
      default:
        this.logger.log(`Keyboard move stopped`);
        this.logger.log(
          `Front startboard wheel angle: ${Math.round(
            this.car.readFrontStarboardWheelRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        this.logger.log(
          `Front port wheel angle: ${Math.round(
            this.car.readFrontPortWheelRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        this.logger.log(
          `Car Rotation: ${this.config.round(
            this.car.readCarRotation * this.config.RAD_TO_DEG,
          )} degrees`,
        );
        this.logger.log(
          `Car Starboard-Side Corner X: ${this.config.round(
            (this.car.readFrontStarboardCorner.x * this.config.distScale) /
              1000,
          )}m`,
        );
        this.logger.log(
          `Car Starboard-Side Corner Y: ${this.config.round(
            (this.car.readFrontStarboardCorner.y * this.config.distScale) /
              1000,
          )}m`,
        );
        break;
    }

    this.logger.log(`**********************`);
    return resolve;
  };

  private getSlowRamp = (tickNumber: number) => {
    /* Ramp up speed from a configured start to full speed over a configured number of ticks */
    let slowRamp = 1;
    if (tickNumber++ <= this.config.rampTicks) {
      slowRamp =
        this.config.rampStart +
        ((1 - this.config.rampStart) * tickNumber) / this.config.rampTicks;
    }
    return slowRamp;
  };

  /**
   * This moves the car in the direction it is facing, or the reverse.  There is no change in the angle of rotation of the car.
   * @param fwdOrReverseFn: A function that can take the car instance as an argument and returns an EDirection enum to move forward (+1) or reverse (-1).
   * @param deltaPositionFn: A function that can take the car instance as an argument and returns a number representing the distance to move the car in scaled millimeters.
   * @param condition: A function which takes the car instance as an argument and returns true or false.  It is used to stop the move when true is returned.
   * @param speed The speed of the move in mm per second. It defaults to the value set in the config service.
   * @returns A promise that resolves when the move is complete OR the car collides with the canvas edge or collides with one of the two parked cars, OR the supplied condition returns true.
   */

  public async moveStraight({
    fwdOrReverseFn,
    deltaPositionFn,
    condition = (_car: CarService) => (_carInUse: CarService, _tick?: any) =>
      false,
    speed = this.config.defaultSpeed,
  }: TMoveStraight): Promise<void> {
    //
    return new Promise<void>(async (resolve, _reject) => {
      //
      /* Used by keyboard mover to stop - must precede the async call to the steer method */
      createjs.Ticker.on(
        'stop',
        {
          handleEvent: () => {
            const resolveReturned = this.stop(null, resolve);
            resolveReturned();
          },
        },
        null as any,
        false,
        /* Passed as second parameter to the handleEvent function */
        resolve,
      );

      /* Read the direction and the distance to be moved from the input functions.  This allows these values to be calculated dependent on car instance values. */
      const fwdOrReverse = fwdOrReverseFn(this.car);
      const deltaPosition = deltaPositionFn(this.car);

      /* Calculate the distance moved in 1 tick */
      createjs.Ticker.framerate = this.config.FPS;
      const tickTime = 1 / this.config.FPS;
      const tickMoveX =
        fwdOrReverse * speed * tickTime * Math.cos(this.car.readCarRotation);
      const tickMoveY =
        fwdOrReverse * speed * tickTime * Math.sin(this.car.readCarRotation);
      const tickMove = {
        x: tickMoveX,
        y: tickMoveY,
      };

      const startCarContainer = {
        x: this.car.carContainer.x,
        y: this.car.carContainer.y,
      };

      /* Calculate the distance to move */
      const totalMoveX = deltaPosition * Math.cos(this.car.readCarRotation);
      const totalMoveY = deltaPosition * Math.sin(this.car.readCarRotation);
      const distanceToMove: TPoint = {
        x: fwdOrReverse * totalMoveX,
        y: fwdOrReverse * totalMoveY,
      };

      /**
       * Called by the tick listener created below.
       * It moves the required distance in a series of ticks.
       */
      let tickNumber = 0;
      const onTickLinear: { handleEvent: (_e: any) => void } = {
        //
        handleEvent: (_e: any) => {
          //
          /* If paused then simply exit */
          if (this.#pause === true) {
            return;
          }
          const slowRamp = this.getSlowRamp(tickNumber++);

          const leftToMove = {
            x: startCarContainer.x + distanceToMove.x - this.car.carContainer.x,
            y: startCarContainer.y + distanceToMove.y - this.car.carContainer.y,
          };

          /* Don't overshoot the required x or y distance */
          if (Math.abs(leftToMove.x) < Math.abs(tickMove.x)) {
            this.car.carContainer.x += leftToMove.x;
          }
          if (Math.abs(leftToMove.y) < Math.abs(tickMove.y)) {
            this.car.carContainer.y += leftToMove.y;
          }
          /* Move full speed if room to move */
          if (Math.abs(leftToMove.x) >= Math.abs(tickMove.x)) {
            this.car.carContainer.x += slowRamp * tickMove.x;
          }
          if (Math.abs(leftToMove.y) > Math.abs(tickMove.y)) {
            this.car.carContainer.y += slowRamp * tickMove.y;
          }

          this.config.stage.update();

          /* Console debug */
          // this.logger.log(`moveLinear loop...`);
          // this.logger.log(`Start carContainer.x: ${startCarContainer.x}`);
          // this.logger.log(`Start carContainer.y: ${startCarContainer.y}`);
          // this.logger.log(`Delta carContainer.x: ${distanceToMove.x}`);
          // this.logger.log(`Delta carContainer.y: ${distanceToMove.y}`);
          // this.logger.log(`Current carContainer.x: ${this.car.carContainer.x}`);
          // this.logger.log(`Current carContainer.y: ${this.car.carContainer.y}`);
          // this.logger.log(
          //   `Left to move.x: ${
          //     startCarContainer.x + distanceToMove.x - this.car.carContainer.x
          //   }`,
          // );
          // this.logger.log(
          //   `Left to move.y: ${
          //     startCarContainer.y + distanceToMove.y - this.car.carContainer.y
          //   }`,
          // );

          /* Check if the stop condition is met */
          const stop = condition(this.car)(this.car, tickMove);
          /* Check for a collision */
          const collision = this.calc.checkCollision(this.car);
          /* Check if move is complete */
          /* Note: Caution comparing floating point numbers */
          const bigNum = 100000;
          const complete =
            Math.round(this.car.carContainer.x * bigNum) ===
              Math.round((startCarContainer.x + distanceToMove.x) * bigNum) &&
            Math.round(this.car.carContainer.y * bigNum) ===
              Math.round((startCarContainer.y + distanceToMove.y) * bigNum);
          if (collision) {
            /* Clear collision */
            this.car.carContainer.x -= tickMove.x;
            this.car.carContainer.y -= tickMove.y;
          }
          if (
            stop ||
            collision ||
            complete ||
            this.#buttonLastClickStatus === EButtonStatus.Reset
          ) {
            const resolveReturned = this.stop('moveStraight', resolve);
            resolveReturned();
          }
        },
      };

      /* Create a tick listener and pass it an object with a handleEvent property */
      createjs.Ticker.on('tick', onTickLinear);
    });
  }

  /** This rotates the car i.e. it reads the front wheel postion from the car instance and moves the car when the wheels are turned either clockwise or counterclockwise from its center position.  If the wheels are centered it calls the method to move the car in a straight line.
   * @param fwdOrReverseFn: A function that can take the createjs car container as an argument and returns an EDirection enum to move forward (+1) or reverse (-1).
   * @param deltaAngleFn: A function that can take the car instance as an argument and returns a number representing the desired change in angle of the car in radians.
   * @param deltaPositionFn: A function that can take the car instance as an argument and returns a number representing the distance to move the car in scaled millimeters.  This is only used if the front wheels are centered.
   * @param condition: A function which takes the car instance as an argument and returns true or false.  It is used to stop the move when true is returned.
   * @param speed The speed of the move along the arc in mm per second. It defaults to the value set in the config service.
   * @returns A promise that resolves when the move is complete OR the car collides with the canvas edge or collides with one of the two parked cars, OR the supplied condition returns true.
   */
  public async moveArc({
    fwdOrReverseFn,
    deltaAngleFn,
    deltaPositionFn = () => 0,
    condition = (_car: CarService) => (_carInUse: CarService, _tick?: any) =>
      false,
    speed = this.config.defaultSpeed,
  }: TMoveArc): Promise<void> {
    /* When wheels are straight, e.g. for a keyboard call, the call is passed to a move straight call */
    if (
      this.car.readFrontStarboardWheelRotation === 0 ||
      this.car.readFrontPortWheelRotation === 0
    ) {
      await this.moveStraight({
        type: () => EMoveType.MoveStraight,
        fwdOrReverseFn,
        deltaPositionFn,
        deltaAngleFn,
        condition,
        speed,
      });
      return Promise.resolve();
    }

    return new Promise<void>(async (resolve, _reject) => {
      //
      /* Used by keyboard mover to stop - must precede the async call to the steer method */
      createjs.Ticker.on(
        'stop',
        {
          handleEvent: () => {
            const resolveReturned = this.stop(null, resolve);
            resolveReturned();
          },
        },
        null as any,
        false,
        /* Passed as second parameter to the handleEvent function */
        resolve,
      );

      /* Read the direction and the distance to be moved from the input functions.  This allows these values to be calculated dependent on car instance values. */
      const fwdOrReverse = fwdOrReverseFn(this.car);
      let deltaAngle = deltaAngleFn(this.car);

      let steeringWheelAngle: TSteerAngle = 0;
      const rotationDirection: ERotateDirection = Math.sign(
        this.car.readFrontStarboardWheelRotation,
      );
      let angleSign = 0;

      /**
       * Set the sign of the required rotation which is dependent on the steeringwheel position and the direction of travel.
       * Also set the steering wheel angle which is the ratio of the rotation of the wheel on the inner side of the circle of rotation, which is turned most, to that wheel's maximum turn angle.
       * Note: See how angles are measured in the car service.
       */

      /* If going forward with counterclockwise steeringwheel the angle moved by the car will be negative */
      if (
        fwdOrReverse === EDirection.Forward &&
        rotationDirection === ERotateDirection.Counterclockwise
      ) {
        angleSign = -1;
        steeringWheelAngle =
          this.car.readFrontPortWheelRotation /
          this.car.maxFrontPortWheelAngle();
      }
      /* If going forward with clockwise steeringwheel the angle moved by the car will be positive */
      if (
        fwdOrReverse === EDirection.Forward &&
        rotationDirection === ERotateDirection.Clockwise
      ) {
        angleSign = +1;
        steeringWheelAngle =
          this.car.readFrontStarboardWheelRotation /
          this.car.maxFrontStarboardWheelAngle();
      }
      /* If going reverse with counterclockwise steeringwheel the angle moved by he car will be positive */
      if (
        fwdOrReverse === EDirection.Reverse &&
        rotationDirection === ERotateDirection.Counterclockwise
      ) {
        angleSign = +1;
        steeringWheelAngle =
          this.car.readFrontPortWheelRotation /
          this.car.maxFrontPortWheelAngle();
      }
      /* If going reverse with clockwise steeringwheel the angle moved by the car will be negative */
      if (
        fwdOrReverse === EDirection.Reverse &&
        rotationDirection === ERotateDirection.Clockwise
      ) {
        angleSign = -1;
        steeringWheelAngle =
          this.car.readFrontStarboardWheelRotation /
          this.car.maxFrontStarboardWheelAngle();
      }
      deltaAngle = angleSign * deltaAngle;

      /* Move and change the center of rotation if necessary */
      this.car.moveCenterOfRotation(steeringWheelAngle);
      this.car.changeCentersOfRotation(steeringWheelAngle);

      /* Calculate the angle turned in 1 tick */
      createjs.Ticker.framerate = this.config.FPS;
      const tickTime = 1 / this.config.FPS;
      const tickMove = angleSign * speed * tickTime; // The distance moved along the arc
      const tickAngle = tickMove / this.car.turningRadius(steeringWheelAngle);

      /* Calculate the start end angle */
      const startAngle = this.car.readCarRotation;
      const endAngle = startAngle + deltaAngle;

      /**
       * Move the required distance in a series of ticks.
       */
      let tickNumber = 0;
      const onTickRotate: { handleEvent: (_e: any) => void } = {
        handleEvent: (_e: any) => {
          //
          /* If paused then simply exit */
          if (this.#pause === true) {
            return;
          }

          const slowRamp = this.getSlowRamp(tickNumber++);

          const leftToMove = endAngle - this.car.readCarRotation;
          if (Math.abs(leftToMove) < Math.abs(tickAngle)) {
            /* Don't overshoot the required distance */
            this.car.readCarRotation = endAngle;
          } else {
            this.car.readCarRotation += slowRamp * tickAngle;
          }

          this.config.stage.update();

          /* Console debug */
          // this.logger.log(`  moveArc loop`);
          // this.logger.log(
          //   `Start angle: ${startAngle * this.config.RAD_TO_DEG} degrees`,
          // );
          // this.logger.log(
          //   `Move angle: ${
          //     deltaAngleFn(this.car) * this.config.RAD_TO_DEG
          //   }degrees`,
          // );
          // this.logger.log(
          //   `Current angle: ${
          //     this.car.readCarRotation * this.config.RAD_TO_DEG
          //   }degrees`,
          // );
          // this.logger.log(
          //   `Left to move angle: ${
          //     (endAngle - this.car.readCarRotation) * this.config.RAD_TO_DEG
          //   } degrees`,
          // );

          /* Check if the condition is met */
          const stop = condition(this.car)(this.car, tickAngle);
          /* Check for a collision */
          const collision = this.calc.checkCollision(this.car);
          /* Check if move is complete */
          /* Note: Caution comparing floating point numbers */
          const bigNum = 100000;
          const complete =
            Math.round(this.car.readCarRotation * bigNum) ===
            Math.round(endAngle * bigNum);
          if (collision) {
            /* Clear collision */
            do {
              this.car.readCarRotation -= tickAngle;
            } while (this.calc.checkCollision(this.car));
            {
              this.car.readCarRotation -= tickAngle;
            }
          }
          if (
            stop ||
            collision ||
            complete ||
            this.#buttonLastClickStatus === EButtonStatus.Reset
          ) {
            const resolveReturned = this.stop('  moveArc', resolve);
            resolveReturned();
          }
        },
      };

      /* Create a tick listener and pass it an object with a handleEvent property */
      createjs.Ticker.on('tick', onTickRotate);
    });
  }

  /**
   * This rotates the front wheels clockwise or counterclockwise.
   * Angles are measured from a line lengthwise through the car with positive in the clockwise direction.
   * @param steeringWheelAngle: The target wheel angle is derived from the steering wheel angle parameter.
   * The steering wheel angle ranges from -1, representing fully counterclockwise, (and turning the car counterclockwise), to +1, representing fully clockwise, (and turning the car clockwise) with 0 representing the centered postion (and moving the car without rotation).
   * @param timePerRadian: The time in seconds to turn a wheel through one radian for the wheel on the inner side of the turning circle, (which has the furthest to rotate).  The other wheel's rotational speed is adjusted so it reaches the end position at the same time.
   * @returns A promise that resolves when the wheel rotation is complete.
   */
  public async steerWheel({
    steeringWheelAngle,
    condition = (_car: CarService) => (_carInUse: CarService, _tick?: any) =>
      false,
    speed = this.config.msPerWheelRadian,
  }: TSteer): Promise<void> {
    /* Derive the required wheel angles */
    const frontStarboardAngle =
      this.car.frontStarboardWheelAngle(steeringWheelAngle);
    const frontPortAngle = this.car.frontPortWheelAngle(steeringWheelAngle);

    return new Promise<void>(async (resolve, _reject) => {
      //
      /* Used by keyboard mover to stop - must precede the async call to the steer method. */
      createjs.Ticker.on(
        'stop',
        {
          handleEvent: () => {
            const resolveReturned = this.stop(null, resolve);
            resolveReturned();
          },
        },
        null as any,
        false,
        /* Passed as second parameter to the handleEvent function */
        resolve,
      );

      /* Create a tick at the configured FPS rate*/
      createjs.Ticker.framerate = this.config.FPS;
      const tickTime = 1 / this.config.FPS;
      const radiansPerTick = tickTime / speed;
      const starboardAngleToMove =
        frontStarboardAngle - this.car.readFrontStarboardWheelRotation;
      const portAngleToMove =
        frontPortAngle - this.car.readFrontPortWheelRotation;
      const starboardSteerLOrR = Math.sign(starboardAngleToMove);
      const portSteerLOrR = Math.sign(portAngleToMove);
      const speedRatio =
        this.car.frontInnerWheelAngle(ERotateDirection.Clockwise) /
        this.car.frontOuterWheelAngle(ERotateDirection.Clockwise);
      let starboardTurnPerTick = 0;
      let portTurnPerTick = 0;

      /**
       * Steer the wheel in a series of ticks.
       */
      const onTickSteer: { handleEvent: (_e: any) => void } = {
        //
        handleEvent: (_e: any) => {
          //
          /* If paused then simply exit */
          if (this.#pause === true) {
            return;
          }
          /* Check whether the starboard wheel rotation is positive or negative i.e. on the inner or outer side of the turning circle, and scale the rotation speed of the two wheels accordingly */
          switch (Math.sign(this.car.readFrontStarboardWheelRotation)) {
            case +1:
              starboardTurnPerTick = starboardSteerLOrR * radiansPerTick;
              portTurnPerTick = (portSteerLOrR * radiansPerTick) / speedRatio;
              break;
            case 0:
              starboardTurnPerTick = starboardSteerLOrR * radiansPerTick;
              portTurnPerTick = portSteerLOrR * radiansPerTick;
              break;
            case -1:
              portTurnPerTick = portSteerLOrR * radiansPerTick;
              starboardTurnPerTick =
                (starboardSteerLOrR * radiansPerTick) / speedRatio;
              break;
            default:
              throw new Error('Unexpected error');
          }

          /* Move the wheels */
          if (
            Math.abs(
              this.car.readFrontStarboardWheelRotation - frontStarboardAngle,
            ) >= Math.abs(starboardTurnPerTick)
          ) {
            this.car.readFrontStarboardWheelRotation += starboardTurnPerTick;
          } else {
            this.car.readFrontStarboardWheelRotation = frontStarboardAngle;
          }
          if (
            Math.abs(this.car.readFrontPortWheelRotation - frontPortAngle) >=
            Math.abs(portTurnPerTick)
          ) {
            this.car.readFrontPortWheelRotation += portTurnPerTick;
          } else {
            this.car.readFrontPortWheelRotation = frontPortAngle;
          }
          this.config.stage.update();
          /* Check if the stop condition is met */
          const stop = condition(this.car)(this.car);
          /* Check if move is complete */
          /* Note: Caution comparing floating point numbers */
          const bigNum = 100000;
          const complete =
            Math.round(this.car.readFrontStarboardWheelRotation * bigNum) ===
              Math.round(frontStarboardAngle * bigNum) &&
            Math.round(this.car.readFrontPortWheelRotation * bigNum) ===
              Math.round(frontPortAngle * bigNum);
          if (
            stop ||
            complete ||
            this.#buttonLastClickStatus === EButtonStatus.Reset
          ) {
            const resolveReturned = this.stop('steer', resolve);
            resolveReturned();
          }
        },
      };

      /* Create a tick listener and pass it an object with a handleEvent property */
      createjs.Ticker.on('tick', onTickSteer);
    });
  }

  public async routeMove(
    move: TMoveStraight | TMoveArc | TSteer,
  ): Promise<void> {
    if (move.message) {
      this.snack.open(move.message);
    }
    switch (move.type(this.car)) {
      case EMoveType.Steer:
        return await this.steerWheel(move as TSteer);
      case EMoveType.MoveArc:
        return await this.moveArc(move as TMoveArc);
      case EMoveType.MoveStraight:
        return await this.moveStraight(move as TMoveStraight);
      default:
        throw new Error('Unexpected move type');
    }
  }
}
