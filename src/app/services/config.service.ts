import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as createjs from 'createjs-module';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  /**Canvas Dimensions are set in index.html:
   * Set width to 800 pixels and height to 400 pixels.
   * We want the canvas width to represent 16m actual distance so therefore each pixel represents 16000 / 800 = 20mm.
   * Because distances are input in mm, and each pixel equals 20mm, the factor to scale input distances in mm to pixels is 20.
   * Also print a grid with a grid scale of 5, i.e. each small grid box represents 5 pixels x 5 pixels, or 0.1m x 0,1.m, and each large grid box, which is 10 x 10 small boxes, represents 1m x 1m.
   * Run all animations at 100 frames per minute.
   */
  public canvas: HTMLCanvasElement;
  public stage: createjs.Stage;
  public canvasH: number;
  public canvasW: number;
  public distScale = 20;
  public gridScale = 5;
  public FPS = 100;

  /* All street and car defaults */
  public defaultRearOverhang = Math.round(994 / 20);
  public defaultWheelBase = Math.round(3400 / 20);
  public defaultFrontOverhang = Math.round(894 / 20);
  public defaultWheelToWheelWidth = Math.round(1628 / 20);
  public defaultSideOverhang = Math.round(138 / 20);
  public defaultTyreWidth = Math.round(215 / 20);
  public defaultTyreLength = Math.round(540 / 20);
  public defaultMinTurningRadius = Math.round(6600 / 20);
  public defaultFrontDCornerFromLeft = Math.round(
    (1000 + 250 + 8000 + 994 + 3400 + 894) / 20,
  );
  public defaultFrontDCornerFromBottom = Math.round(
    (1628 + 2 * (138 + 200)) / 20,
  );
  public defaultRotation = 0;
  public defaultSteeringWheelAnglePercentage = 100;
  public defaultSpeed = Math.round(1000 / 20);

  constructor(@Inject(DOCUMENT) private document: Document) {
    /* Read canvas from index.html */
    this.canvas = this.document.getElementById('canvas') as HTMLCanvasElement;
    this.stage = new createjs.Stage(this.canvas);
    this.canvasH = this.canvas.height;
    this.canvasW = this.canvas.width;
  }
}
