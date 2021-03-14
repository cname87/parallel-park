import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import { TPoint, TStreetSetup } from '../shared/types';
import { ConfigService } from './config.service';

/**
 * Defines the street in the canvas.
 */

@Injectable({
  providedIn: 'root',
})
export class StreetService {
  //
  /* Car positioning variables */
  public rearCarLength: number;
  public rearCarWidth: number;
  public rearCarFromLeft: number;
  public frontCarLength: number;
  public frontCarWidth: number;
  public carFromKerb: number;
  public safetyGap: number;
  public wheelLength: number;
  public wheelWidth: number;

  /* Set and get the parking space length */
  public parkingSpaceLength: number;

  /* Calculated */
  public parkingSpaceFromLeft = 0;
  public frontCarFromLeft = 0;
  public rearCarFromTop = 0;
  public frontCarFromTop = 0;

  /* Get outer corners for collision detection */
  public get rearCarCorner(): TPoint {
    return {
      x: this.rearCarFromLeft + this.rearCarLength,
      y: this.rearCarFromTop + this.rearCarWidth,
    };
  }
  public get frontCarCorner(): TPoint {
    return {
      x: this.frontCarFromLeft,
      y: this.frontCarFromTop + this.frontCarWidth,
    };
  }

  constructor(private config: ConfigService) {
    this.rearCarLength = this.config.defaultRearCarLength;
    this.rearCarWidth = this.config.defaultRearCarWidth;
    this.rearCarFromLeft = this.config.defaultRearCarFromLeft;
    this.frontCarLength = this.config.defaultFrontCarLength;
    this.frontCarWidth = this.config.defaultFrontCarWidth;
    this.carFromKerb = this.config.defaultCarFromKerb;
    this.safetyGap = this.config.defaultSafetyGap;
    this.parkingSpaceLength = this.config.defaultParkingSpaceLength;
    this.wheelLength = this.config.defaultWheelLength;
    this.wheelWidth = this.config.defaultWheelWidth;
    /* Calculated */
    this.parkingSpaceFromLeft = this.rearCarFromLeft + this.rearCarLength;
    this.frontCarFromLeft = this.parkingSpaceFromLeft + this.parkingSpaceLength;
    this.rearCarFromTop = this.carFromKerb;
    this.frontCarFromTop = this.carFromKerb;
  }

  /*  Export car shapes for collision detection */
  public rearCarGap = new createjs.Shape();
  public frontCarGap = new createjs.Shape();

  public update({
    rearCarWidth,
    frontCarWidth,
    carFromKerb,
    safetyGap,
    parkingSpace,
  }: Omit<TStreetSetup, 'name'>): void {
    /* External updates are unscaled */
    this.rearCarWidth = rearCarWidth / this.config.distScale;
    this.frontCarWidth = frontCarWidth / this.config.distScale;
    this.carFromKerb = carFromKerb / this.config.distScale;
    this.safetyGap = safetyGap / this.config.distScale;
    /* This may be overwritten. */
    this.parkingSpaceLength = parkingSpace / this.config.distScale;
  }

