import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import {
  ELock,
  ERotateDirection,
  TCarSetup,
  TPoint,
  TSteerAngle,
} from '../shared/types';
import { ConfigService } from './config.service';

/**
 * Defines the car as displayed on the grid.
 */

/**
 * Notes:
 * All distances within the application are scaled by a scaling factor and are
 * converted to and from real-world distances for output and input.
 * All distances are in millimeters. The scaling factor converts the distance
 * in mm to the equivalent number of pixels. See the note in the config
 * component for the scaling factor value.
 * The reference x-axis is the top of the canvas with the positive direction
 * towards the right.
 * The reference y-axis is the left side of the canvas with the positive
 * direction towards the bottom.
 * The (0,0) origin is the top left hand corner of the canvas.
 * All angles within the application are in radians.  Angles are converted to
 * degrees for all input and output.
 * A shape rotates around a center of rotation. The initial line from the
 * center of rotation to the shape reference point is 0 degrees and a rotation
 * clockwise is positive, and counterclockwise is negative.
 * We set the reference point of the car shape to be the front starboard
 * corner.
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
  /* Car dimensions */
  public minTurningRadius: number;
  public rearOverhang: number;
  public wheelbase: number;
  public frontOverhang: number;
  public wheelToWheelWidth: number;
  public sideOverhang: number;
  private wheelWidth: number;
  private wheelLength: number;

  /* Initial position - the car is initially positioned facing right on the canvas and parallel to the bottom edge */
  private initialFrontStarboardCornerFromLeft: number;
  private initialFrontStarboardCornerFromTop: number;

  /* Shared canvas elements */
  public readonly carContainer = new createjs.Container();
  public readonly frontStarboardWheelShape = new createjs.Shape();
  public readonly frontPortWheelShape = new createjs.Shape();
  public readonly carShape = new createjs.Shape();
  private circleOfRotationShape = new createjs.Shape();
  private shadowCarShape = new createjs.Shape();

  constructor(private config: ConfigService) {
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
   * @param steerAngle A number between -1 to 1 representing the percentage turn of the steering wheel from fully counter clockwise (-1), through unturned (0), to fully clockwise (1) .
   * When the steer angle is negative the steering wheel is turned counterclockwise and the wheels faces left (looking forward) which corresponds to a forward counterclockwise turn.
   * When the steer angle is postive the steering wheel is turned clockwise and the wheels face right (looking forward) which corresponds to a forward clockwise turn.
   * @returns The turning radius of the car.  If the steer angle is +/-1 then the minimum turning radius of the car is returned.  Otherwise a larger turning radius is returned.  If no value for steering wheel angle is supplied then the minimum turning radius is returned, i.e a full steering lock is assumed.  The turningRadius is always positive, i.e. there is no implication of rotation direction in its value.
   * @throws If the steering wheel is centered (i.e. steerAngle = 0) then the car turning radius is infinite.  To avoid unexpected results, if the steer angle parameter is 0 then an error is thrown, i.e. the turning radius should never be requested with a steering angle of zero.
   */
  public turningRadius(steerAngle: TSteerAngle): number {
    if (steerAngle === ELock.Center) {
      throw new Error('Turning radius requested when steering angle is 0');
    }
    const distance =
      (this.wheelbase + this.frontOverhang) /
      Math.sin(this.maxWheelAngle * steerAngle);
    return Math.abs(distance);
  }

  /**
   * @returns The distance from the centre of rotation to the far side of the car in line with the rear axle.
   */
  public farRearAxleSideTurningRadius(steerAngle: TSteerAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.turningRadius(steerAngle), 2) -
        Math.pow(this.rearAxleToFront, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns: The distance from the center of rotation to the rear outer wheel.
   */
  public farRearAxleWheelTurningRadius(steerAngle: TSteerAngle): number {
    const distance =
      this.farRearAxleSideTurningRadius(steerAngle) - this.sideOverhang;
    return Math.abs(distance);
  }

  /**
   * @returns: The distance from the center of rotation to the center point of the rear axle.
   */
  public centerRearAxleTurningRadius(steerAngle: TSteerAngle): number {
    const distance =
      this.farRearAxleSideTurningRadius(steerAngle) - this.width / 2;
    return Math.abs(distance);
  }

  /**
   * @returns The distance from the centre of rotation to the near side of the van in line with the rear axle.
   */
  public nearRearAxleSideTurningRadius(steerAngle: TSteerAngle): number {
    const distance = this.farRearAxleSideTurningRadius(steerAngle) - this.width;
    return Math.abs(distance);
  }

  /**
   * @returns The front inner corner turning radius.
   */
  public frontInnerCornerTurningRadius(steerAngle: TSteerAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.nearRearAxleSideTurningRadius(steerAngle), 2) +
        Math.pow(this.rearAxleToFront, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns The front outer wheel turning radius.
   * Note: Many references refer to this as the turning radius but this is incorrect - the turning radius is to the outer corner.
   */
  public frontOuterWheelTurningRadius(steerAngle: TSteerAngle): number {
    const distance = Math.sqrt(
      Math.pow(
        this.farRearAxleSideTurningRadius(steerAngle) - this.sideOverhang,
        2,
      ) + Math.pow(this.wheelbase, 2),
    );
    return Math.abs(distance);
  }

  /**
   * @returns The rear outer corner turning radius.
   */
  public rearOuterCornerTurningRadius(steerAngle: TSteerAngle): number {
    const distance = Math.sqrt(
      Math.pow(this.farRearAxleSideTurningRadius(steerAngle), 2) +
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
  public get readFrontStarboardCorner(): TPoint {
    if (!this.carContainer) {
      return this.initialFrontStarboardCorner;
    } else {
      const absolutePoint = this.carContainer.localToGlobal(
        this.carShape.x,
        this.carShape.y,
      );
      return {
        x: absolutePoint.x,
        y: absolutePoint.y,
      };
    }
  }

  /**
   * @returns: The absolute position of the front port corner of the car.
   */
  public get readFrontPortCorner(): TPoint {
    const x =
      this.readFrontStarboardCorner.x +
      this.width * Math.sin(this.readCarRotation);
    const y =
      this.readFrontStarboardCorner.y -
      this.width * Math.cos(this.readCarRotation);
    return { x, y };
  }

  /**
   * @returns: The absolute position of the rear starboard corner of the car.
   */
  public get readRearStarboardCorner(): TPoint {
    const x =
      this.readFrontStarboardCorner.x -
      this.length * Math.cos(this.readCarRotation);
    const y =
      this.readFrontStarboardCorner.y -
      this.length * Math.sin(this.readCarRotation);
    return { x, y };
  }
  /**
   * @returns: The absolute position of the rear port corner of the car.
   */
  public get readRearPortCorner(): TPoint {
    const x =
      this.readFrontPortCorner.x - this.length * Math.cos(this.readCarRotation);
    const y =
      this.readFrontPortCorner.y - this.length * Math.sin(this.readCarRotation);
    return { x, y };
  }
  /**
   * @returns: The absolute position of the rear port axle at the side of the car.
   */
  public get readRearPortAxleSide(): TPoint {
    const x =
      this.readFrontPortCorner.x -
      this.rearAxleToFront * Math.cos(this.readCarRotation);
    const y =
      this.readFrontPortCorner.y -
      this.rearAxleToFront * Math.sin(this.readCarRotation);
    return { x, y };
  }

  /**
   * @returns: The rotation of the createjs car container on the canvas in radians.
   * * Note: All angles within the application are in radians - they are converted to degrees for all input and output. Therefore do NOT use the createjs container property 'rotation' to access the container rotation as it returns degrees.
   */
  public get readCarRotation(): number {
    if (!this.carContainer) {
      return 0;
    } else {
      return this.carContainer.rotation * this.config.DEG_TO_RAD;
    }
  }
  /**
   * Sets the rotation of the createjs car container on the canvas in radians.
   * @valueRads The angle to set the rotation in radians.
   */
  public set readCarRotation(valueRads: number) {
    this.carContainer.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * @returns: The rotation of the createjs front starboard wheel container on the canvas in radians.
   * * Note: All angles within the application are in radians - they are converted to degrees for all input and output. Therefore do NOT use the createjs container property 'rotation' to access the wheel rotation as it returns degrees.
   */
  public get readFrontStarboardWheelRotation(): number {
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
  public set readFrontStarboardWheelRotation(valueRads: number) {
    this.frontStarboardWheelShape.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * @returns: The rotation of the createjs front port wheel container on the canvas in radians.
   * * Note: All angles within the application are in radians - they are converted to degrees for all input and output. Therefore do NOT use the createjs container property 'rotation' to access the wheel rotation as it returns degrees.
   */
  public get readFrontPortWheelRotation(): number {
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
  public set readFrontPortWheelRotation(valueRads: number) {
    this.frontPortWheelShape.rotation = valueRads * this.config.RAD_TO_DEG;
  }

  /**
   * Returns the center of rotation used to set up the car shape.
   * * Note:  This initial value cannnot be changed without changing all the other car container element set up values.
   * The center of rotation is the point around which the car rotates when turning.  It is the intersection of a line through the rear axle and a line perpendicular to either tyre (when turned).  (Each tyre is turned at a slightly different angle).
   * This initial value is used to set the center of rotation when the car shape is created.  The center of rotation may be overwritten when the turn function is called depending on the steering wheel setting.
   * The initial value is set so the center of rotation is on the port of the car.
   * It finds the center of rotation relative to the front starboard corner.
   * @returns: A point containing the absolute canvas x and y coordinates denoting the initial center of rotation.
   */
  private initialCenterOfRotation(steeringAngle: TSteerAngle): TPoint {
    /* Angle in degrees between the line from the centre of rotation to front starboard corner and the line lengthwise from the front starboard corner back along the starboard side the car. */
    const angleARads = Math.acos(
      this.rearAxleToFront / this.turningRadius(steeringAngle),
    );
    /* x and y offsets from center of rotation to the front starboard corner */
    const offsetX = this.turningRadius(steeringAngle) * Math.cos(angleARads);
    const offsetY = this.turningRadius(steeringAngle) * Math.sin(angleARads);
    return {
      x: this.initialFrontStarboardCorner.x - offsetX,
      y: this.initialFrontStarboardCorner.y - offsetY,
    };
  }

  /**
   * @returns: Returns the measured distance from the center of rotation to the far car corner.
   */
  private readTurningDistance(): number {
    const distToFrontSCorner = Math.sqrt(
      Math.pow(this.readFrontStarboardCorner.x - this.carContainer.x, 2) +
        Math.pow(this.readFrontStarboardCorner.y - this.carContainer.y, 2),
    );
    const distToFrontPCorner = Math.sqrt(
      Math.pow(this.readFrontPortCorner.x - this.carContainer.x, 2) +
        Math.pow(this.readFrontPortCorner.y - this.carContainer.y, 2),
    );
    return Math.max(distToFrontSCorner, distToFrontPCorner);
  }

  /**
   * @returns: Returns whether the current center of rotation is on the starboard or the port, i.e. the rotation direction is clockwise or counterclockwise.
   * This is used to switch the center of rotation, if necessary, before turning.
   */
  public readCenterOfRotationSOrP(): ERotateDirection {
    const distSqToFrontDCorner =
      Math.pow(this.readFrontStarboardCorner.x - this.carContainer.x, 2) +
      Math.pow(this.readFrontStarboardCorner.y - this.carContainer.y, 2);
    const distSqToFrontPCorner =
      Math.pow(this.readFrontPortCorner.x - this.carContainer.x, 2) +
      Math.pow(this.readFrontPortCorner.y - this.carContainer.y, 2);
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
   * @returns: The absolute position of the center of rotation of the car.
   * The center of rotation corresponds to the car container x/y coordinates.
   */
  public readCenterOfRotation(steeringAngle: TSteerAngle): TPoint {
    if (!this.carContainer) {
      return this.initialCenterOfRotation(steeringAngle);
    } else {
      return {
        x: this.carContainer.x,
        y: this.carContainer.y,
      };
    }
  }

  /**
   * @returns:  The initial front starboard wheel position.
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
   * @param steerAngle When the steer angle is negative the steering wheel is turned counterclockwise and the wheels faces left (looking forward) which corresponds to a forward counterclockwise turn.  When the steer angle is postive the steering wheel is turned clockwise and the wheels face right (looking forward) which corresponds to a forward clockwise turn.
   * @returns The angle in radians of the front outer wheel, which is the angle of the tangent to the circle of rotation though that wheel.  This is the wheel that is on the outer edge of the rotation circle i.e. the starboard wheel if the steering wheel is turned counterclockwise and the port wheel if the steering wheel is turned clockwise.
   */
  public frontOuterWheelAngle(steerAngle: TSteerAngle): number {
    const tanAngle =
      this.wheelbase /
      (this.farRearAxleSideTurningRadius(steerAngle) - this.sideOverhang);
    const angleRads = Math.atan(tanAngle);
    const leftOrRight: ERotateDirection = Math.sign(steerAngle);
    return leftOrRight * angleRads;
  }

  /**
   * @param steerAngle: See detail above.
   * @returns: The angle in radians of the front inner wheel - see detail under the equivalent outer wheel method.
   */
  public frontInnerWheelAngle(steerAngle: TSteerAngle): number {
    const tanAngle =
      this.wheelbase /
      (this.farRearAxleSideTurningRadius(steerAngle) -
        this.wheelToWheelWidth -
        this.sideOverhang);
    const angleRads = Math.atan(tanAngle);
    const leftOrRight: ERotateDirection = Math.sign(steerAngle);
    return leftOrRight * angleRads;
  }

  /**
   * @param steerAngle: See detail above.
   * @returns: The angle in degrees of the front starboard wheel, which is the angle of tangent to the circle of rotation though that wheel.  It is dependent on the steering wheel position, i.e. whether the wheel is on the inner or outer side of the turn.
   */
  public frontStarboardWheelAngle(steerAngle: TSteerAngle): number {
    const rotationDirection: ERotateDirection = Math.sign(steerAngle);
    switch (rotationDirection) {
      case ERotateDirection.Counterclockwise:
        return this.frontOuterWheelAngle(steerAngle);
      case ERotateDirection.Clockwise:
        return this.frontInnerWheelAngle(steerAngle);
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
   * @param steerAngle: See detail above.
   * @returns: The angle in degrees of the front port wheel, which is the angle of tangent to the circle of rotation though that wheel.  It is dependent on the steering wheel position, i.e. whether the wheel is on the inner or outer side of the turn.
   */
  public frontPortWheelAngle(steerAngle: TSteerAngle): number {
    const rotationDirection: ERotateDirection = Math.sign(steerAngle);
    switch (rotationDirection) {
      case ERotateDirection.Counterclockwise:
        return this.frontInnerWheelAngle(steerAngle);
      case ERotateDirection.Clockwise:
        return this.frontOuterWheelAngle(steerAngle);
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
   * This moves the center of rotation of the car as a result of a steering wheel angle change, i.e. it moves the rotation by changing in or out as dependent on the steering wheel angle,  It changes the x/y reference point of the car container (which is the center of rotation for the shapes in the container).  The reference points of all shapes in the car container must be updated to be offset from the new container reference point.
   * @param steerAngle: The turn of the steering wheel from -1 representing counterclockwise, (and turning the car counterclockwise), to +1 representing fully clockwise (and turning the car clockwise).
   */
  public moveCenterOfRotation(steerAngle: TSteerAngle): void {
    //

    const currentTurningRadius = this.readTurningDistance();
    const currentFarRearAxleRadius = Math.sqrt(
      Math.pow(currentTurningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
    );
    const newTurningRadius = this.turningRadius(steerAngle);

    /* This is the length of the change of the turning radius. */
    const deltaTurningRadius =
      Math.sqrt(
        Math.pow(newTurningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
      ) - currentFarRearAxleRadius;

    if (Math.abs(currentTurningRadius - newTurningRadius) < 0.1) {
      return;
    }

    /* The changes in the various properties is dependent on whether the center of rotation is on the starboard or port side */
    switch (this.readCenterOfRotationSOrP()) {
      case ERotateDirection.Counterclockwise:
        this.carContainer.set({
          x:
            this.carContainer.x +
            deltaTurningRadius * Math.sin(this.readCarRotation),
          y:
            this.carContainer.y -
            deltaTurningRadius * Math.cos(this.readCarRotation),
        });
        this.carShape.set({
          x: this.carShape.x,
          y: this.carShape.y + deltaTurningRadius,
        });
        this.shadowCarShape.set({
          x: this.shadowCarShape.x,
          y: this.shadowCarShape.y + deltaTurningRadius,
        });
        this.frontStarboardWheelShape.set({
          x: this.frontStarboardWheelShape.x,
          y: this.frontStarboardWheelShape.y + deltaTurningRadius,
        });
        this.frontPortWheelShape.set({
          x: this.frontPortWheelShape.x,
          y: this.frontPortWheelShape.y + deltaTurningRadius,
        });
        break;
      case ERotateDirection.Clockwise:
        this.carContainer.set({
          x:
            this.carContainer.x -
            deltaTurningRadius * Math.sin(this.readCarRotation),
          y:
            this.carContainer.y +
            deltaTurningRadius * Math.cos(this.readCarRotation),
        });
        this.carShape.set({
          x: this.carShape.x,
          y: this.carShape.y - deltaTurningRadius,
        });
        this.shadowCarShape.set({
          x: this.shadowCarShape.x,
          y: this.shadowCarShape.y - deltaTurningRadius,
        });
        this.frontStarboardWheelShape.set({
          x: this.frontStarboardWheelShape.x,
          y: this.frontStarboardWheelShape.y - deltaTurningRadius,
        });
        this.frontPortWheelShape.set({
          x: this.frontPortWheelShape.x,
          y: this.frontPortWheelShape.y - deltaTurningRadius,
        });
        break;
      default:
        break;
    }
    /* Clear and redraw debug graphics */
    this.shadowCarShape.graphics.clear();
    /* Debug: Add a line showing a line back from the starboard-side */
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, 0)
      .lineTo(-2 * this.length, 0);
    /* Debug: Add a line showing a line back from the port */
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
        -(this.width / 2 + this.centerRearAxleTurningRadius(steerAngle)),
      )
      .lineTo(
        -this.rearAxleToFront,
        this.centerRearAxleTurningRadius(steerAngle) - this.width / 2,
      );
    this.circleOfRotationShape.graphics
      .clear()
      .endFill()
      .beginStroke('Blue')
      .drawCircle(0, 0, newTurningRadius);
  }

  /**
   * This changes the center of rotation of the car by changing the x/y reference point of the car container (which is the center of rotation for the shapes in the container).  The reference points of all shapes in the car container must be updated to be offset from the new container reference point.
   * @param steerAngle: The turn of the steering wheel from -1 representing counterclockwise, (and turning the car counterclockwise), to +1 representing fully clockwise (and turning the car clockwise).
   */
  public changeCentersOfRotation(steerAngle: TSteerAngle): void {
    //
    const rotationDirection = Math.sign(steerAngle);

    enum Change {
      StarboardToPort = -1,
      NoChange = 0,
      PortToStarboard = +1,
    }

    const refPointRatio = (r: number, w: number) => {
      return (r - w) / r;
    };
    /* Test the current center of rotation position against the input steer and set a change accordingly */
    const changeCenterOfRotation =
      this.readCenterOfRotationSOrP() === rotationDirection
        ? Change.NoChange
        : rotationDirection;

    switch (changeCenterOfRotation) {
      /* This is the change from a port center of rotation to a starboard center of rotation */
      case Change.PortToStarboard:
        {
          /* The center of rotation is reflected on the opposite side of the car, i.e. a translation of 2 times the distance from the center of rotation to the center of the rear axle, modified by the angle. */
          this.carContainer.set({
            x:
              this.carContainer.x -
              2 *
                this.centerRearAxleTurningRadius(steerAngle) *
                Math.sin(this.readCarRotation),
            y:
              this.carContainer.y +
              2 *
                this.centerRearAxleTurningRadius(steerAngle) *
                Math.cos(this.readCarRotation),
          });

          /* The car shape reference point is the front starboard corner. This is further in the y direction from the starboard center of rotation than from the port center of rotation. */
          let ratio = refPointRatio(
            this.farRearAxleSideTurningRadius(steerAngle),
            this.width,
          );
          this.carShape.set({
            x: this.carShape.x,
            y: -ratio * this.carShape.y,
          });
          this.shadowCarShape.set({
            x: this.shadowCarShape.x,
            y: -ratio * this.shadowCarShape.y,
          });
          /* Correct for the fact that wheels are different distances in the y direction in each center of rotation. */
          ratio = refPointRatio(
            this.farRearAxleSideTurningRadius(steerAngle) - this.sideOverhang,
            this.wheelToWheelWidth,
          );
          this.frontStarboardWheelShape.set({
            x: this.frontStarboardWheelShape.x,
            y: -ratio * this.frontStarboardWheelShape.y,
          });
          this.frontPortWheelShape.set({
            x: this.frontPortWheelShape.x,
            y: -(1 / ratio) * this.frontPortWheelShape.y,
          });
        }
        break;
      case Change.StarboardToPort:
        {
          /* This is the change from a starboard center of rotation to a port center of rotation */
          //
          /* A reverse of the left to right translation above */
          this.carContainer.set({
            x:
              this.carContainer.x +
              2 *
                this.centerRearAxleTurningRadius(steerAngle) *
                Math.sin(this.readCarRotation),
            y:
              this.carContainer.y -
              2 *
                this.centerRearAxleTurningRadius(steerAngle) *
                Math.cos(this.readCarRotation),
          });
          /* The car shape reference point is the front starboard corner. This is nearer in the y direction from the port center of rotation than from the starboard center of rotation */
          let ratio = refPointRatio(
            this.farRearAxleSideTurningRadius(steerAngle),
            this.width,
          );
          this.carShape.set({
            x: this.carShape.x,
            y: -(1 / ratio) * this.carShape.y,
          });
          this.shadowCarShape.set({
            x: this.shadowCarShape.x,
            y: -(1 / ratio) * this.shadowCarShape.y,
          });
          /* Correct for the fact that wheels are different distances in the y direction in each center of rotation */
          ratio = refPointRatio(
            this.farRearAxleSideTurningRadius(steerAngle) - this.sideOverhang,
            this.wheelToWheelWidth,
          );
          this.frontStarboardWheelShape.set({
            x: this.frontStarboardWheelShape.x,
            y: -(1 / ratio) * this.frontStarboardWheelShape.y,
          });
          this.frontPortWheelShape.set({
            x: this.frontPortWheelShape.x,
            y: -ratio * this.frontPortWheelShape.y,
          });
        }
        break;
      case Change.NoChange:
      /* Do nothing */
      default:
        break;
    }
  }

  /**
   * Creates a new car on the canvas.
   * It removes a previously created car if there is one.
   * The car will be sized and positioned based on supplied parameters.
   * The car will be stationery on creation.
   * An object holding the car dimensions is passed in.
   * All input distances are real-world distances in mm and are reduced by a factor to convert mm to pixels before being stored.
   *
   * @param minTurningRadius: Radius of the circle formed by front outside corner when the steering wheel is at at maximum turn.
   * @param rearOverhang: Distance from rear axle to rear bumper.
   * @param wheelbase: Distance from front axle to rear axle.
   * @param frontOverhang: Distance from front axle to front bumper.
   * @param wheelToWheelWidth: Distance from centre wheel to centre wheel on the same axis.
   * @param sideOverhang: Distance from centre wheel to side wall (not including mirrors).
   * @param wheelWidth: Width of the tyres.
   * @param wheelLength: Diameter of the tyres.
   * @param initialFrontStarboardCornerFromLeft:: Distance from the front starboard corner of the car to the left side of the canvas - used for initial set up only.
   * @param initialFrontStarboardCornerFromTop:: Distance from the front starboard corner of the car to the bottom of the canvas - used for initial set up only.
   */
  update(car: TCarSetup): void {
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
   * Draws a car on the canvas.  This includes the car createjs container with all the constituent createjs shapes.
   * @param startPosition The x & y coordinates of the car container reference point which is the front starboard corner.
   */
  draw(startPosition: TPoint): void {
    //
    this.carContainer.rotation = 0;
    this.carShape.graphics.clear();
    this.shadowCarShape.graphics.clear();
    this.frontStarboardWheelShape.rotation = 0;
    this.frontStarboardWheelShape.graphics.clear();
    this.frontPortWheelShape.rotation = 0;
    this.frontPortWheelShape.graphics.clear();
    this.circleOfRotationShape.graphics.clear();

    this.initialFrontStarboardCornerFromLeft = startPosition.x;
    this.initialFrontStarboardCornerFromTop = startPosition.y;
    /**
     * Set up the car container.
     * - In the car container you add the car shape, 4 wheel shapes, two axle shapes, and other required shapes.  These all rotate together as the car container is rotated.  The wheels are set up so they can rotate within the car container.
     */

    /**
     * Sets the x and y coordinates which set the position on the canvas of the top left hand corner of the car container.
     * Note: All shapes in the car container rotate around this position and this position is not changed when the regX/regY or graphic.x/graphic.y properties change.
     */
    this.carContainer.set({
      x: this.initialCenterOfRotation(ERotateDirection.Counterclockwise).x,
      y: this.initialCenterOfRotation(ERotateDirection.Counterclockwise).y,
    });

    /**
     * Sets the co-ordinates of origin of the car container.  These are the co-ordinates against which each shape's x and y properties are translated to determine the position of the shape.
     * E.G.: If regX = -100 and shape.x = 100 then the x position is 0, i.e. the position is the translation of x by regX.
     */
    this.carContainer.set({ regX: 0, regY: 0 });

    /**
     * Set up the car shape.
     */

    /* Set the shape regX/regY to 0,0 and use x/y to position the shape */
    this.carShape.set({ regX: 0, regY: 0 });
    /* Set the reference point of the shape - this is initially set to the front starboard corner position by subtracting the container reference point from the absolute position of the front starboard corner. */
    this.carShape.set({
      x: this.initialFrontStarboardCorner.x - this.carContainer.x,
      y: this.initialFrontStarboardCorner.y - this.carContainer.y,
    });
    /* Draw a rectangle graphic with x/y = 0 so the graphic reference point can be gotten from the shape. */
    this.carShape.graphics.beginFill('LightGreen').beginStroke('Black').rect(
      /**
       * Sets the co-ordinates of the reference corner of the specific graphic based on the shape position.  The x and y values are added to the shape x and y values to get the position on the canvas.
       */
      0,
      0,
      /**
       * Use -ve to move the position of the shape reference point (which sets the radius to the rotation point determined above) from the default top left hand corner to the bottom right hand corner.
       * *Note This corresponds to setting the car reference point to the front starboard corner.
       */
      -this.length,
      -this.width,
    );

    /* Draw the front V */
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
    /* Draw the rear axle */
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.rearAxleToFront, -this.sideOverhang)
      .lineTo(
        -this.rearAxleToFront,
        -(this.sideOverhang + this.wheelToWheelWidth),
      );
    /* Draw the front axle */
    this.carShape.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-this.frontOverhang, -this.sideOverhang)
      .lineTo(
        -this.frontOverhang,
        -(this.sideOverhang + this.wheelToWheelWidth),
      );
    /* Dear the rear port wheel */
    this.carShape.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        -(this.rearAxleToFront + this.wheelLength / 2),
        -(this.sideOverhang + this.wheelWidth / 2 + 0.5),
        this.wheelLength,
        this.wheelWidth,
      );
    /* Draw the rear starboard wheel */
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
    this.carContainer.addChild(this.carShape);

    /**
     * Set up a shadow car shape that will hold any debug graphics.  This is necessary to avoid these debug graphics causing unexpected collisions.
     */
    this.shadowCarShape.set({ regX: 0, regY: 0 });
    this.shadowCarShape.set({
      x: this.initialFrontStarboardCorner.x - this.carContainer.x,
      y: this.initialFrontStarboardCorner.y - this.carContainer.y,
    });
    this.shadowCarShape.graphics
      .endFill()
      .rect(0, 0, -this.length, -this.width);
    /* Debug: Add a line showing a line back from the starboard-side */
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, 0)
      .lineTo(-2 * this.length, 0);
    /* Debug: Add a line showing a line back from the port */
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(-this.length, -this.width)
      .lineTo(-2 * this.length, -this.width);
    /* Debug: Add a line between centers of rotation */
    this.shadowCarShape.graphics
      .beginStroke('Blue')
      .setStrokeDash([20, 10], 0)
      .setStrokeStyle(1)
      .moveTo(
        /* The offset from the carShape x/y reference point, which is the starboard corner, to the port center of rotation */
        -this.rearAxleToFront,
        -(
          this.width / 2 +
          this.centerRearAxleTurningRadius(ERotateDirection.Counterclockwise)
        ),
      )
      .lineTo(
        /* The offset from the carShape x/y reference point, which is the starboard corner, to the starboard center of rotation */
        -this.rearAxleToFront,
        this.centerRearAxleTurningRadius(ERotateDirection.Counterclockwise) -
          this.width / 2,
      );
    this.carContainer.addChild(this.shadowCarShape);

    /* Set up the front starboard wheel shape (which rotates) */
    this.frontStarboardWheelShape.set({
      x: this.initialFStarboardWheelPosition.x - this.carContainer.x,
      y: this.initialFStarboardWheelPosition.y - this.carContainer.y,
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
    this.carContainer.addChild(this.frontStarboardWheelShape);

    /* Set up the front port wheel shape (which rotates) */
    this.frontPortWheelShape.set({
      x: this.initialFPortWheelPosition.x - this.carContainer.x,
      y: this.initialFPortWheelPosition.y - this.carContainer.y,
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
    this.carContainer.addChild(this.frontPortWheelShape);

    /* Debug: Add the front starboard corner turning circle */
    this.circleOfRotationShape.set({ x: 0, y: 0 });
    this.circleOfRotationShape.graphics
      .endFill()
      .beginStroke('Blue')
      /* Draw the circle around the container reference point which is the center of rotation for the car shape */
      .drawCircle(0, 0, this.turningRadius(ERotateDirection.Counterclockwise));
    this.carContainer.addChild(this.circleOfRotationShape);

    this.config.stage.addChild(this.carContainer);

    this.config.stage.update();
  }
}
