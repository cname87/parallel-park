import * as createjs from 'createjs-module';

export class Street {
  private stage: createjs.Stage;
  private canvasH: number;
  private scale: number;
  private rearCarLength: number;
  private rearCarWidth: number;
  private rearCarFromLeft: number;
  private rearCarFromKerb: number;
  private _parkingSpaceLength: number;
  public get parkingSpaceLength(): number {
    return this._parkingSpaceLength;
  }
  /**
   * Sets the length of the car parking space in mm.
   * @param length: The unscaled length of the car parkingspace in mm.
   */
  public set parkingSpaceLength(value: number) {
    this._parkingSpaceLength = value;
  }
  private frontCarLength: number;
  private frontCarWidth: number;
  private frontCarFromKerb: number;
  private safetyGap: number;

  constructor({
    stage,
    scale = 20,
    rearCarLength = 1000,
    rearCarWidth = 1904,
    rearCarFromLeft = 0,
    rearCarFromKerb = 200,
    parkingSpaceLength = 7310,
    frontCarLength = 5290,
    frontCarWidth = 1904,
    frontCarFromKerb = 200,
    safetyGap = 250,
  }: {
    stage: createjs.Stage;
    scale?: number;
    rearCarLength?: number;
    rearCarWidth?: number;
    rearCarFromLeft?: number;
    rearCarFromKerb?: number;
    parkingSpaceLength?: number;
    frontCarLength?: number;
    frontCarWidth?: number;
    frontCarFromKerb?: number;
    safetyGap?: number;
  }) {
    this.stage = stage;
    this.canvasH = (stage.canvas as HTMLCanvasElement).height;
    this.scale = scale;
    this.rearCarLength = rearCarLength;
    this.rearCarWidth = rearCarWidth;
    this.rearCarFromLeft = rearCarFromLeft;
    this.rearCarFromKerb = rearCarFromKerb;
    this._parkingSpaceLength = parkingSpaceLength;
    this.frontCarLength = frontCarLength;
    this.frontCarWidth = frontCarWidth;
    this.frontCarFromKerb = frontCarFromKerb;
    this.safetyGap = safetyGap;
  }

  public createStreet() {
    const rearCarScaledLength = this.rearCarLength / this.scale;
    const rearCarScaledWidth = this.rearCarWidth / this.scale;
    const rearCarScaledFromLeft = this.rearCarFromLeft / this.scale;
    const rearCarScaledFromKerb = this.rearCarFromKerb / this.scale;
    const rearCarScaledFromTop =
      this.canvasH - rearCarScaledWidth - rearCarScaledFromKerb;

    const parkingSpaceScaledFromLeft =
      (this.rearCarFromLeft + this.rearCarLength) / this.scale;
    const parkingSpaceScaledLength = this.parkingSpaceLength / this.scale;
    const safetyScaledGap = this.safetyGap / this.scale;

    const frontCarScaledLength = this.frontCarLength / this.scale;
    const frontCarScaledWidth = this.frontCarWidth / this.scale;
    const frontCarScaledFromLeft =
      parkingSpaceScaledFromLeft + parkingSpaceScaledLength;
    const frontCarScaledFromKerb = this.frontCarFromKerb / this.scale;
    const frontCarScaledFromTop =
      this.canvasH - frontCarScaledWidth - frontCarScaledFromKerb;

    const rearCarGap = new createjs.Shape();
    rearCarGap.set({ regX: 0, regY: 0 });
    rearCarGap.set({ x: 0, y: 0 });
    rearCarGap.alpha = 0.5;
    rearCarGap.graphics
      .beginFill('Pink')
      .beginStroke('Grey')
      .drawRoundRect(
        rearCarScaledFromLeft - safetyScaledGap,
        rearCarScaledFromTop - safetyScaledGap,
        rearCarScaledLength + 2 * safetyScaledGap,
        rearCarScaledWidth + 2 * safetyScaledGap,
        safetyScaledGap,
      );
    rearCarGap.cache(
      rearCarScaledFromLeft,
      rearCarScaledFromTop - safetyScaledGap,
      rearCarScaledLength + 2 * safetyScaledGap,
      rearCarScaledWidth + 2 * safetyScaledGap,
    );
    this.stage.addChild(rearCarGap);

    const rearCar = new createjs.Shape();
    /**
     * Sets the origin co-ordinates of the the Shape (with x +ve right and y +ve down).  I.e. these are the co-ordinates against which the shape's x and y is translated to determine the position.
     */
    rearCar.set({ regX: 0, regY: 0 });
    /**
     * Sets the position of the top left hand corner of the Shape based on the origin co-ordinates set by regX and regY.
     * E.G.: If regX = -100 and x = 100 then the x position is 0, i.e. the position is the translation of x on regX.
     * Note: All rotations are around this point.
     */
    rearCar.set({ x: 0, y: 0 });
    rearCar.graphics.beginFill('Red').beginStroke('Black').rect(
      /**
       * Sets the co-ordinates of the top left hand corner of the Graphic based on the Shape position as determined above.
       */
      rearCarScaledFromLeft,
      rearCarScaledFromTop,
      /**
       * Can use -ve to move the position of the shape reference point (which sets the radius to the rotation point determined above) from the default top left hand corner.
       */
      rearCarScaledLength,
      rearCarScaledWidth,
    );
    rearCar.cache(
      rearCarScaledFromLeft,
      rearCarScaledFromTop,
      rearCarScaledLength,
      rearCarScaledWidth,
    );
    this.stage.addChild(rearCar);

    const frontCarGap = new createjs.Shape();
    frontCarGap.set({ regX: 0, regY: 0 });
    frontCarGap.set({ x: 0, y: 0 });
    frontCarGap.alpha = 0.5;
    frontCarGap.graphics
      .beginFill('Pink')
      .beginStroke('Grey')
      .drawRoundRect(
        frontCarScaledFromLeft - safetyScaledGap,
        frontCarScaledFromTop - safetyScaledGap,
        frontCarScaledLength + 2 * safetyScaledGap,
        frontCarScaledWidth + 2 * safetyScaledGap,
        safetyScaledGap,
      );
    frontCarGap.cache(
      frontCarScaledFromLeft - safetyScaledGap,
      frontCarScaledFromTop - safetyScaledGap,
      frontCarScaledLength + 2 * safetyScaledGap,
      frontCarScaledWidth + 2 * safetyScaledGap,
      safetyScaledGap,
    );
    this.stage.addChild(frontCarGap);

    const frontCar = new createjs.Shape();
    frontCar.set({ regX: 0, regY: 0 });
    frontCar.set({ x: 0, y: 0 });
    frontCar.graphics
      .beginFill('Red')
      .beginStroke('Black')
      .rect(
        frontCarScaledFromLeft,
        frontCarScaledFromTop,
        frontCarScaledLength,
        frontCarScaledWidth,
      );
    frontCar.cache(
      frontCarScaledFromLeft,
      frontCarScaledFromTop,
      frontCarScaledLength,
      frontCarScaledWidth,
    );
    this.stage.addChild(frontCar);

    this.stage.update();
  }
}
