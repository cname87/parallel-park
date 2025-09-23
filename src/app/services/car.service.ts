import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import {
  ELock,
  ERotateDirection,
  LoggingLevel,
  TCarSetup,
  TPoint,
  TSteeringAngle,
} from '../shared/types';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

/**
 * Defines the car as displayed on the grid.
 */

/**
 * Notes:
 * All distances within the application are scaled by a scaling factor and are converted to and from real-world distances for output and input.
 * All real-world distances are in millimeters. The scaling factor converts the distance in mm to the equivalent number of pixels. See the note in the config component for the scaling factor value.
 * The reference x-axis is the top of the canvas with the positive direction towards the right.
 * The reference y-axis is the left side of the canvas with the positive direction towards the bottom.
 * The (0,0) origin is the top left hand corner of the canvas.
 * All angles within the application are in radians.  Angles are converted to degrees for all input and output.
 * A shape rotates around a center of rotation. The initial line from the center of rotation to the shape reference point is 0 degrees and a rotation clockwise is positive, and counterclockwise is negative.
 * We set the reference point of the car shape to be the front starboard corner.
 * In the names below:
 * - Outer means on the outside (far side) of the turning circle.
 * - Inner means on the inside (near side) of the turning circle.
 */
@Injectable({
  providedIn: 'root',
})
/**
 * The car instance holds the car's dimensions and methods required to get and manipulate car variables e.g. the car's center of rotation.
 * The update() method creates the car.
 * The draw() method draws the car on the canvas.
 */
export class CarService {
  /* Car dimensions */
  public minTurningRadius: number; //Radius of the circle formed by front outside corner when the steering wheel is at at maximum turn.
  public rearOverhang: number; //Distance from rear axle to rear bumper.
  public wheelbase: number; //Distance from front axle to rear axle.
  public frontOverhang: number; //Distance from front axle to front bumper.
  public wheelToWheelWidth: number; //Distance from centre wheel to centre wheel on the same axis.
  public sideOverhang: number; //Distance from centre wheel to side wall (not including mirrors).
  private wheelWidth: number; //Width of the tyres.
  private wheelLength: number; //Diameter of the tyres.

  /* Initial position - the car is initially positioned facing right on the canvas and parallel to the bottom edge */
  private initialFrontStarboardCornerFromLeft: number; //Distance from the front starboard corner of the car to the left side of the canvas - used for initial set up only.
  private initialFrontStarboardCornerFromTop: number; //Distance from the front starboard corner of the car to the bottom of the canvas - used for initial set up only.

  /* Shared canvas elements */
  public readonly carContainer = new createjs.Container();
  /** Holds car shapes for ease of center of rotation moves */
  private readonly carGroup = new createjs.Container();
  public readonly frontStarboardWheelShape = new createjs.Shape();
  public readonly frontPortWheelShape = new createjs.Shape();
  public readonly carShape = new createjs.Shape();
  private circleOfRotationShape = new createjs.Shape();
  private circleOfRotationShape2 = new createjs.Shape();
  private shadowCarShape = new createjs.Shape();

  constructor(
    private config: ConfigService,
    private logger: LoggerService,
  ) {
    this.minTurningRadius = config.defaultMinTurningRadius;
    this.rearOverhang = config.defaultRearOverhang;
    this.wheelbase = config.defaultWheelbase;
    this.frontOverhang = config.defaultFrontOverhang;
    this.wheelToWheelWidth = config.defaultWheelToWheelWidth;
    this.sideOverhang = config.defaultSideOverhang;
    this.wheelWidth = config.defaultWheelWidth;
    this.wheelLength = config.defaultWheelLength;

    this.initialFrontStarboardCornerFromLeft =
      config.defaultFrontStarboardCornerFromLeft;

    this.initialFrontStarboardCornerFromTop =
      config.defaultFrontStarboardCornerFromTop;
  }

  public get length(): number {
    return this.rearOverhang + this.wheelbase + this.frontOverhang;
  }

  public get width(): number {
    return this.wheelToWheelWidth + 2 * this.sideOverhang;
  }

  public get rearAxleToFront(): number {
    return this.wheelbase + this.frontOverhang;
  }

  /**
   * @returns: The maximum turning angle of the outer wheel in radians.  It will be a positive number and does not denote direction.
   */
  public get maxWheelAngle(): number {
    return Math.asin(
      (this.wheelbase + this.frontOverhang) / this.minTurningRadius,
    );
  }

