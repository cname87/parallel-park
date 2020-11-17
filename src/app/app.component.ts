import { Component, AfterViewInit } from '@angular/core';
import * as createjs from 'createjs-module';
import { CarService } from './car.service';
import { StreetService } from './street.service';
import { Grid } from './grid';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  constructor(
    private carService: CarService,
    private streetService: StreetService,
  ) {}

  /**Canvas Dimensions:
   * Set width to 800 pixels and height to 400 pixels with each pixel to represent 20cm.
   * Then print a grid with each box representing 5 pixels, ie 100cm, so each 10 box square is 1m x 1m.
   */
  protected canvasW = '800';
  protected canvasH = '400';
  private scale = 5;

  ngAfterViewInit() {
    /* Create canvas - dimensions read from above */
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const stage = new createjs.Stage(canvas);
    /* Print the grid */
    new Grid(this.scale, canvas, stage);

    const car = this.carService.getCar();
    console.log(car.length);

    const street = this.streetService.getStreet();
    console.log(`rearCarScaledLength: ${street.rearCarScaledLength}`);
    console.log(`rearCarScaledWidth: ${street.rearCarScaledWidth}`);
    console.log(street.x);
    console.log(street.y);

    const circle = new createjs.Shape();
    circle.set({ x: 100, y: 200 });
    circle.graphics.endFill().beginStroke('Black').drawCircle(0, 0, 280);
    stage.addChild(circle);

    const rearCar = new createjs.Shape();
    rearCar.set({ regX: 0, regY: 0 }); // Sets the co-ordinates of the top left corner of the canvas (with x +ve right and y +ve down)
    rearCar.set({ x: 100, y: 200 }); // Sets the co-ordinates of the top left hand corner of the Shape based on the origin co-ordinates set by regX and regY

    rearCar.graphics.beginFill('Red').beginStroke('Black').rect(
      200,
      200, // Sets the co-ordinates of the top left hand corner of the Graphic based on the Shape origin co-ordinates
      -300,
      -50,
    );
    stage.addChild(rearCar);

    stage.update();

    createjs.Ticker.framerate = 100;
    createjs.Ticker.addEventListener('tick', onTick);

    function onTick() {
      // Rotates the Graphic around the Shape origin
      rearCar.rotation = rearCar.rotation - 0.01;
      stage.update();
    }
  }
}
