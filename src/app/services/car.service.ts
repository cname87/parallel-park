import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
/**
 * All distances in millimeters.
 * The input parameters to create a car are in actual real-world distances but the values stored in the instance properties are scaled by a factor that converts the distance in mm to the equivalent number of pixels.  See the note on the app component for the scaling factor value.
 * All angles in degrees.
 * The reference x-axis is the top of the canvas with the positive direction towards the right.
 * The reference y-axis is the left side of the canvas with the positive direction towards the bottom.
 * Angles are measured with respect to the x-axis.
 * Angles are positive in the clockwise direction.  0 to 180 as the car rotates clockwise and o to -180 as the car rotates counter clockwise.
 * The center position of the car is the point midway between both front and back and midway between the 2 sides
 */
export class CarService {
  private rearOverhang = this.config.defaultRearOverhang;
  private wheelbase = this.config.defaultWheelBase;
  private frontOverhang = this.config.defaultFrontOverhang;
  private wheelToWheelWidth = this.config.defaultWheelToWheelWidth;
  private sideOverhang = this.config.defaultSideOverhang;
  private minTurningRadius = this.config.defaultMinTurningRadius;
  private frontDCornerFromLeft = this.config.defaultFrontDCornerFromLeft;
  private frontDCornerFromBottom = this.config.defaultFrontDCornerFromBottom;
  private tyreWidth = this.config.defaultTyreWidth;
  private tyreLength = this.config.defaultTyreLength;
  private rotation = this.config.defaultRotation;
  private steeringWheelAnglePercentage = this.config
    .defaultSteeringWheelAnglePercentage;

  /* Needed across methods */
  private carContainer = new createjs.Container();
  private car = new createjs.Shape();
  private frontDTyre = new createjs.Shape();
  private frontPTyre = new createjs.Shape();

  /**
   * Creates a car class.
   * The car is created on the canvas when the instance create() method is called.
   * The car can be moved through associated methods.
   */

  constructor(private config: ConfigService) {}

  private get length(): number {
    return this.rearOverhang + this.wheelbase + this.frontOverhang;
  }

  private get width(): number {
    return this.wheelToWheelWidth + 2 * this.sideOverhang;
  }

  private get rearAxleToFront(): number {
    return this.wheelbase + this.frontOverhang;
  }

  /* The createjs reference point of the car which I set up below to be the front driver-side corner. */
  private get referencePoint() {
    return {
      x: this.frontDCornerFromLeft,
      y: this.config.canvasH - this.frontDCornerFromBottom,
    };
  }

  /**
   * The angle in degrees between a tangent to the rotation circle, when turning the minimum turning circle, and a line lengthwise through the car.
   * It assumes the supplied minTurningRadius is the radius of the turning circle of the outer front corner of the van.
   */
  private get turnAngleMax(): number {
    return (
      Math.asin(this.rearAxleToFront / this.minTurningRadius) * (180 / Math.PI)
    );
  }

  /**
   * The turnAngle is the angle in degrees between a tangent to the rotation circle and a line lengthwise through the car.  It is assumed to be directly proportional to the steering wheel turn position.
   * If postive the can is turning to the right (clockwise), and if negative the car is turning left (counterclockwise)
   */
  private get turnAngle(): number {
    return (this.turnAngleMax * this.steeringWheelAnglePercentage) / 100;
  }

  /**
   * The turning radius based on the steering wheel turn position.
   */
  private get turningRadius(): number {
    const radius =
      this.rearAxleToFront / Math.sin((this.turnAngle * Math.PI) / 180);
    return Math.round(Math.abs(radius));
  }