  /**
   * @param steeringAngle A number between -1 to 1 representing the percentage turn of the steering wheel from fully counter clockwise (-1), through unturned (0), to fully clockwise (1) .
   * When the steer angle is negative the steering wheel is turned counterclockwise and the wheels faces left (looking forward) which corresponds to a forward counterclockwise turn.
   * When the steer angle is postive the steering wheel is turned clockwise and the wheels face right (looking forward) which corresponds to a forward clockwise turn.
   * @returns The turning radius of the car.  If the steer angle is +/-1 then the minimum turning radius of the car is returned.  Otherwise a larger turning radius is returned.  If no value for steering wheel angle is supplied then the minimum turning radius is returned, i.e a full steering lock is assumed.  The turningRadius is always positive, i.e. there is no implication of rotation direction in its value.
   * @throws If the steering wheel is centered (i.e. steeringAngle = 0) then the car turning radius is infinite.  To avoid unexpected results, if the steer angle parameter is 0 then an error is thrown, i.e. the turning radius should never be requested with a steering angle of zero.
   */
  public turningRadius(steeringAngle: TSteeringAngle): number {
    if (steeringAngle === ELock.Center) {
      throw new Error('Turning radius requested when steering angle is 0');
    }
    const distance =
      (this.wheelbase + this.frontOverhang) /
      Math.sin(this.maxWheelAngle * steeringAngle);
    return Math.abs(distance);
  }

