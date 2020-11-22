import * as createjs from 'createjs-module';
import { runInThisContext } from 'vm';
export class Car {
  /**
   * All distances in millimeters.
   * The input parameters to create a car are in actual real-world distances but the values stored in the instance properties are scaled by a factor that converts the distance in mm to the equivalent number of pixels.  See the note on the app component for the scaling factor value.
   * All angles in degrees.
   * The reference x-axis is the top of the canvas with the positive direction towards the right.
   * The reference y-axis is the left side of the canvas with the positive direction towards the bottom.
   * Angles are measured with respect to the x-axis.
   * Angle rotation is positive in the clockwise direction.
   * The center position of the car is the point midway between both front and back and midway between the 2 sides
   */

  /* All defaults */
  private defaultRearOverhang = 994 / 20;
  private defaultWheelBase = 3400 / 20;
  private defaultFrontOverhang = 894 / 20;
  private defaultWheelToWheelWidth = 1628 / 20;
  private defaultSideOverhang = 138 / 20;
  private defaultTyreWidth = 215 / 20;
  private defaultTyreLength = 540 / 20;
  private defaultMinTurningRadius = 6600 / 20;
  private defaultCenterPositionX = 3895 / 20;
  private defaultCenterPositionY = 1152 / 20;
  private defaultRotation = 0;
  private defaultSteeringWheelAnglePercentage = 0;

  /* Set by the create() method */
  private rearOverhang = this.defaultRearOverhang;
  private wheelBase = this.defaultWheelBase;
  private frontOverhang = this.defaultFrontOverhang;
  private wheelToWheelWidth = this.defaultWheelToWheelWidth;
  private sideOverhang = this.defaultSideOverhang;
  private minTurningRadius = this.defaultMinTurningRadius;
  private centerPositionX = this.defaultCenterPositionX;
  private centerPositionY = this.defaultCenterPositionY;
  private tyreWidth = this.defaultTyreWidth;
  private tyreLength = this.defaultTyreLength;
  private rotation = this.defaultRotation;
  private steeringWheelAnglePercentage = this
    .defaultSteeringWheelAnglePercentage;

  /* Set by the constructor */
  private stage: createjs.Stage;
  private canvasH: number;
  private scale: number;
  private speed: number;
  private carContainer = new createjs.Container();
  private car = new createjs.Shape();
  private frontDTyre = new createjs.Shape();
  private frontPTyre = new createjs.Shape();

  /**
   * Creates a car class.
   * Th car is created on the canvas when the instance create() method is called.
   * The car can be moved through associated methods.
   *
   * @param stage: The stage on the canvas to be drawn to.
   * @param scale: Scales distance in mm to pixels on the canvas.
   */

  constructor({
    stage,
    scale = 20,
  }: {
    stage: createjs.Stage;
    scale?: number;
  }) {
    this.stage = stage;
    this.canvasH = (stage.canvas as HTMLCanvasElement).height;
    this.scale = scale;
  }

  public get length(): number {
    return this.rearOverhang + this.wheelBase + this.frontOverhang;
  }

  public get width(): number {
    return this.wheelToWheelWidth + 2 * this.sideOverhang;
  }

  public get rearBumperX(): number {
    return this.centerPositionX - this.length / 2;
  }

  public get bottom(): number {
    return this.centerPositionY - this.width / 2;
  }

  /**
   * minWheelbaseTurnCentre is the distance from the turn centre at full steer to the far side of the car opposite the wheelbase.
   */
  public get minWheelbaseTurnCentre(): number {
    return Math.sqrt(
      Math.pow(this.minTurningRadius, 2) -
        Math.pow(this.frontOverhang + this.wheelBase, 2),
    );
  }

  /**
   * The angle in degrees between a tangent to the rotation circle, when turning the minimum turning circle, and a line lengthwise through the car.
   * It assumes the supplied minTurningRadius is the radius of the turning circle of the outer front corner of the van.
   */
  public get turnAngleMax(): number {
    const rearAxleToFront = this.frontOverhang + this.wheelBase;
    return Math.asin(rearAxleToFront / this.minTurningRadius) * (180 / Math.PI);
  }

