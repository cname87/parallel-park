import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import { LoggingLevel, TPoint, TStreetSetup } from '../shared/types';
import { LoggerService } from './logger.service';
import { ConfigService } from './config.service';

/**
 * Defines the street in the canvas.
 */

@Injectable({
  providedIn: 'root',
})
export class StreetService {
  //
  /* Street definition variables */
  public type: 'parallel' | 'bay';
  public rearCarFromLeft: number;
  public rearCarFromTop: number;
  public rearCarLength: number;
  public rearCarWidth: number;
  public frontCarFromLeft: number;
  public frontCarFromTop: number;
  public frontCarLength: number;
  public frontCarWidth: number;
  public parkingSpaceLength: number;
  public carFromKerb: number;
  public safetyGap: number;
  public wheelLength: number;
  public wheelWidth: number;

  /* Set the car colors */
  public carColor = 'LightSalmon';
  public internalCarColor = 'Black';
  public safetyGapColor = 'Pink';
  public borderColor = 'Black';

  /* Get outer corners on the parking space side for collision detection */
  public get rearCarCorner(): TPoint {
    return {
      x: this.rearCarFromLeft + this.rearCarLength,
      y: this.rearCarFromTop + this.rearCarWidth,
    };
  }
  public get frontCarCorner(): TPoint {
    return {
      x: this.frontCarFromLeft,
      y: this.frontCarFromTop,
    };
  }

  constructor(
    private config: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.log('StreetService initialized', LoggingLevel.TRACE);

    this.type = this.config.defaultStreetType;
    /* Note: Default values are in unscaled units */
    this.rearCarFromTop = 10; // this.config.defaultRearCarFromTop;
    this.rearCarLength = this.config.defaultRearCarLength;
    this.rearCarWidth = this.config.defaultRearCarWidth;
    this.rearCarFromLeft = this.config.defaultRearCarFromLeft;
    this.frontCarFromLeft = 10; // this.config.defaultFrontCarFromLeft;
    this.frontCarFromTop = 10; // this.config.defaultFrontCarFromTop;
    this.frontCarLength = this.config.defaultFrontCarLength;
    this.frontCarWidth = this.config.defaultFrontCarWidth;
    this.carFromKerb = this.config.defaultCarFromKerb;
    this.safetyGap = this.config.defaultSafetyGap;
    this.parkingSpaceLength = this.config.defaultParkingSpaceLength;
    this.wheelLength = this.config.defaultWheelLength;
    this.wheelWidth = this.config.defaultWheelWidth;
  }

  /*  Export car shapes for collision detection */
  public rearCarGap = new createjs.Shape();
  public frontCarGap = new createjs.Shape();

  public updateStreet({
    type,
    rearCarFromLeft,
    rearCarFromTop,
    rearCarLength,
    rearCarWidth,
    parkingSpaceLength,
    frontCarFromLeft,
    frontCarFromTop,
    frontCarLength,
    frontCarWidth,
    carFromKerb,
    safetyGap,
  }: Omit<TStreetSetup, 'name'>): void {
    this.type = type;
    /* External updates are unscaled */
    this.rearCarFromLeft = rearCarFromLeft / this.config.distScale;
    this.rearCarFromTop = rearCarFromTop / this.config.distScale;
    this.rearCarLength = rearCarLength / this.config.distScale;
    this.rearCarWidth = rearCarWidth / this.config.distScale;
    this.parkingSpaceLength = parkingSpaceLength / this.config.distScale;
    this.frontCarFromLeft = frontCarFromLeft() / this.config.distScale;
    this.frontCarFromTop = frontCarFromTop() / this.config.distScale;
    this.frontCarLength = frontCarLength / this.config.distScale;
    this.frontCarWidth = frontCarWidth / this.config.distScale;
    this.carFromKerb = carFromKerb / this.config.distScale;
    this.safetyGap = safetyGap / this.config.distScale;
  }