  /* Draw the street based on a provided parking space length */
  public drawStreet({
    parkingSpaceLength,
  }: {
    parkingSpaceLength: number;
  }): void {
    /* Update parking space length with calculated length */
    this.parkingSpaceLength = parkingSpaceLength;
    /* Repeat all calculated properties */
    this.parkingSpaceFromLeft = this.rearCarFromLeft + this.rearCarLength;
    this.frontCarFromLeft = this.parkingSpaceFromLeft + this.parkingSpaceLength;
    this.rearCarFromTop = this.carFromKerb;
    this.frontCarFromTop = this.carFromKerb;

    /* Create the rear car the safetey gap shape */
    this.rearCarGap.set({ regX: 0, regY: 0 });
    this.rearCarGap.set({ x: 0, y: 0 });
    this.rearCarGap.alpha = 0.5;
    this.rearCarGap.graphics
      .beginFill('Pink')
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
    this.config.stage.addChild(this.rearCarGap);

    /* Create the rear car shape */
    const rearCar = new createjs.Shape();
    rearCar.set({ regX: 0, regY: 0 });
    rearCar.set({ x: 0, y: 0 });
    rearCar.graphics.beginFill('LightSalmon').endStroke().rect(
      /**
       * Sets the co-ordinates of the top left hand corner of the Graphic based on the Shape position as determined above.
       */
      this.rearCarFromLeft,
      this.rearCarFromTop,
      this.rearCarLength,
      this.rearCarWidth,
    );
    rearCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-20, this.rearCarFromTop)
      .lineTo(
        this.rearCarFromLeft + this.rearCarLength,
        this.rearCarFromTop + this.rearCarWidth / 2,
      );
    rearCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(-20, this.rearCarFromTop + this.rearCarWidth)
      .lineTo(
        this.rearCarFromLeft + this.rearCarLength,
        this.rearCarFromTop + this.rearCarWidth / 2,
      );
    rearCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(this.rearCarFromLeft, this.rearCarFromTop + this.rearCarWidth / 2)
      .lineTo(
        this.rearCarFromLeft + this.rearCarLength,
        this.rearCarFromTop + this.rearCarWidth / 2,
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
      .beginStroke('Black')
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
    this.frontCarGap.graphics
      .beginFill('Pink')
      .endStroke()
      .drawRoundRect(
        this.frontCarFromLeft - this.safetyGap + 0.5,
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
    this.config.stage.addChild(this.frontCarGap);

    /* Create the front car shape */
    const frontCar = new createjs.Shape();
    frontCar.set({ regX: 0, regY: 0 });
    frontCar.set({ x: 0, y: 0 });
    frontCar.graphics
      .beginFill('LightSalmon')
      .endStroke()
      .rect(
        this.frontCarFromLeft,
        this.frontCarFromTop,
        this.frontCarLength,
        this.frontCarWidth,
      );
    /* Draw the front V */
    frontCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.frontCarFromLeft + this.frontCarLength / 2,
        this.frontCarFromTop,
      )
      .lineTo(
        this.frontCarFromLeft + this.frontCarLength,
        this.frontCarFromTop + this.frontCarWidth / 2,
      );
    frontCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.frontCarFromLeft + this.frontCarLength / 2,
        this.frontCarFromTop + this.frontCarWidth,
      )
      .lineTo(
        this.frontCarFromLeft + this.frontCarLength,
        this.frontCarFromTop + this.frontCarWidth / 2,
      );
    frontCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.frontCarFromLeft,
        this.frontCarFromTop + this.frontCarWidth / 2,
      )
      .lineTo(
        this.frontCarFromLeft + this.frontCarLength,
        this.frontCarFromTop + this.frontCarWidth / 2,
      );
    /* Draw the rear axle */
    frontCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.frontCarFromLeft + (1.5 * this.frontCarLength) / 8,
        this.frontCarFromTop,
      )
      .lineTo(
        this.frontCarFromLeft + (1.5 * this.frontCarLength) / 8,
        this.frontCarFromTop + this.frontCarWidth,
      );
    /* Draw the front axle */
    frontCar.graphics
      .beginStroke('Black')
      .setStrokeStyle(0.5)
      .moveTo(
        this.frontCarFromLeft + (6 * this.frontCarLength) / 8,
        this.frontCarFromTop,
      )
      .lineTo(
        this.frontCarFromLeft + (6 * this.frontCarLength) / 8,
        this.frontCarFromTop + this.frontCarWidth,
      );
    /* Draw the front port wheel */
    frontCar.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        this.frontCarFromLeft +
          (6 * this.frontCarLength) / 8 +
          this.wheelLength / 2,
        this.frontCarFromTop + 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );
    /* Draw the front starboard wheel */
    frontCar.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        this.frontCarFromLeft +
          (6 * this.frontCarLength) / 8 +
          this.wheelLength / 2,
        this.frontCarFromTop + this.frontCarWidth - this.wheelWidth - 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );
    /* Dear the rear port wheel */
    frontCar.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        this.frontCarFromLeft +
          (1.5 * this.frontCarLength) / 8 +
          this.wheelLength / 2,
        this.frontCarFromTop + 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );
    /* Draw the rear starboard wheel */
    frontCar.graphics
      .beginFill('Black')
      .setStrokeStyle(0)
      .rect(
        this.frontCarFromLeft +
          (1.5 * this.frontCarLength) / 8 +
          this.wheelLength / 2,
        this.frontCarFromTop + this.frontCarWidth - this.wheelWidth - 1.5,
        -this.wheelLength,
        this.wheelWidth,
      );
    frontCar.cache(
      this.frontCarFromLeft,
      this.frontCarFromTop,
      this.frontCarLength,
      this.frontCarWidth,
    );
    this.config.stage.addChild(frontCar);

    /* Add a separate uncached border so its not smudged */
    const frontCarBorder = new createjs.Shape();
    frontCarBorder.set({ regX: 0, regY: 0 });
    frontCarBorder.set({ x: 0, y: 0 });
    frontCarBorder.graphics
      .endFill()
      .beginStroke('Black')
      .rect(
        this.frontCarFromLeft,
        this.frontCarFromTop,
        this.frontCarLength,
        this.frontCarWidth,
      );
    this.config.stage.addChild(frontCarBorder);
  }
}
