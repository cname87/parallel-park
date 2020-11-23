import * as createjs from 'createjs-module';
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
  private defaultRearOverhang = Math.round(994 / 20);
  private defaultWheelBase = Math.round(3400 / 20);
  private defaultFrontOverhang = Math.round(894 / 20);
  private defaultWheelToWheelWidth = Math.round(1628 / 20);
  private defaultSideOverhang = Math.round(138 / 20);
  private defaultTyreWidth = Math.round(215 / 20);
  private defaultTyreLength = Math.round(540 / 20);
  private defaultMinTurningRadius = Math.round(6600 / 20);
  private defaultFrontDCornerFromLeft = Math.round(
    (1000 + 250 + 994 + 3400 + 894) / 20,
  );
  private defaultFrontDCornerFromBottom = Math.round(200 / 20);
  private defaultRotation = 0;
  private defaultSteeringWheelAnglePercentage = -100;
  private defaultSpeed = Math.round(1000 / 20);

  /* Set by the create() method */
  private rearOverhang = this.defaultRearOverhang;
  private wheelbase = this.defaultWheelBase;
  private frontOverhang = this.defaultFrontOverhang;
  private wheelToWheelWidth = this.defaultWheelToWheelWidth;
  private sideOverhang = this.defaultSideOverhang;
  private minTurningRadius = this.defaultMinTurningRadius;
  private frontDCornerFromLeft = this.defaultFrontDCornerFromLeft;
  private frontDCornerFromBottom = this.defaultFrontDCornerFromBottom;
  private tyreWidth = this.defaultTyreWidth;
  private tyreLength = this.defaultTyreLength;
  private rotation = this.defaultRotation;
  private steeringWheelAnglePercentage = this
    .defaultSteeringWheelAnglePercentage;
  private speed = this.defaultSpeed;

  /* Set by the constructor */
  private stage: createjs.Stage;
  private canvasH: number;
  private scale: number;

  /* Needed across methods */
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

  private get length(): number {
    return this.rearOverhang + this.wheelbase + this.frontOverhang;
  }

  private get width(): number {
    return this.wheelToWheelWidth + 2 * this.sideOverhang;
  }

  private get rearAxleToFront(): number {
    return this.wheelbase + this.frontOverhang;
  }

  private get referencePoint() {
    return {
      x: this.frontDCornerFromLeft,
      y: this.canvasH - this.frontDCornerFromBottom,
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
   * The turning angle based on the steering wheel turn position.
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
   * wheelbaseTurnCentre is the distance from the turn centre to the far side of the car opposite the wheelbase.  It runs through the rear axle.
   */
  private get wheelbaseTurnCentre(): number {
    return Math.sqrt(
      Math.pow(this.turningRadius, 2) - Math.pow(this.rearAxleToFront, 2),
    );
  }

  private get frontDTyreAngle(): number {
    return (
      (Math.atan(
        this.wheelbase / (this.wheelbaseTurnCentre - this.defaultSideOverhang),
      ) *
        180) /
      Math.PI
    );
  }

  private get frontPTyreAngle(): number {
    return (
      (Math.atan(
        this.wheelbase /
          (this.wheelbaseTurnCentre -
            this.wheelToWheelWidth -
            this.defaultSideOverhang),
      ) *
        180) /
      Math.PI
    );
  }

  private get centerOfRotation() {
    const angleA =
      (Math.acos(this.rearAxleToFront / this.turningRadius) * 180) / Math.PI;
    const angleB = angleA - this.rotation;
    const offsetX = this.turningRadius * Math.cos((angleB * Math.PI) / 180);
    const offsetY = this.turningRadius * Math.sin((angleB * Math.PI) / 180);
    return {
      x: this.referencePoint.x - offsetX,
      y: this.referencePoint.y - offsetY,
    };
  }

  /**
   * Creates a new car on the canvas.
   * It removes a previously created car if there is one.
   * The car will be sized and positioned based on supplied parameters.
   * The car will be stationery on creation.
   *
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
  create(
    rearOverhang = this.defaultRearOverhang * this.scale,
    wheelbase = this.defaultWheelBase * this.scale,
    frontOverhang = this.defaultFrontOverhang * this.scale,
    wheelToWheelWidth = this.defaultWheelToWheelWidth * this.scale,
    sideOverhang = this.defaultSideOverhang * this.scale,
    tyreWidth = this.defaultTyreWidth * this.scale,
    tyreLength = this.defaultTyreLength * this.scale,
    minTurningRadius = this.defaultMinTurningRadius * this.scale,
    frontDCornerFromLeft = this.defaultFrontDCornerFromLeft * this.scale,
    frontDCornerFromBottom = this.defaultFrontDCornerFromBottom * this.scale,
    rotation = this.defaultRotation,
    steeringWheelAnglePercentage = this.defaultSteeringWheelAnglePercentage,
    speed = this.defaultSpeed * this.scale,
  ) {
    /* Car size input parameters */
    this.rearOverhang = Math.round(rearOverhang / this.scale);
    this.wheelbase = Math.round(wheelbase / this.scale);
    this.frontOverhang = Math.round(frontOverhang / this.scale);
    this.wheelToWheelWidth = Math.round(wheelToWheelWidth / this.scale);
    this.sideOverhang = Math.round(sideOverhang / this.scale);
    this.tyreWidth = Math.round(tyreWidth / this.scale);
    this.tyreLength = Math.round(tyreLength / this.scale);
    this.minTurningRadius = Math.round(minTurningRadius / this.scale);
    this.frontDCornerFromLeft = Math.round(frontDCornerFromLeft / this.scale);
    this.frontDCornerFromBottom = Math.round(
      frontDCornerFromBottom / this.scale,
    );
    this.rotation = rotation;
    /* Limit input steeringwheel angle percentage to -100 to +100 */
    this.steeringWheelAnglePercentage =
      steeringWheelAnglePercentage >= 0
        ? Math.min(steeringWheelAnglePercentage, +100)
        : Math.max(steeringWheelAnglePercentage, -100);
    this.speed = Math.round(speed / this.scale);

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

    this.stage.addChild(this.carContainer);

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
    const tickMoveX =
      Math.sign(deltaPosition) *
      this.speed *
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
    this.steeringWheelAnglePercentage = steeringWheelTurnPercentage;
    /* Set wheels per steering wheel angle */
    this.frontDTyre.rotation = -this.frontDTyreAngle;
    this.frontPTyre.rotation = -this.frontPTyreAngle;
    /* Create a tick very 10ms */
    const FPS = 100;
    createjs.Ticker.framerate = FPS;
    /* Calculate the angle turned moved in 1 tick */
    const tickTime = 1 / FPS;
    const tickMove = Math.sign(deltaAngle) * this.speed * tickTime;
    const tickAngle = (tickMove / this.turningRadius) * (180 / Math.PI);
    /* Capture the current angle */
    const startAngle = this.carContainer.rotation;

    /* Add the front driver's corner turning circle for debug */
    const circle = new createjs.Shape();
    circle.set({ x: this.centerOfRotation.x, y: this.centerOfRotation.y });
    circle.graphics
      .endFill()
      .beginStroke('Black')
      .drawCircle(0, 0, this.turningRadius);
    this.stage.addChild(circle);

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