  /**
   * Private helper method to draw car internal details (axles, wheels, V-pattern)
   * @param carShape - The CreateJS Shape to draw on
   * @param carLeft - X position of car
   * @param carTop - Y position of car
   * @param carLength - Length of car
   * @param carWidth - Width of car
   * @param carType - Type of car ('rear' or 'front') to determine drawing pattern
   */
  private drawCarInternals(
    carShape: createjs.Shape,
    carLeft: number,
    carTop: number,
    carLength: number,
    carWidth: number,
  ): void {
    /* Draw the front V pattern */
    carShape.graphics
      .beginStroke(this.internalCarColor)
      .setStrokeStyle(0.5)
      .moveTo(carLeft + carLength / 2, carTop)
      .lineTo(carLeft + carLength, carTop + carWidth / 2);
    carShape.graphics
      .beginStroke(this.internalCarColor)
      .setStrokeStyle(0.5)
      .moveTo(carLeft + carLength / 2, carTop + carWidth)
      .lineTo(carLeft + carLength, carTop + carWidth / 2);
    carShape.graphics
      .beginStroke(this.internalCarColor)
      .setStrokeStyle(0.5)
      .moveTo(carLeft, carTop + carWidth / 2)
      .lineTo(carLeft + carLength, carTop + carWidth / 2);

    /* Draw the rear axle */
    carShape.graphics
      .beginStroke(this.internalCarColor)
      .setStrokeStyle(0.5)
      .moveTo(carLeft + (1.5 * carLength) / 8, carTop)
      .lineTo(carLeft + (1.5 * carLength) / 8, carTop + carWidth);

    /* Draw the front axle */
    carShape.graphics
      .beginStroke(this.internalCarColor)
      .setStrokeStyle(0.5)
      .moveTo(carLeft + (6 * carLength) / 8, carTop)
      .lineTo(carLeft + (6 * carLength) / 8, carTop + carWidth);

    /* Draw the front port wheel */
    carShape.graphics
      .beginFill(this.internalCarColor)
      .setStrokeStyle(0)
      .rect(
        carLeft + (6 * carLength) / 8 + this.wheelLength / 2,
        carTop + 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );

    /* Draw the front starboard wheel */
    carShape.graphics
      .beginFill(this.internalCarColor)
      .setStrokeStyle(0)
      .rect(
        carLeft + (6 * carLength) / 8 + this.wheelLength / 2,
        carTop + carWidth - this.wheelWidth - 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );

    /* Draw the rear port wheel */
    carShape.graphics
      .beginFill(this.internalCarColor)
      .setStrokeStyle(0)
      .rect(
        carLeft + (1.5 * carLength) / 8 + this.wheelLength / 2,
        carTop + 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );

    /* Draw the rear starboard wheel */
    carShape.graphics
      .beginFill(this.internalCarColor)
      .setStrokeStyle(0)
      .rect(
        carLeft + (1.5 * carLength) / 8 + this.wheelLength / 2,
        carTop + carWidth - this.wheelWidth - 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );
  }