  /**
   * The wheelbaseTurnCentre is the distance from the centre of rotation to the far side of the car opposite the wheelbase.  It runs through the rear axle.
   */
  private get wheelbaseTurnCentre(): number {
    return Math.round(
      Math.sqrt(
        Math.pow(this.turningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
      ),
    );
  }

  /**
   * The angle in degrees of the front driver-side tyre, which is the angle of tangent to the circle of rotation though that tyre.
   */
  private get frontDTyreAngle(): number {
    return (
      /* When steering wheel angle percentage is negative the tyre is turned left which corresponds to a negative angle */
      (Math.sign(this.steeringWheelAnglePercentage) *
        (Math.atan(
          this.wheelbase / (this.wheelbaseTurnCentre - this.sideOverhang),
        ) *
          180)) /
      Math.PI
    );
  }

  /**
   * The angle in degrees of the front passenger-side tyre, which is the angle of tangent to the circle of rotation though that tyre.
   */
  private get frontPTyreAngle(): number {
    return (
      /* When steering wheel angle percentage is negative the tyre is turned left which corresponds to a negative angle */
      (Math.sign(this.steeringWheelAnglePercentage) *
        (Math.atan(
          this.wheelbase /
            (this.wheelbaseTurnCentre -
              this.wheelToWheelWidth -
              this.sideOverhang),
        ) *
          180)) /
      Math.PI
    );
  }

  /**
   * The point around which the car rotates when turning.  It is the intersection of a line through the rear axle and a line perpendicular to either tyre.  (Each tyre is turned at a different angle).
   * Note that this needs to be expressed in terms of absolute the canvas x and y co-ordinates..
   */
  private get centerOfRotation() {
    /* Angle in degrees between the line from centre of rotation to front driver-side corner and a line lengthwise through the car. */
    const angleA =
      (Math.acos(this.rearAxleToFront / this.turningRadius) * 180) / Math.PI;
    /* Angle in degrees between the line from centre of rotation to front driver-side corner and a line horizontal to the x-axis. */
    const angleB = angleA - this.rotation;
    /* x and y offsets from center of rotation to the car reference point */
    const offsetX = this.turningRadius * Math.cos((angleB * Math.PI) / 180);
    const offsetY = this.turningRadius * Math.sin((angleB * Math.PI) / 180);

    const left = {
      x: this.referencePoint.x - offsetX,
      y: this.referencePoint.y - offsetY,
    };
    const w = 2 * (this.wheelbaseTurnCentre - this.width / 2);
    const offsetX2 = w * Math.sin((this.rotation * Math.PI) / 180);
    const offsetY2 = w * Math.cos((this.rotation * Math.PI) / 180);

    const right = {
      x: left.x + offsetX2,
      y: left.y + offsetY2,
    };
    return right;
  }

  /**
   * Creates a new car on the canvas.
   * It removes a previously created car if there is one.
   * The car will be sized and positioned based on supplied parameters.
   * The car will be stationery on creation.
   *
   * @param stage: The stage on the canvas to be drawn to.
   * @param rearOverhang: Distance from rear axle to rear bumper
   * @param wheelbase: Distance from front axle to rear axle
   * @param frontOverhang: Distance from front axle to front bumper
   * @param wheelToWheelWidth: Distance from centre wheel to centre wheel on the same axis
   * @param sideOverhang: Distance from centre wheel to side wall (not including mirrors)
   * @param tyreWidth: Width of the tyres.
   * @param tyreLength: Length of the tyres.
   * @param frontDCornerFromLeft: Distance from the center of the car to the reference y axis
   * @param frontDCornerFromBottom: Distance from the center of the car to the reference x axis
   * @param rotation: The angle formed by a line lengthwise through the car and the x-axis
   * @param minTurningRadius: Radius of the circle formed by front outside corner when steering wheel at maximum turn
   * @param steeringWheelAnglePercentage: The turn of the steering wheel from -100 (max CCW) to 100 (max CW)
   * @param speed: The speed in unscaled mm per second which the car moves at when asked to move. Note: the car only moves when commanded to do so.
   */
  create({
    rearOverhang = this.config.defaultRearOverhang * this.config.distScale,
    wheelbase = this.config.defaultWheelBase * this.config.distScale,
    frontOverhang = this.config.defaultFrontOverhang * this.config.distScale,
    wheelToWheelWidth = this.config.defaultWheelToWheelWidth *
      this.config.distScale,
    sideOverhang = this.config.defaultSideOverhang * this.config.distScale,
    tyreWidth = this.config.defaultTyreWidth * this.config.distScale,
    tyreLength = this.config.defaultTyreLength * this.config.distScale,
    minTurningRadius = this.config.defaultMinTurningRadius *
      this.config.distScale,
    frontDCornerFromLeft = this.config.defaultFrontDCornerFromLeft *
      this.config.distScale,
    frontDCornerFromBottom = this.config.defaultFrontDCornerFromBottom *
      this.config.distScale,
    rotation = this.config.defaultRotation,
    steeringWheelAnglePercentage = this.config
      .defaultSteeringWheelAnglePercentage,
    speed = this.config.defaultSpeed * this.config.distScale,
  }: {
    rearOverhang?: number;
    wheelbase?: number;
    frontOverhang?: number;
    wheelToWheelWidth?: number;
    sideOverhang?: number;
    tyreWidth?: number;
    tyreLength?: number;
    minTurningRadius?: number;
    frontDCornerFromLeft?: number;
    frontDCornerFromBottom?: number;
    rotation?: number;
    steeringWheelAnglePercentage?: number;
    speed?: number;
  }) {
    /* Car size input parameters */
    this.rearOverhang = Math.round(rearOverhang / this.config.distScale);
    this.wheelbase = Math.round(wheelbase / this.config.distScale);
    this.frontOverhang = Math.round(frontOverhang / this.config.distScale);
    this.wheelToWheelWidth = Math.round(
      wheelToWheelWidth / this.config.distScale,
    );
    this.sideOverhang = Math.round(sideOverhang / this.config.distScale);
    this.tyreWidth = Math.round(tyreWidth / this.config.distScale);
    this.tyreLength = Math.round(tyreLength / this.config.distScale);
    this.minTurningRadius = Math.round(
      minTurningRadius / this.config.distScale,
    );
    this.frontDCornerFromLeft = Math.round(
      frontDCornerFromLeft / this.config.distScale,
    );
    this.frontDCornerFromBottom = Math.round(
      frontDCornerFromBottom / this.config.distScale,
    );
    this.rotation = rotation;
    this.steeringWheelAnglePercentage = steeringWheelAnglePercentage;

    /* Create the car */
    /**
     * Sets the co-ordinates of origin of the Shape (with x +ve right and y +ve down).  These are the co-ordinates against which the shape's x and y is translated to determine the position.  If these are (0,0) then the shape x and y properties equal its position but if these are not equal (0,0) then the shape's x and y properties do not determine its position.
     * E.G.: If regX = -100 and x = 100 then the x position is 0, i.e. the position is the translation of x on regX.
     */
    this.carContainer.set({ regX: 0, regY: 0 });
    /**
     * Sets the position of the top left hand corner of the Shape based on the origin co-ordinates set by regX and regY - see above
     * * NB: All rotations are around this position..
     */
    this.carContainer.set({
      x: this.centerOfRotation.x,
      y: this.centerOfRotation.y,
    });

    this.car.graphics
      .beginFill('LightGreen')
      .beginStroke('Black')
      .rect(
        /**
         * Sets the co-ordinates of the reference corner of the Graphic based on the Shape position as determined above.
         * This is set to the front driver-side tyre.
         */
        this.referencePoint.x - this.centerOfRotation.x,
        this.referencePoint.y - this.centerOfRotation.y,
        /**
         * Can use -ve to move the position of the shape reference point (which sets the radius to the rotation point determined above) from the default top left hand corner.
         */
        -this.length,
        -this.width,
      );
    this.carContainer.addChild(this.car);

    const rearAxle = new createjs.Shape();
    rearAxle.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.referencePoint.x - this.rearAxleToFront - this.centerOfRotation.x,
        this.referencePoint.y - this.sideOverhang - this.centerOfRotation.y,
      )
      .lineTo(
        this.referencePoint.x - this.rearAxleToFront - this.centerOfRotation.x,
        this.referencePoint.y -
          this.wheelToWheelWidth -
          this.sideOverhang -
          this.centerOfRotation.y,
      );
    this.carContainer.addChild(rearAxle);

    const frontAxle = new createjs.Shape();
    frontAxle.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.referencePoint.x - this.frontOverhang - this.centerOfRotation.x,
        this.referencePoint.y - this.sideOverhang - this.centerOfRotation.y,
      )
      .lineTo(
        this.referencePoint.x - this.frontOverhang - this.centerOfRotation.x,
        this.referencePoint.y -
          this.wheelToWheelWidth -
          this.sideOverhang -
          this.centerOfRotation.y,
      );
    this.carContainer.addChild(frontAxle);

