import { Component, AfterViewInit } from '@angular/core';
import * as createjs from 'createjs-module';
import { Grid } from './grid';
import { Street } from './street';
import { Car } from './car';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  /**Canvas Dimensions:
   * Set width to 800 pixels and height to 400 pixels.
   * We want the canvas width to represent 16m actual distance so therefore each pixel represents 16000 / 800 = 20mm.
   * Because distances are input in mm, and each pixel equals 20mm, the factor to scale input distances in mm to pixels is 20.
   * Also print a grid with a grid scale of 5, i.e. each small grid box represents 5 pixels x 5 pixels, or 0.1m x 0,1.m, and each large grid box, which is 10 x 10 small boxes, represents 1m x 1m.

   */
  public canvasW = '800';
  public canvasH = '400';
  private distScale = 20;
  private gridScale = 5;

  /**
   * Design:
   *
   *
   * It shows the canvas with the street set up with default parameters
   * When the user presses the Load button it loads the Table data and redraws the canvas
   * When the user presses the Move button it draws the moving car.
   *
   * Proto 1
   * Set up the default street
   * Set up a move
   */

  ngAfterViewInit() {
    /* Create canvas - dimensions read from above */
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const stage = new createjs.Stage(canvas);

    /* Print the grid */
    new Grid(stage, this.gridScale);

    /* Print the street layout */
    const street = new Street({ stage, scale: this.distScale });
    street.createStreet();

    /**
     * Move car
     */

    const car = new Car({ stage, scale: this.distScale });
    car.create();
    // car.moveLinear(2000);
    car.moveAngle(-360, -100);
  }
}