  /* Draw the street based on a provided parking space length */
  public drawStreet({
    type,
    parkingSpaceLength,
  }: {
    type: 'parallel' | 'bay';
    parkingSpaceLength: number;
  }): void {
    /* Update parking space length with calculated length */
    this.type = type;
    this.parkingSpaceLength = parkingSpaceLength;

    /* Create the rear car safety gap shape */
    this.rearCarGap.set({ regX: 0, regY: 0 });
    this.rearCarGap.set({ x: 0, y: 0 });
    this.rearCarGap.alpha = 0.5;

    if (type === 'parallel') {
      this.rearCarGap.graphics
        .beginFill(this.safetyGapColor)
        .endStroke()
        .drawRoundRect(
          this.rearCarFromLeft - this.safetyGap,
          this.rearCarFromTop - this.safetyGap,
          this.rearCarLength + 2 * this.safetyGap,
          this.rearCarWidth + 2 * this.safetyGap,
          this.safetyGap,
        );
      this.rearCarGap.cache(
        this.rearCarFromLeft - this.safetyGap,
        this.rearCarFromTop - this.safetyGap,
        this.rearCarLength + 2 * this.safetyGap,
        this.rearCarWidth + 2 * this.safetyGap,
      );
    } else if (type === 'bay') {
      this.rearCarGap.graphics
        .beginFill(this.safetyGapColor)
        .endStroke()
        .drawRoundRect(
          this.rearCarFromLeft - this.safetyGap,
          this.rearCarFromTop - this.safetyGap,
          this.rearCarLength + 2 * this.safetyGap,
          this.rearCarWidth + 2 * this.safetyGap,
          this.safetyGap,
        );
      this.rearCarGap.cache(
        this.rearCarFromLeft - this.safetyGap,
        this.rearCarFromTop - this.safetyGap,
        this.rearCarLength + 2 * this.safetyGap,
        this.rearCarWidth + 2 * this.safetyGap,
      );
    }
    this.config.stage.addChild(this.rearCarGap);

    /* Create the rear car shape */
    const rearCar = new createjs.Shape();
    rearCar.set({ regX: 0, regY: 0 });
    rearCar.set({ x: 0, y: 0 });

    rearCar.graphics.beginFill(this.carColor).endStroke().rect(
      /**
       * Sets the co-ordinates of the top left hand corner of the Graphic based on the Shape position as determined above.
       */
      this.rearCarFromLeft,
      this.rearCarFromTop,
      this.rearCarLength,
      this.rearCarWidth,
    );

    this.drawCarInternals(
      rearCar,
      this.rearCarFromLeft,
      this.rearCarFromTop,
      this.rearCarLength,
      this.rearCarWidth,
    );

    rearCar.cache(
      this.rearCarFromLeft,
      this.rearCarFromTop,
      this.rearCarLength,
      this.rearCarWidth,
    );
    this.config.stage.addChild(rearCar);

    /* Add a separate uncached border so its not smudged */
    const rearCarBorder = new createjs.Shape();
    rearCarBorder.set({ regX: 0, regY: 0 });
    rearCarBorder.set({ x: 0, y: 0 });
    rearCarBorder.graphics
      .endFill()
      .beginStroke(this.borderColor)
      .rect(
        this.rearCarFromLeft,
        this.rearCarFromTop,
        this.rearCarLength,
        this.rearCarWidth,
      );
    this.config.stage.addChild(rearCarBorder);

    /* Create the front car safetey gap shape */
    this.frontCarGap.set({ regX: 0, regY: 0 });
    this.frontCarGap.set({ x: 0, y: 0 });
    this.frontCarGap.alpha = 0.5;

    if (type === 'parallel') {
      this.frontCarGap.graphics
        .beginFill(this.safetyGapColor)
        .endStroke()
        .drawRoundRect(
          this.frontCarFromLeft - this.safetyGap,
          this.frontCarFromTop - this.safetyGap,
          this.frontCarLength + 2 * this.safetyGap,
          this.frontCarWidth + 2 * this.safetyGap,
          this.safetyGap,
        );
      this.frontCarGap.cache(
        this.frontCarFromLeft - this.safetyGap,
        this.frontCarFromTop - this.safetyGap,
        this.frontCarLength + 2 * this.safetyGap,
        this.frontCarWidth + 2 * this.safetyGap,
        this.safetyGap,
      );
    } else if (type === 'bay') {
      this.frontCarGap.graphics
        .beginFill(this.safetyGapColor)
        .endStroke()
        .drawRoundRect(
          this.rearCarFromLeft - this.safetyGap,
          this.frontCarFromTop - this.safetyGap,
          this.rearCarLength + 2 * this.safetyGap,
          this.rearCarWidth + 2 * this.safetyGap,
          this.safetyGap,
        );
      this.frontCarGap.cache(
        this.rearCarFromLeft - this.safetyGap,
        this.frontCarFromTop - this.safetyGap,
        this.rearCarLength + 2 * this.safetyGap,
        this.rearCarWidth + 2 * this.safetyGap,
      );
    }
    this.config.stage.addChild(this.frontCarGap);

    /* Create the front car shape */
    const frontCar = new createjs.Shape();
    frontCar.set({ regX: 0, regY: 0 });
    frontCar.set({ x: 0, y: 0 });

    const frontCarLeft =
      type === 'bay' ? this.rearCarFromLeft : this.frontCarFromLeft;
    const frontCarTop =
      type === 'bay' ? this.frontCarFromTop : this.frontCarFromTop;
    const frontCarLength =
      type === 'bay' ? this.rearCarLength : this.frontCarLength;
    const frontCarWidth =
      type === 'bay' ? this.rearCarWidth : this.frontCarWidth;

    frontCar.graphics
      .beginFill(this.carColor)
      .endStroke()
      .rect(frontCarLeft, frontCarTop, frontCarLength, frontCarWidth);

    this.drawCarInternals(
      frontCar,
      frontCarLeft,
      frontCarTop,
      frontCarLength,
      frontCarWidth,
    );

    frontCar.cache(frontCarLeft, frontCarTop, frontCarLength, frontCarWidth);
    this.config.stage.addChild(frontCar);

    /* Add a separate uncached border so its not smudged */
    const frontCarBorder = new createjs.Shape();
    frontCarBorder.set({ regX: 0, regY: 0 });
    frontCarBorder.set({ x: 0, y: 0 });
    frontCarBorder.graphics
      .endFill()
      .beginStroke(this.borderColor)
      .rect(frontCarLeft, frontCarTop, frontCarLength, frontCarWidth);
    this.config.stage.addChild(frontCarBorder);
  }
}