    this.frontDTyre.set({
      x: this.referencePoint.x - this.frontOverhang - this.centerOfRotation.x,
      y: this.referencePoint.y - this.sideOverhang - this.centerOfRotation.y,
    });
    this.frontDTyre.graphics
      .beginFill('Black')
      .setStrokeStyle(1)
      .rect(
        -this.tyreLength / 2,
        -this.tyreWidth / 2,
        this.tyreLength,
        this.tyreWidth,
      );
    this.carContainer.addChild(this.frontDTyre);

    this.frontPTyre.set({
      x: this.referencePoint.x - this.frontOverhang - this.centerOfRotation.x,
      y:
        this.referencePoint.y -
        this.wheelToWheelWidth -
        this.sideOverhang -
        this.centerOfRotation.y,
    });
    this.frontPTyre.graphics
      .beginFill('Black')
      .setStrokeStyle(1)
      .rect(
        -this.tyreLength / 2,
        -this.tyreWidth / 2,
        this.tyreLength,
        this.tyreWidth,
      );
    this.carContainer.addChild(this.frontPTyre);

    const rearDTyre = new createjs.Shape();
    rearDTyre.set({
      x:
        this.referencePoint.x -
        this.frontOverhang -
        this.centerOfRotation.x -
        this.wheelbase,
      y: this.referencePoint.y - this.sideOverhang - this.centerOfRotation.y,
    });
    rearDTyre.graphics
      .beginFill('Black')
      .setStrokeStyle(1)
      .rect(
        -this.tyreLength / 2,
        -this.tyreWidth / 2,
        this.tyreLength,
        this.tyreWidth,
      );
    this.carContainer.addChild(rearDTyre);