  /**
   * The turning angle based on the steering wheel turn position.
   */
  public get turnAngle(): number {
    return (this.turnAngleMax * this.steeringWheelAnglePercentage) / 100;
  }

  /**
   * The turning radius based on the steering wheel turn position.
   */
  public get turningRadius(): number {
    const rearAxleToFront = this.frontOverhang + this.wheelBase;
    const radius = rearAxleToFront / Math.sin((this.turnAngle * Math.PI) / 180);
    return Math.round(Math.abs(radius));
  }

  /**
   * wheelbaseTurnCentre is the distance from the turn centre to the far side of the car opposite the wheelbase.  It runs through the rear axle.
   */
  public get wheelbaseTurnCentre(): number {
    const rearAxleToFront = this.frontOverhang + this.wheelBase;
    return Math.sqrt(
      Math.pow(this.turningRadius, 2) - Math.pow(rearAxleToFront, 2),
    );
  }

  private get rotationX() {
    const perpDistRotationToVan = this.wheelbaseTurnCentre - this.width;
    const perpDistCenterToRearAxle = this.centerPositionX - this.rearOverhang;
    const rotationToCenter = Math.sqrt(
      Math.pow(perpDistRotationToVan, 2) +
        Math.pow(perpDistCenterToRearAxle, 2),
    );
    const offsetAngle =
      (Math.atan(perpDistCenterToRearAxle / perpDistRotationToVan) * 180) /
      Math.PI;
      const OffsetX = rotationToCenter * Math.cos(offsetAngle * Math.PI / 180);
    const OffsetX = rotationToCenter * Math.cos(offsetAngle * Math.PI / 180);
    rotationY = this.canvasH - (carScaledFromBottom + wheebaseScaledTurnCentre);
  }



  /**
   * Creates a new car on the canvas.
   * It removes a previously created car if there is one.
   * The car will be sized and positioned based on supplied parameters.
   * The car will be stationery on creation.
   *
   * @param rearOverhang: Distance from rear axle to rear bumper
   * @param wheelBase: Distance from front axle to rear axle
   * @param frontOverhang: Distance from front axle to front bumper
   * @param wheelToWheelWidth: Distance from centre wheel to centre wheel on the same axis
   * @param sideOverhang: Distance from centre wheel to side wall (not including mirrors)
   * @param tyreWidth: Width of the tyres.
   * @param tyreLength: Length of the tyres.
   * @param centerPositionX: Distance from the center of the car to the reference y axis
   * @param centerPositionY: Distance from the center of the car to the reference x axis
   * @param rotation: The angle formed by a line lengthwise through the car and the x-axis
   * @param minTurningRadius: Radius of the circle formed by front outside corner when steering wheel at maximum turn
   * @param steeringWheelAnglePercentage: The turn of the steering wheel from -100 (max CCW) to 100 (max CW)
   */
  create(
    rearOverhang = this.defaultRearOverhang * this.scale,
    wheelBase = this.defaultWheelBase,
    frontOverhang = this.defaultFrontOverhang,
    wheelToWheelWidth = this.defaultWheelToWheelWidth,
    sideOverhang = this.defaultSideOverhang,
    tyreWidth = this.defaultTyreWidth,
    tyreLength = this.defaultTyreLength,
    minTurningRadius = this.defaultMinTurningRadius,
    centerPositionX = this.defaultCenterPositionX,
    centerPositionY = this.defaultCenterPositionY,
    rotation = this.defaultRotation,
    steeringWheelAnglePercentage = this.defaultSteeringWheelAnglePercentage,
  ) {
    /* Car size input parameters */
    this.rearOverhang = rearOverhang / this.scale;
    this.wheelBase = wheelBase / this.scale;
    this.frontOverhang = frontOverhang / this.scale;
    this.wheelToWheelWidth = wheelToWheelWidth / this.scale;
    this.sideOverhang = sideOverhang / this.scale;
    this.tyreWidth = tyreWidth / this.scale;
    this.tyreLength = tyreLength / this.scale;
    this.minTurningRadius = minTurningRadius / this.scale;
    this.centerPositionX = centerPositionX / this.scale;
    this.centerPositionY = centerPositionY / this.scale;
    this.rotation = rotation;
    /* Limit input steeringwheel angle percentage to -100 to +100 */
    this.steeringWheelAnglePercentage =
      steeringWheelAnglePercentage >= 0
        ? Math.min(steeringWheelAnglePercentage, +100)
        : Math.max(steeringWheelAnglePercentage, -100);

    /* Car position calculated parameters */
    const carFromTop = this.canvasH - carWidth - carFromBottom;

    /* Car movement calculated parameters */
    const wheebaseScaledTurnCentre = this.wheelbaseTurnCentre / this.scale;

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
    this.carContainer.set({ x: rotationX, y: rotationY });

    const carGraphicsX = carScaledFromLeft + carScaledLength - rotationX;
    const carGraphicsY = carFromTop + carScaledWidth - rotationY;
    this.car.graphics.beginFill('LightGreen').beginStroke('Black').rect(
      /**
       * Sets the co-ordinates of the reference corner of the Graphic based on the Shape position as determined above.
       * This is set to the front driver-side tyre.
       */
      carGraphicsX,
      carGraphicsY,
      /**
       * Can use -ve to move the position of the shape reference point (which sets the radius to the rotation point determined above) from the default top left hand corner.
       */
      -carScaledLength,
      -carScaledWidth,
    );
    this.carContainer.addChild(this.car);

    const rearAxle = new createjs.Shape();
    rearAxle.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        carGraphicsX - scaledFrontOverhang - scaledWheelBase,
        carGraphicsY - scaledSideOverhang,
      )
      .lineTo(
        carGraphicsX - scaledFrontOverhang - scaledWheelBase,
        carGraphicsY - scaledSideOverhang - scaledWheelToWheelWidth,
      );
    this.carContainer.addChild(rearAxle);

