import { Component, AfterViewInit } from '@angular/core';
import * as createjs from 'createjs-module';
import { ConfigService } from './services/config.service';
import { CarService } from './services/car.service';
import { Grid } from './grid';
import { Street } from './street';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  constructor(private config: ConfigService, private car: CarService) {}

  /**
   * Design:
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
    const stage = this.config.stage;

    /* Print the grid */
    new Grid(stage, this.config.gridScale);

    /* Print the street layout */
    const street = new Street({ stage, scale: this.config.distScale });
    street.createStreet();

    /**
     * Move car
     */
    this.car.create({});

    (async () => {
      await this.car.moveLinear({
        fwdOrReverse: -1,
        deltaPosition: 1000,
      });
      await this.car.moveAngle({
        fwdOrReverse: 'reverse',
        deltaAngle: 360,
        steeringWheelTurnPercentage: +100,
      });
    })();
  }
}