  /**
   * @returns The distance from the centre of rotation to the far side of the car in line with the rear axle.
   */
  public farRearAxleSideTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.turningRadius(steeringAngle), 2) -
        Math.pow(this.rearAxleToFront, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns: The distance from the center of rotation to the rear outer wheel.
   */
  public farRearAxleWheelTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance =
      this.farRearAxleSideTurningRadius(steeringAngle) - this.sideOverhang;
    return Math.abs(distance);
  }

  /**
   * @returns: The distance from the center of rotation to the center point of the rear axle.
   */
  public centerRearAxleTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance =
      this.farRearAxleSideTurningRadius(steeringAngle) - this.width / 2;
    return Math.abs(distance);
  }

  /**
   * @returns The distance from the centre of rotation to the near side of the car in line with the rear axle.
   */
  public nearRearAxleSideTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance =
      this.farRearAxleSideTurningRadius(steeringAngle) - this.width;
    return Math.abs(distance);
  }

  /**
   * @returns The distance from the center of rotation to the rear port corner
   */
  private rearPortCornerTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.nearRearAxleSideTurningRadius(steeringAngle), 2) +
        Math.pow(this.rearOverhang, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns The front inner corner turning radius.
   */
  public frontInnerCornerTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.nearRearAxleSideTurningRadius(steeringAngle), 2) +
        Math.pow(this.rearAxleToFront, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns The front outer wheel turning radius.
   * Note: Many references refer to this as the turning radius but this is incorrect - the turning radius is to the outer corner.
   */
  public frontOuterWheelTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance = Math.sqrt(
      Math.pow(
        this.farRearAxleSideTurningRadius(steeringAngle) - this.sideOverhang,
        2,
      ) + Math.pow(this.wheelbase, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns The rear outer corner turning radius.
   */
  public rearOuterCornerTurningRadius(steeringAngle: TSteeringAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.farRearAxleSideTurningRadius(steeringAngle), 2) +
        Math.pow(this.rearOverhang, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns: The initial position of the front starboard corner of the car.
   * NOTE The car shape is initially set with its reference point x and y coordinates set to this point.
   */
  private get initialFrontStarboardCorner(): TPoint {
    return {
      x: this.initialFrontStarboardCornerFromLeft,
      y: this.initialFrontStarboardCornerFromTop,
    };
  }

  /**
   * @returns: The absolute position of the front starboard corner of the car on the canvas.
   * A localToGlobal function is used to translate coordinates from the car container (which may be rotated) to the canvas coordinates.
   * NOTE: The carContainer and carShape need to be both set together before using this, i.e. if you are updating the center of rotation by updating the carContainer reference point with a compensating change to the the carShape reference point then both must be updated before using this.
   */
  public get frontStarboardCorner(): TPoint {
    // If group not added yet, fall back to initial
    if (!this.carGroup.parent) {
      return this.initialFrontStarboardCorner;
    }
    // The group's (x,y) is the pivot in container-local space
    const absolutePoint = this.carContainer.localToGlobal(
      this.carGroup.x,
      this.carGroup.y,
    );
    return { x: absolutePoint.x, y: absolutePoint.y };
  }

  /**
   * @returns: The absolute position of the front port corner of the car.
   */
  public get frontPortCorner(): TPoint {
    const x =
      this.frontStarboardCorner.x + this.width * Math.sin(this.carRotation);
    const y =
      this.frontStarboardCorner.y - this.width * Math.cos(this.carRotation);
    return { x, y };
  }

  /**
   * @returns: The absolute position of the rear starboard corner of the car.
   */
  public get rearStarboardCorner(): TPoint {
    const x =
      this.frontStarboardCorner.x - this.length * Math.cos(this.carRotation);
    const y =
      this.frontStarboardCorner.y - this.length * Math.sin(this.carRotation);
    return { x, y };
  }
  /**
   * @returns: The absolute position of the rear port corner of the car.
   */
  public get rearPortCorner(): TPoint {
    const x = this.frontPortCorner.x - this.length * Math.cos(this.carRotation);
    const y = this.frontPortCorner.y - this.length * Math.sin(this.carRotation);
    return { x, y };
  }
  /**
   * @returns: The absolute position of the rear port axle at the side of the car.
   */
  public get rearPortAxleSide(): TPoint {
    const x =
      this.frontPortCorner.x -
      this.rearAxleToFront * Math.cos(this.carRotation);
    const y =
      this.frontPortCorner.y -
      this.rearAxleToFront * Math.sin(this.carRotation);
    return { x, y };
  }

  /**
   * @returns: The rotation of the createjs car container on the canvas in radians.
   * Note: All angles within the application are in radians - they are converted to degrees for all input and output. Therefore do NOT use the createjs container property 'rotation' to access the container rotation as it returns degrees.
   */
  public get carRotation(): number {
    if (!this.carContainer) {
      return 0;
    } else {
      return this.carContainer.rotation * this.config.DEG_TO_RAD;
    }
  }
  /**
   * Sets the rotation of the createjs car container around the center of rotation on the canvas in radians.
   * @valueRads The angle to set the rotation in radians.
   */
  public set carRotation(valueRads: number) {
    this.carContainer.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * @returns: The rotation of the createjs front starboard wheel container on the canvas in radians.
   */
  public get frontStarboardWheelRotation(): number {
    if (!this.carContainer) {
      return 0;
    } else {
      return this.frontStarboardWheelShape.rotation * this.config.DEG_TO_RAD;
    }
  }
  /**
   * Sets the rotation of the createjs front wheel container on the canvas in radians.
   * @valueRads The angle to set the rotation in radians.
   */
  public set frontStarboardWheelRotation(valueRads: number) {
    this.frontStarboardWheelShape.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * @returns: The rotation of the createjs front port wheel container on the canvas in radians.
   */
  public get frontPortWheelRotation(): number {
    if (!this.carContainer) {
      return 0;
    } else {
      return this.frontPortWheelShape.rotation * this.config.DEG_TO_RAD;
    }
  }
  /**
   * Sets the rotation of the createjs front wheel container on the canvas in radians.
   * @valueRads The angle to set the rotation in radians.
   */
  public set frontPortWheelRotation(valueRads: number) {
    this.frontPortWheelShape.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * This is used when the car container is being created and has not yet been added to the canvas. It uses the input initial position of the front starboard corner and a steering angle to calculate the initial center of rotation. It defaults to setting the center of rotation as though the steering wheel is fully locked counterclockwise. Once the car container is created then the center of rotation can be got by reading the car container x and y properties.
   * @remarks The center of rotation is the point around which every point on the car rotates when turning. It lies at the intersection of a line through the rear axle and a line perpendicular to either front tyre (when turned).  (Each tyre is turned at a slightly different angle).
   * Note: The car container will have a dummy centre of rotation when the wheels are straight, e.g. at the initial set up the centre of rotation is set as though the steering wheel is fully locked counterclockwise. When actually moving the center of rotation is set correctly by calling the moveCenterOfRotation method.
   * @returns: A point containing the absolute canvas x and y coordinates denoting the initial center of rotation.
   * @throws If the steering wheel is centered (i.e. steeringAngle = 0) then the car turning radius is infinite and there is no center of rotation.  To avoid unexpected results, if the steering angle parameter is 0 then an error is thrown, i.e. the center of rotation should never be set with a steering angle of zero.
   */
  private initialCenterOfRotation(
    steeringAngle: TSteeringAngle = ELock.Counterclockwise,
    startPosition: TPoint = this.initialFrontStarboardCorner,
  ): TPoint {
    if (steeringAngle === ELock.Center) {
      throw new Error('Center of rotation requested when steering angle is 0');
    }
    /* Angle in degrees between the line from the centre of rotation to front starboard corner and the line lengthwise from the front starboard corner back along the starboard side the car. */
    const angleARads = Math.acos(
      this.rearAxleToFront / this.turningRadius(steeringAngle),
    );
    /* x and y offsets from center of rotation to the front starboard corner */
    const offsetX = this.turningRadius(steeringAngle) * Math.cos(angleARads);
    const offsetY = this.turningRadius(steeringAngle) * Math.sin(angleARads);
    /* Calculate the center of rotation position from the initial front starboard corner position and the offsets */
    return {
      x: startPosition.x - offsetX,
      y: startPosition.y - offsetY,
    };
  }

  /**
   * @returns: Returns the measured distance from the center of rotation to the far car corner.
   */
  private readTurningDistance(): number {
    const distToFrontSCorner = Math.sqrt(
      Math.pow(this.frontStarboardCorner.x - this.carContainer.x, 2) +
        Math.pow(this.frontStarboardCorner.y - this.carContainer.y, 2),
    );
    const distToFrontPCorner = Math.sqrt(
      Math.pow(this.frontPortCorner.x - this.carContainer.x, 2) +
        Math.pow(this.frontPortCorner.y - this.carContainer.y, 2),
    );
    return Math.max(distToFrontSCorner, distToFrontPCorner);
  }

  /**
   * @returns: Returns whether the current center of rotation is on the starboard or the port, i.e. the rotation direction is clockwise or counterclockwise.
   * This is used to switch the center of rotation, if necessary, before turning.
   */
  public get isCenterOfRotationSOrP(): ERotateDirection {
    const distSqToFrontDCorner =
      Math.pow(this.frontStarboardCorner.x - this.carContainer.x, 2) +
      Math.pow(this.frontStarboardCorner.y - this.carContainer.y, 2);
    const distSqToFrontPCorner =
      Math.pow(this.frontPortCorner.x - this.carContainer.x, 2) +
      Math.pow(this.frontPortCorner.y - this.carContainer.y, 2);
    switch (Math.sign(distSqToFrontPCorner - distSqToFrontDCorner)) {
      case -1:
        return ERotateDirection.Counterclockwise;
      case +1:
        return ERotateDirection.Clockwise;
      default:
        throw new Error('Center of rotation calculation error');
    }
  }

  /**
   * @returns: The initial front starboard wheel position.
   * Note: It assumes that the car is set up initially parallel to the x-axis and facing right.
   */
  private get initialFStarboardWheelPosition(): TPoint {
    return {
      x: this.initialFrontStarboardCorner.x - this.frontOverhang,
      y: this.initialFrontStarboardCorner.y - this.sideOverhang,
    };
  }
  /**
   * @returns:  The initial front port wheel position .
   * Note: It assumes that the car is set up initially parallel to the x-axis and facing right.
   */
  private get initialFPortWheelPosition(): TPoint {
    return {
      x: this.initialFrontStarboardCorner.x - this.frontOverhang,
      y:
        this.initialFrontStarboardCorner.y -
        this.wheelToWheelWidth -
        this.sideOverhang,
    };
  }

  /**
   * @param steeringAngle When the steer angle is negative the steering wheel is turned counterclockwise and the wheels faces left (looking forward) which corresponds to a forward counterclockwise turn.  When the steer angle is postive the steering wheel is turned clockwise and the wheels face right (looking forward) which corresponds to a forward clockwise turn.
   * @returns The angle in radians of the front outer wheel, which is the angle of the tangent to the circle of rotation though that wheel.  This is the wheel that is on the outer edge of the rotation circle i.e. the starboard wheel if the steering wheel is turned counterclockwise and the port wheel if the steering wheel is turned clockwise.
   */
  public frontOuterWheelAngle(steeringAngle: TSteeringAngle): number {
    const tanAngle =
      this.wheelbase /
      (this.farRearAxleSideTurningRadius(steeringAngle) - this.sideOverhang);
    const angleRads = Math.atan(tanAngle);
    const leftOrRight: ERotateDirection = Math.sign(steeringAngle);
    return leftOrRight * angleRads;
  }

  /**
   * @param steeringAngle: See detail above.
   * @returns: The angle in radians of the front inner wheel - see detail under the equivalent outer wheel method.
   */
  public frontInnerWheelAngle(steeringAngle: TSteeringAngle): number {
    const tanAngle =
      this.wheelbase /
      (this.farRearAxleSideTurningRadius(steeringAngle) -
        this.wheelToWheelWidth -
        this.sideOverhang);
    const angleRads = Math.atan(tanAngle);
    const leftOrRight: ERotateDirection = Math.sign(steeringAngle);
    return leftOrRight * angleRads;
  }

  /**
   * @param steeringAngle: See detail above.
   * @returns: The angle in degrees of the front starboard wheel, which is the angle of tangent to the circle of rotation though that wheel.  It is dependent on the steering wheel position, i.e. whether the wheel is on the inner or outer side of the turn.
   */
  public frontStarboardWheelAngle(steeringAngle: TSteeringAngle): number {
    const rotationDirection: ERotateDirection = Math.sign(steeringAngle);
    switch (rotationDirection) {
      case ERotateDirection.Counterclockwise:
        return this.frontOuterWheelAngle(steeringAngle);
      case ERotateDirection.Clockwise:
        return this.frontInnerWheelAngle(steeringAngle);
      case ERotateDirection.NoRotate:
        return 0;
      default:
        throw new Error('Steering wheel angle error');
    }
  }

  /**
   * @returns The maximum angle in radians of the front starboard wheel.
   */
  public maxFrontStarboardWheelAngle(): number {
    return Math.abs(this.frontStarboardWheelAngle(ELock.Clockwise));
  }

  /**
   * @param steeringAngle: See detail above.
   * @returns: The angle in degrees of the front port wheel, which is the angle of tangent to the circle of rotation though that wheel.  It is dependent on the steering wheel position, i.e. whether the wheel is on the inner or outer side of the turn.
   */
  public frontPortWheelAngle(steeringAngle: TSteeringAngle): number {
    const rotationDirection: ERotateDirection = Math.sign(steeringAngle);
    switch (rotationDirection) {
      case ERotateDirection.Counterclockwise:
        return this.frontInnerWheelAngle(steeringAngle);
      case ERotateDirection.Clockwise:
        return this.frontOuterWheelAngle(steeringAngle);
      case ERotateDirection.NoRotate:
        return 0;
      default:
        throw new Error('Steering wheel angle error');
    }
  }
  /**
   * @returns The maximum angle in radians of the front port wheel.
   */
  public maxFrontPortWheelAngle(): number {
    return Math.abs(this.frontPortWheelAngle(ELock.Counterclockwise));
  }

  /**
   * This moves the center of rotation of the car to a position dependent on input steering wheel angle,  It changes the (x,y) reference point of the car container (which is the center of rotation for the shapes in the container).  The reference points of all shapes in the car container must be updated to be offset from the new container reference point.
   * @param steeringAngle: The turn of the steering wheel from -1 representing counterclockwise, (and turning the car counterclockwise), to +1 representing fully clockwise (and turning the car clockwise).
   * @throws If the steering wheel is centered (i.e. steeringAngle = 0) then the car turning radius is infinite and there is no center of rotation.  To avoid unexpected results, if the steer angle parameter is 0 then an error is thrown, i.e. the center of rotation should never be set with a steering angle of zero.
   */
  public setCenterOfRotation(steeringAngle: TSteeringAngle): void {
    if (steeringAngle === ELock.Center) {
      throw new Error('Center of rotation set when steering angle is 0');
    }

    const currentTurningRadius = this.readTurningDistance();
    const currentFarRearAxleRadius = Math.sqrt(
      Math.pow(currentTurningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
    );
    const newTurningRadius = this.turningRadius(steeringAngle);

    const deltaTurningRadius =
      Math.sqrt(
        Math.pow(newTurningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
      ) - currentFarRearAxleRadius;

    if (Math.abs(currentTurningRadius - newTurningRadius) < 0.1) {
      return;
    }

    // 1) Preserve the world position of the pivot (front starboard corner)
    const pivotWorld = this.frontStarboardCorner;

    // 2) Slide the container’s origin (center of rotation) laterally by ±delta along the car’s left-right axis
    switch (this.isCenterOfRotationSOrP) {
      case ERotateDirection.Counterclockwise:
        this.carContainer.set({
          x:
            this.carContainer.x +
            deltaTurningRadius * Math.sin(this.carRotation),
          y:
            this.carContainer.y -
            deltaTurningRadius * Math.cos(this.carRotation),
        });
        break;
      case ERotateDirection.Clockwise:
        this.carContainer.set({
          x:
            this.carContainer.x -
            deltaTurningRadius * Math.sin(this.carRotation),
          y:
            this.carContainer.y +
            deltaTurningRadius * Math.cos(this.carRotation),
        });
        break;
      default:
        break;
    }

    // 3) Re-anchor the group so the visible pivot stays fixed in world space
    const pivotLocal = this.carContainer.globalToLocal(
      pivotWorld.x,
      pivotWorld.y,
    );
    this.carGroup.set({ x: pivotLocal.x, y: pivotLocal.y });

    // 4) Redraw debug overlays and circle for the new radius
    this.shadowCarShape.graphics.clear();
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, 0)
      .lineTo(-2 * this.length, 0);
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, -this.width)
      .lineTo(-2 * this.length, -this.width);
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(
        -this.rearAxleToFront,
        -(this.width / 2 + this.centerRearAxleTurningRadius(steeringAngle)),
      )
      .lineTo(
        -this.rearAxleToFront,
        this.centerRearAxleTurningRadius(steeringAngle) - this.width / 2,
      );

    this.circleOfRotationShape.graphics
      .clear()
      .endFill()
      .beginStroke('Blue')
      .drawCircle(0, 0, newTurningRadius);

    // Update the rear port corner circle radius
    this.circleOfRotationShape2.graphics
      .clear()
      .endFill()
      .beginStroke('Blue')
      .drawCircle(0, 0, this.rearPortCornerTurningRadius(steeringAngle));
  }

  /**
   * This swaps the center of rotation of the car by changing the (x,y) reference point of the car container (which is the center of rotation for the shapes in the container) from one side to the other.  The reference points of all shapes in the car container must be updated to be offset from the new container reference point.
   * @param steeringAngle: The turn of the steering wheel from -1 representing counterclockwise, (and turning the car counterclockwise), to +1 representing fully clockwise (and turning the car clockwise).
   */

  public swapCentersOfRotation(steeringAngle: TSteeringAngle): void {
    const rotationDirection = Math.sign(steeringAngle);

    enum Change {
      StarboardToPort = -1,
      NoChange = 0,
      PortToStarboard = +1,
    }

    // Decide if we need to switch sides
    const changeCenterOfRotation =
      this.isCenterOfRotationSOrP === rotationDirection
        ? Change.NoChange
        : rotationDirection;

    if (changeCenterOfRotation === Change.NoChange) {
      return;
    }

    // Preserve the world position of the pivot (front starboard corner)
    const pivotWorld = this.frontStarboardCorner;

    // Amount to translate the COR across the car to the other side (along lateral axis)
    const dx =
      2 *
      this.centerRearAxleTurningRadius(steeringAngle) *
      Math.sin(this.carRotation);
    const dy =
      2 *
      this.centerRearAxleTurningRadius(steeringAngle) *
      Math.cos(this.carRotation);

    switch (changeCenterOfRotation) {
      case Change.PortToStarboard:
        // Move COR to starboard side
        this.carContainer.set({
          x: this.carContainer.x - dx,
          y: this.carContainer.y + dy,
        });
        break;
      case Change.StarboardToPort:
        // Move COR to port side (reverse of above)
        this.carContainer.set({
          x: this.carContainer.x + dx,
          y: this.carContainer.y - dy,
        });
        break;
      default:
        break;
    }

    // Re-anchor the group so the visible pivot stays fixed
    const pivotLocal = this.carContainer.globalToLocal(
      pivotWorld.x,
      pivotWorld.y,
    );
    this.carGroup.set({ x: pivotLocal.x, y: pivotLocal.y });

    // Optional: refresh the circle to reflect the same turning radius for the given steer
    this.circleOfRotationShape.graphics
      .clear()
      .endFill()
      .beginStroke('Blue')
      .drawCircle(0, 0, this.turningRadius(steeringAngle));

    // Update the rear port corner circle radius
    this.circleOfRotationShape2.graphics
      .clear()
      .endFill()
      .beginStroke('Blue')
      .drawCircle(0, 0, this.rearPortCornerTurningRadius(steeringAngle));
  }

  /**
   * Updates the car dimensions from a scenario car configuration.
   * @param car An object holding the scenario car dimensions.  All scenario distances are real-world distances in mm and are scaled by a factor to convert mm to pixels before being stored.
   */
  public setCarFromScenario(car: TCarSetup): void {
    this.minTurningRadius = car.minTurningRadius / this.config.distScale;
    this.rearOverhang = car.rearOverhang / this.config.distScale;
    this.wheelbase = car.wheelbase / this.config.distScale;
    this.frontOverhang = car.frontOverhang / this.config.distScale;
    this.wheelToWheelWidth = car.wheelToWheelWidth / this.config.distScale;
    this.sideOverhang = car.sideOverhang / this.config.distScale;
    this.wheelWidth = car.wheelWidth / this.config.distScale;
    this.wheelLength = car.wheelLength / this.config.distScale;
  }

  /**
   * Creates a new car on the canvas.
   * It removes a previously created car if there is one.
   * The car will be sized and positioned based on supplied parameters.
   * The car will be stationery on creation.
   * An object holding the car dimensions is passed in.
   * All input distances are real-world distances in mm and are reduced by a factor to convert mm to pixels before being stored.
   *

  /**
   * Draws a car on the canvas.  This includes the car createjs container with all the constituent createjs shapes.
   * @param startPosition The x & y coordinates (world) for the front starboard corner (pivot).
   * @param initialAngleRads Optional initial angle (clockwise positive) for the car container (default 0).
   */
  public draw(startPosition: TPoint, initialAngleRads: number = 0): void {
    //
    this.carShape.graphics.clear();
    this.shadowCarShape.graphics.clear();
    this.frontStarboardWheelShape.rotation = 0;
    this.frontStarboardWheelShape.graphics.clear();
    this.frontPortWheelShape.rotation = 0;
    this.frontPortWheelShape.graphics.clear();
    this.circleOfRotationShape.graphics.clear();

    /* Set up the car container registration point to a calculated counterclockwise center-of-rotation, and set an initial angle:
    regX/regY: The object’s local pivot (registration point) in pixels. Rotation, scaling, and skew happen around this point, which is measured in the object’s own local coordinates.
    x/y: Where to place that pivot in the parent’s coordinate space in pixels.
    rotation: The rotation of the object in degrees (clockwise positive). Note: All angles within the application are in radians - they are converted to degrees for all input and output.
    Note: The car container (x,y) is the center of rotation of the car. The car shape and wheel shapes (x,y) are offsets from this center of rotation.
    */
    this.carContainer.set({
      regX: 0,
      regY: 0,
      x: this.initialCenterOfRotation(
        ERotateDirection.Counterclockwise,
        startPosition,
      ).x,
      y: this.initialCenterOfRotation(
        ERotateDirection.Counterclockwise,
        startPosition,
      ).y,
      rotation: initialAngleRads * this.config.RAD_TO_DEG,
    });

    // Compute the local position (in container space) of the desired world front-starboard corner
    this.logger.log(
      'CarService.draw: front starboard corner at (' +
        startPosition.x * this.config.distScale +
        ', ' +
        startPosition.y * this.config.distScale +
        ')',
      LoggingLevel.DEBUG,
    );
    const frontStarboardStartLocal = this.carContainer.globalToLocal(
      startPosition.x,
      startPosition.y,
    );

    // Ensure the group is anchored at the pivot (front starboard corner) in container-local space
    this.carGroup.set({
      x: frontStarboardStartLocal.x,
      y: frontStarboardStartLocal.y,
    });
    if (!this.carContainer.children?.includes?.(this.carGroup)) {
      this.carContainer.addChild(this.carGroup);
    }
    /* Set up the car shape within the container with reference point at the input starboard corner position */
    /* Set up the car shape registration point to the input front starboard corner position:
    regX/regY: The object’s local pivot (registration point) in pixels. Rotation, scaling, and skew happen around this point, which is measured in the object’s own local coordinates.
    x/y: Where to place that pivot in the parent’s coordinate space in pixels.
    */
    this.carShape.set({
      regX: 0,
      regY: 0,
      x: 0,
      y: 0,
    });

    /* Draw the car and add it to the car container */

    // Car body
    this.carShape.graphics
      .beginFill('LightGreen')
      .beginStroke('Black')
      .rect(0, 0, -this.length, -this.width);
    // Front V
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.rearAxleToFront / 2, 0)
      .lineTo(0, -this.width / 2);
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.rearAxleToFront / 2, -this.width)
      .lineTo(0, -this.width / 2);
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.length, -this.width / 2)
      .lineTo(0, -this.width / 2);

    // Rear axle
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.rearAxleToFront, -this.sideOverhang)
      .lineTo(
        -this.rearAxleToFront,
        -(this.sideOverhang + this.wheelToWheelWidth),
      );

    // Front axle
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.frontOverhang, -this.sideOverhang)
      .lineTo(
        -this.frontOverhang,
        -(this.sideOverhang + this.wheelToWheelWidth),
      );

    // Rear wheels
    this.carShape.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        -(this.rearAxleToFront + this.wheelLength / 2),
        -(this.sideOverhang + this.wheelWidth / 2 + 0.5),
        this.wheelLength,
        this.wheelWidth,
      );
    this.carShape.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        -(this.rearAxleToFront + this.wheelLength / 2),
        -(
          this.sideOverhang +
          this.wheelToWheelWidth +
          this.wheelWidth / 2 -
          0.5
        ),
        this.wheelLength,
        this.wheelWidth,
      );
    if (!this.carGroup.children?.includes?.(this.carShape)) {
      this.carGroup.addChild(this.carShape);
    }

    /* Create a shadow car with lines to help visualize the car's position and add it to the car container */
    this.shadowCarShape.set({
      regX: 0,
      regY: 0,
      x: 0,
      y: 0,
    });
    this.shadowCarShape.graphics
      .endFill()
      .rect(0, 0, -this.length, -this.width);
    // Lines trailing from rear corners
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, 0)
      .lineTo(-2 * this.length, 0);
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, -this.width)
      .lineTo(-2 * this.length, -this.width);
    // Line along rear axle
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(
        -this.rearAxleToFront,
        -(
          this.width / 2 +
          this.centerRearAxleTurningRadius(ERotateDirection.Counterclockwise)
        ),
      )
      .lineTo(
        -this.rearAxleToFront,
        this.centerRearAxleTurningRadius(ERotateDirection.Counterclockwise) -
          this.width / 2,
      );
    if (!this.carGroup.children?.includes?.(this.shadowCarShape)) {
      this.carGroup.addChild(this.shadowCarShape);
    }

    /* Create front starboard wheel shape positioned by local offsets from the body corner */
    this.frontStarboardWheelShape.set({
      regX: 0,
      regY: 0,
      x: -this.frontOverhang,
      y: -this.sideOverhang,
    });
    this.frontStarboardWheelShape.graphics
      .beginFill('Black')
      .setStrokeStyle(1)
      .rect(
        -this.wheelLength / 2,
        -this.wheelWidth / 2,
        this.wheelLength,
        this.wheelWidth,
      );
    if (!this.carGroup.children?.includes?.(this.frontStarboardWheelShape)) {
      this.carGroup.addChild(this.frontStarboardWheelShape);
    }

    /* Create front port wheel shape positioned by local offsets from the body corner */
    this.frontPortWheelShape.set({
      regX: 0,
      regY: 0,
      x: -this.frontOverhang,
      y: -(this.sideOverhang + this.wheelToWheelWidth),
    });
    this.frontPortWheelShape.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        -this.wheelLength / 2,
        -this.wheelWidth / 2,
        this.wheelLength,
        this.wheelWidth,
      );
    if (!this.carGroup.children?.includes?.(this.frontPortWheelShape)) {
      this.carGroup.addChild(this.frontPortWheelShape);
    }

    /* Create a circle at container origin (which is the car circle of rotation) showing the turning radius for visualization purposes */
    this.circleOfRotationShape.set({
      regX: 0,
      regY: 0,
      x: 0,
      y: 0,
    });
    this.circleOfRotationShape.graphics
      .endFill()
      .beginStroke('Blue')
      /* The turning radius is the distance from the center of rotation to the outer front wheel */
      .drawCircle(0, 0, this.turningRadius(ERotateDirection.Counterclockwise));
    if (!this.carContainer.children?.includes?.(this.circleOfRotationShape)) {
      this.carContainer.addChild(this.circleOfRotationShape);
    }

    this.config.stage.addChild(this.carContainer);
    this.config.stage.update();

    /* Create a circle at center of rotation showing the turning radius to rear port corner for parallel parking */
    this.circleOfRotationShape2.set({
      regX: 0,
      regY: 0,
      x: 0,
      y: 0,
    });
    this.circleOfRotationShape2.graphics
      .endFill()
      .beginStroke('Blue')
      .drawCircle(
        0,
        0,
        this.rearPortCornerTurningRadius(ERotateDirection.Counterclockwise),
      );
    if (!this.carContainer.children?.includes?.(this.circleOfRotationShape2)) {
      this.carContainer.addChild(this.circleOfRotationShape2);
    }

    this.config.stage.addChild(this.carContainer);
    this.config.stage.update();
  }
}