    const frontAxle = new createjs.Shape();
    frontAxle.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        carGraphicsX - scaledFrontOverhang,
        carGraphicsY - scaledSideOverhang,
      )
      .lineTo(
        carGraphicsX - scaledFrontOverhang,
        carGraphicsY - carScaledWidth + scaledSideOverhang,
      );
    this.carContainer.addChild(frontAxle);

    this.frontDTyre.set({
      x: carGraphicsX - scaledFrontOverhang,
      y: carGraphicsY - scaledSideOverhang,
    });
    this.frontDTyre.graphics
      .beginStroke('Black')
      .setStrokeStyle(1)
      .moveTo(-scaledTyreLength / 2, 0)
      .lineTo(scaledTyreLength / 2, 0);
    this.carContainer.addChild(this.frontDTyre);

    this.frontPTyre.set({
      x: carGraphicsX - scaledFrontOverhang,
      y: carGraphicsY - carScaledWidth + scaledSideOverhang,
    });
    this.frontPTyre.graphics
      .beginStroke('Black')
      .setStrokeStyle(1)
      .moveTo(-scaledTyreLength / 2, 0)
      .lineTo(scaledTyreLength / 2, 0);
    this.carContainer.addChild(this.frontPTyre);

    const rearDTyre = new createjs.Shape();
    rearDTyre.set({
      x: carGraphicsX - scaledWheelBase - scaledFrontOverhang,
      y: carGraphicsY - scaledSideOverhang,
    });
    rearDTyre.graphics
      .beginStroke('Black')
      .setStrokeStyle(1)
      .moveTo(-scaledTyreLength / 2, 0)
      .lineTo(scaledTyreLength / 2, 0);
    this.carContainer.addChild(rearDTyre);

    const rearPTyre = new createjs.Shape();
    rearPTyre.set({
      x: carGraphicsX - scaledWheelBase - scaledFrontOverhang,
      y: carGraphicsY - carScaledWidth + scaledSideOverhang,
    });
    rearPTyre.graphics
      .beginStroke('Black')
      .setStrokeStyle(1)
      .moveTo(-scaledTyreLength / 2, 0)
      .lineTo(scaledTyreLength / 2, 0);
    this.carContainer.addChild(rearPTyre);

    this.stage.addChild(this.carContainer);

    /* Add the front driver's corner turning circle for debug */
    const circle = new createjs.Shape();
    circle.set({ x: rotationX, y: rotationY });
    circle.graphics
      .endFill()
      .beginStroke('Black')
      .drawCircle(0, 0, this.minTurningRadius / this.scale);
    this.stage.addChild(circle);

    this.stage.update();
  }

  /** This moves the car in the direction it is facing, or the reverse.  There is no change in the angle of the car.
   * @param deltaPosition: The distance to move the car in unscaled millimeters.  A positive value moves the car forward and a negative value moves it in reverse.  Although any number corresponding to the Javascript number type is accepted, it is rounded to the nearest integer.
   */
  public moveLinear(deltaPosition: number) {
    /* Set wheels to straight */
    this.frontDTyre.rotation = 0;
    this.frontPTyre.rotation = 0;
    /* Create a tick very 10ms */
    const FPS = 100;
    createjs.Ticker.framerate = FPS;
    /* Calculate the distance moved in 1 tick */
    const tickTime = 1 / FPS;
    const scaledSpeed = this.speed / this.scale;
    const tickMoveX =
      Math.sign(deltaPosition) *
      scaledSpeed *
      tickTime *
      Math.cos(this.carContainer.rotation);
    /* Capture the current position */
    const startX = this.carContainer.x;
    /* Round the distance to move and calculate the scaled distance */
    deltaPosition = Math.round(deltaPosition);
    const scaledDistanceToMove = deltaPosition / this.scale;

    /**
     * Move the required distance in a series of ticks.
     */
    const onTick: any = {
      /**
       * @param event: The event object.  (The interface calls for type Object so type 'any' is used).
       * @param data: data.move is the unscaled distance to be moved.  (The parameter is not included in the interface definition so 'any' type is used for the holding onTick object.
       */
      handleEvent: (event: any, data: { deltaPosition: number }) => {
        const leftToMove = startX + scaledDistanceToMove - this.carContainer.x;
        if (Math.abs(leftToMove) < Math.abs(tickMoveX)) {
          /* Don't overshoot the required distance */
          this.carContainer.x += leftToMove;
        } else {
          this.carContainer.x += tickMoveX;
        }
        this.stage.update();
        console.log(this.carContainer.x);
        console.log(startX + scaledDistanceToMove);
        /* Remove the listener when target distance is travelled */
        if (this.carContainer.x === startX + scaledDistanceToMove) {
          createjs.Ticker.off('tick', listener);
        }
      },
    };
    /* Create a tick listener and call an object with a handleEvent property and pass it the final parameter object */
    const listener = createjs.Ticker.on('tick', onTick, undefined, false, {
      deltaPosition: deltaPosition,
    });
  }

  /** This moves the car with the steering wheel turned.
   * @param deltaAngle: The desired change in angle of the car in degrees.  A positive value rotates the car clockwise and a negative value rotates it in counterclockwise.
   * @param steeringWheelTurn: The percentage turn of the steering wheel from -100 representing fully counterclockwise, (and turning the car counterclockwise) to 100 representing fully clockwise (and turning the car clockwise).
   */
  public moveAngle(deltaAngle: number, steeringWheelTurnPercentage: number) {
    /* Limit input steeringwheel percentage */
    this._steeringWheelAnglePercentage = steeringWheelTurnPercentage;
    /* Set wheels per steering wheel angle */
    this.frontDTyre.rotation = this.turnAngle;
    this.frontPTyre.rotation = this.turnAngle;
    /* Create a tick very 10ms */
    const FPS = 100;
    createjs.Ticker.framerate = FPS;
    /* Calculate the angle turned moved in 1 tick */
    const tickTime = 1 / FPS;
    const tickMove = Math.sign(deltaAngle) * this.speed * tickTime;
    const tickAngle = (tickMove / this.turningRadius) * (180 / Math.PI);
    /* Capture the current angle */
    const startAngle = this.carContainer.rotation;

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
        this.stage.update();
        console.log(this.carContainer.rotation);
        console.log(startAngle + data.deltaAngle);
        /* Remove the listener when target distance is travelled */
        if (this.carContainer.rotation === startAngle + data.deltaAngle) {
          createjs.Ticker.off('tick', listener);
        }
      },
    };
    /* Create a tick listener and call an object with a handleEvent property and pass it the final parameter object */
    const listener = createjs.Ticker.on('tick', onTick, undefined, false, {
      deltaAngle: deltaAngle,
    });
  }
}