    const rearPTyre = new createjs.Shape();
    rearPTyre.set({
      x:
        this.referencePoint.x -
        this.frontOverhang -
        this.centerOfRotation.x -
        this.wheelbase,
      y:
        this.referencePoint.y -
        this.wheelToWheelWidth -
        this.sideOverhang -
        this.centerOfRotation.y,
    });
    rearPTyre.graphics
      .beginFill('Black')
      .setStrokeStyle(1)
      .rect(
        -this.tyreLength / 2,
        -this.tyreWidth / 2,
        this.tyreLength,
        this.tyreWidth,
      );
    this.carContainer.addChild(rearPTyre);

    this.config.stage.addChild(this.carContainer);

    this.config.stage.update();
  }

  /** This moves the car in the direction it is facing, or the reverse.  There is no change in the angle of the car.
   * @param deltaPosition: The distance to move the car in unscaled millimeters.  A positive value moves the car forward and a negative value moves it in reverse.  Although any number corresponding to the Javascript number type is accepted, it is rounded to the nearest integer.
   */
  public moveLinear({
    fwdOrReverse,
    deltaPosition,
    speed = this.config.defaultSpeed,
  }: {
    fwdOrReverse: -1 | 1;
    deltaPosition: number;
    speed?: number;
  }) {
    return new Promise((resolve, reject) => {
      /* Set wheels to straight */
      this.frontDTyre.rotation = 0;
      this.frontPTyre.rotation = 0;
      /* Create a tick at the FPS rate*/
      createjs.Ticker.framerate = this.config.FPS;
      /* Calculate the distance moved in 1 tick */
      const tickTime = 1 / this.config.FPS;
      const tickMoveX =
        Math.sign(fwdOrReverse) *
        speed *
        tickTime *
        Math.cos(this.carContainer.rotation);
      /* Capture the current position */
      const startX = this.carContainer.x;
      /* Round the distance to move and calculate the scaled distance */
      deltaPosition = Math.round(deltaPosition);
      const scaledDistanceToMove = deltaPosition / this.config.distScale;

      /**
       * Move the required distance in a series of ticks.
       */
      const onTick: any = {
        /**
         * @param event: The event object.  (The interface calls for type Object so type 'any' is used).
         * @param data: data.move is the unscaled distance to be moved.  (The parameter is not included in the interface definition so 'any' type is used for the holding onTick object.
         */
        handleEvent: (event: any, data: { deltaPosition: number }) => {
          const leftToMove =
            startX + scaledDistanceToMove - this.carContainer.x;
          if (Math.abs(leftToMove) < Math.abs(tickMoveX)) {
            /* Don't overshoot the required distance */
            this.carContainer.x += leftToMove;
          } else {
            this.carContainer.x += tickMoveX;
          }
          this.config.stage.update();
          // console.log(this.carContainer.x);
          // console.log(startX + scaledDistanceToMove);
          /* Remove the listener when target distance is travelled */
          if (this.carContainer.x === startX + scaledDistanceToMove) {
            createjs.Ticker.off('tick', listener);
            resolve();
          }
        },
      };
      /* Create a tick listener and call an object with a handleEvent property and pass it the final parameter object */
      const listener = createjs.Ticker.on('tick', onTick, undefined, false, {
        deltaPosition: deltaPosition,
      });
    });
  }

  /** This moves the car with the steering wheel turned.
   * @param deltaAngle: The desired change in angle of the car in degrees.  A positive value rotates the car clockwise and a negative value rotates it in counterclockwise.
   * @param steeringWheelTurn: The percentage turn of the steering wheel from -100 representing fully counterclockwise, (and turning the car counterclockwise) to 100 representing fully clockwise (and turning the car clockwise).
   */
  public moveAngle({
    fwdOrReverse,
    deltaAngle,
    steeringWheelTurnPercentage,
    speed = this.config.defaultSpeed,
  }: {
    fwdOrReverse: 'forward' | 'reverse';
    deltaAngle: number;
    steeringWheelTurnPercentage: number;
    speed?: number;
  }) {
    return new Promise((resolve, reject) => {
      /* Input steeringwheel percentage */
      this.steeringWheelAnglePercentage = steeringWheelTurnPercentage;
      console.log(Math.sign(steeringWheelTurnPercentage));
      let angleSign: -1 | 0 | 1 = 0;
      /**
       * If going forward and left then turning counterclockwise so the angle moved will be negative. */
      if (
        fwdOrReverse === 'forward' &&
        Math.sign(steeringWheelTurnPercentage) === -1
      ) {
        console.log('1xxxxxx');
        angleSign = -1;
      }
      /* If going forward & right then turning clockwise so the angle moved will be positive. */
      if (
        fwdOrReverse === 'forward' &&
        Math.sign(steeringWheelTurnPercentage) === +1
      ) {
        angleSign = +1;
        console.log('2xxxxxx');
      }
      /* If going reverse & left then turning clockwise so the angle moved will be positive. */
      if (
        fwdOrReverse === 'reverse' &&
        Math.sign(steeringWheelTurnPercentage) === -1
      ) {
        angleSign = +1;
        console.log('3xxxxxx');
      }
      /* If going reverse & right then turning counterclockwise so the angle moved will be negative. */
      if (
        fwdOrReverse === 'reverse' &&
        Math.sign(steeringWheelTurnPercentage) === +1
      ) {
        angleSign = -1;
        console.log('4xxxxxx');
      }
      /* Set the direction of input angle to move */
      deltaAngle = angleSign * deltaAngle;

      /* Set wheels per steering wheel angle */
      this.frontDTyre.rotation = this.frontDTyreAngle;
      this.frontPTyre.rotation = this.frontPTyreAngle;
      /* Create a tick at the FPS rate */
      createjs.Ticker.framerate = this.config.FPS;
      /* Calculate the angle turned moved in 1 tick */
      const tickTime = 1 / this.config.FPS;
      const tickMove = angleSign * speed * tickTime;
      const tickAngle = (tickMove / this.turningRadius) * (180 / Math.PI);
      /* Capture the current angle */
      const startAngle = this.carContainer.rotation;

      /* Add the front driver's corner turning circle for debug */
      const circle = new createjs.Shape();
      circle.set({ x: this.carContainer.x, y: this.carContainer.y });
      circle.graphics
        .endFill()
        .beginStroke('Black')
        .drawCircle(0, 0, this.turningRadius);
      this.config.stage.addChild(circle);

      /**
       * Move the required distance in a series of ticks.
       */
      const onTick: any = {
        /**
         * @param event: The event object.  (The interface calls for type Object so type 'any' is used).
         * @param data: data.move is the unscaled distance to be moved.  (The parameter is not included in the interface definition so 'any' type is used for the holding onTick object.
         */
        handleEvent: (event: any, data: { deltaAngle: number }) => {
          const leftToMove =
            startAngle + data.deltaAngle - this.carContainer.rotation;
          if (Math.abs(leftToMove) < Math.abs(tickAngle)) {
            /* Don't overshoot the required distance */
            this.carContainer.rotation += leftToMove;
          } else {
            this.carContainer.rotation += tickAngle;
          }
          this.config.stage.update();
          // console.log(startAngle);
          // console.log(data.deltaAngle);
          // console.log(this.carContainer.rotation);
          // console.log(leftToMove);
          /* Remove the listener when target distance is travelled */
          if (this.carContainer.rotation === startAngle + data.deltaAngle) {
            /* Set wheels to straight */
            this.frontDTyre.rotation = 0;
            this.frontPTyre.rotation = 0;
            this.config.stage.update();
            createjs.Ticker.off('tick', listener);
            resolve();
          }
        },
      };
      /* Create a tick listener and call an object with a handleEvent property and pass it the final parameter object */
      const listener = createjs.Ticker.on('tick', onTick, undefined, false, {
        deltaAngle: deltaAngle,
      });
    });
  }
}
