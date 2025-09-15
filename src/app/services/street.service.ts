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
    if (this.type === 'parallel') {
      return {
        x: this.frontCarFromLeft,
        y: this.frontCarFromTop + this.frontCarWidth,
      };
    } else if (this.type === 'bay') {
      return {
        x: this.frontCarFromLeft + this.frontCarLength,
        y: this.frontCarFromTop,
      };
    }
    throw new Error('Invalid street type');
  }
  constructor(
    private config: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.log('StreetService initialized', LoggingLevel.TRACE);

    this.type = this.config.defaultStreetType;
    /* Note: Default values are in unscaled units */
    this.rearCarFromTop = this.config.defaultRearCarFromTop;
    this.rearCarLength = this.config.defaultRearCarLength;
    this.rearCarWidth = this.config.defaultRearCarWidth;
    this.rearCarFromLeft = this.config.defaultRearCarFromLeft;
    this.frontCarFromLeft = this.config.defaultFrontCarFromLeft;
    this.frontCarFromTop = this.config.defaultFrontCarFromTop;
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

  /**
   * Sets the street configuration from a scenario street setup. All scenario distances are real-world distances in mm and are scaled by a factor to convert mm to pixels before being stored.
   * @param param0 - A scenario street configuration
   */
  public setStreetFromScenario({
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
    this.logger.log('setStreetFromScenario called', LoggingLevel.TRACE);

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
   * Updates the street configuration .
   * @param param0 - A scenario street configuration
   */
  public updateStreetParkingSpace(parkingSpaceLength: number): void {
    this.logger.log('updateStreetParkingSpace called', LoggingLevel.TRACE);

    this.parkingSpaceLength = parkingSpaceLength;
    if (this.type === 'parallel') {
      this.frontCarFromLeft =
        this.rearCarFromLeft + this.rearCarLength + this.parkingSpaceLength;
    } else if (this.type === 'bay') {
      this.frontCarFromTop =
        this.rearCarFromTop + this.rearCarWidth + this.parkingSpaceLength;
    }
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
    this.logger.log('drawCarInternals', LoggingLevel.TRACE);

    const minCarLengthForTwoAxles = 50;

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

    if (carLength > minCarLengthForTwoAxles) {
      /* Draw the rear axle */
      carShape.graphics
        .beginStroke(this.internalCarColor)
        .setStrokeStyle(0.5)
        .moveTo(carLeft + (1.5 * carLength) / 8, carTop)
        .lineTo(carLeft + (1.5 * carLength) / 8, carTop + carWidth);

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
  }

  /**
   * Private helper method to draw car internal details (axles, wheels, V-pattern)
   * @param shape - The CreateJS Shape to draw on
   * @param carLeft - X position of car
   * @param carTop - Y position of car
   * @param carLength - Length of car
   * @param carWidth - Width of car
   * @param carType - Type of car ('rear' or 'front') to determine drawing pattern
   */
  private drawSafetyGaps(
    shape: createjs.Shape,
    carLeft: number,
    carTop: number,
    carLength: number,
    carWidth: number,
  ): createjs.Shape {
    this.logger.log('drawSafetyGaps', LoggingLevel.TRACE);

    /* Create the front car safetey gap shape */
    shape.set({ regX: 0, regY: 0 });
    shape.set({ x: 0, y: 0 });
    shape.alpha = 0.5;

    shape.graphics
      .beginFill(this.safetyGapColor)
      .endStroke()
      .drawRoundRect(
        carLeft - this.safetyGap,
        carTop - this.safetyGap,
        carLength + 2 * this.safetyGap,
        carWidth + 2 * this.safetyGap,
        this.safetyGap,
      );
    shape.cache(
      carLeft - this.safetyGap,
      carTop - this.safetyGap,
      carLength + 2 * this.safetyGap,
      carWidth + 2 * this.safetyGap,
      this.safetyGap,
    );
    return shape;
  }

  /**
   * Private helper method to draw a car with its internals and border
   * @param carLeft - X position of car
   * @param carTop - Y position of car
   * @param carLength - Length of car
   * @param carWidth - Width of car
   * @param carType - Type of car ('rear' or 'front') to create appropriate safety gap
   */
  private drawCar(
    carLeft: number,
    carTop: number,
    carLength: number,
    carWidth: number,
    carType: 'rear' | 'front',
  ): void {
    this.logger.log('drawCar', LoggingLevel.TRACE);

    /* Draw safety gap first (behind the car) so only outer edges show */
    if (carType === 'front') {
      this.frontCarGap = this.drawSafetyGaps(
        this.frontCarGap,
        carLeft,
        carTop,
        carLength,
        carWidth,
      );
      this.config.stage.addChild(this.frontCarGap);
    } else if (carType === 'rear') {
      this.rearCarGap = this.drawSafetyGaps(
        this.rearCarGap,
        carLeft,
        carTop,
        carLength,
        carWidth,
      );
      this.config.stage.addChild(this.rearCarGap);
    }

    /* Create the car shape on top of the safety gap */
    const car = new createjs.Shape();
    car.set({ regX: 0, regY: 0 });
    car.set({ x: 0, y: 0 });

    car.graphics.beginFill(this.carColor).endStroke().rect(
      /* Sets the co-ordinates of the top left hand corner of the Graphic based on the Shape position as determined above. */
      carLeft,
      carTop,
      carLength,
      carWidth,
    );

    this.drawCarInternals(car, carLeft, carTop, carLength, carWidth);
    car.cache(carLeft, carTop, carLength, carWidth);
    this.config.stage.addChild(car);

    /* Add a separate uncached border so its not smudged */
    const carBorder = new createjs.Shape();
    carBorder.set({ regX: 0, regY: 0 });
    carBorder.set({ x: 0, y: 0 });
    carBorder.graphics
      .endFill()
      .beginStroke(this.borderColor)
      .rect(carLeft, carTop, carLength, carWidth);
    this.config.stage.addChild(carBorder);
  }

  /**
   * Draw the street based on a provided parking space length
   * @param type - Type of parking ('parallel' or 'bay')
   * @param parkingSpaceLength - Length of the parking space
   */
  public drawStreet(): void {
    this.logger.log('drawStreet', LoggingLevel.TRACE);

    /* Draw the rear car */
    this.drawCar(
      this.rearCarFromLeft,
      this.rearCarFromTop,
      this.rearCarLength,
      this.rearCarWidth,
      'rear',
    );

    /* Draw the front car */
    this.drawCar(
      this.frontCarFromLeft,
      this.frontCarFromTop,
      this.frontCarLength,
      this.frontCarWidth,
      'front',
    );
  }
}
