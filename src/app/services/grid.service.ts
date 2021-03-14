import { Injectable } from '@angular/core';
import * as createjs from 'createjs-module';
import { ConfigService } from './config.service';

/**
 * Creates a grid on the canvas.
 */

@Injectable({
  providedIn: 'root',
})
export class GridService {
  /**
   * This prints a grid on the passed-in canvas where each box is equivalent to the number of pixels divided by the this.config.distScale.
   */

  constructor(private config: ConfigService) {}

  public createGrid(): void {
    //
    const gridContainer = new createjs.Container();

    const border = new createjs.Shape();
    border.graphics
      .endFill()
      .beginStroke('Black')
      .setStrokeStyle(1)
      .rect(0, 0, this.config.canvasW, this.config.canvasH);
    gridContainer.addChild(border);

    /* Draw the horizontal lines */
    const line = new createjs.Shape();
    for (let y = 0; y <= this.config.canvasH; y += this.config.gridScale) {
      let strokeT = 0.5;
      /* Add bolder line and text every 10 lines */
      if (y % (10 * this.config.gridScale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(-0.5, y - 0.5) // 0.5 there to snap to pixel
        .lineTo(this.config.canvasW + 0.5, y - 0.5);
      gridContainer.addChild(line);
    }

    /* Draw the vertical lines */
    for (let x = 0; x <= this.config.canvasW; x += this.config.gridScale) {
      let strokeT = 0.5;
      /* Add bolder line and text every 10 lines */
      if (x % (10 * this.config.gridScale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(x - 0.5, -0.5) // 0.5 there to snap to pixel
        .lineTo(x - 0.5, this.config.canvasH + 0.5);
      gridContainer.addChild(line);
    }

    gridContainer.cache(0, 0, this.config.canvasW, this.config.canvasH);
    this.config.stage.addChild(gridContainer);
  }

  /* The axes values are added separately so they can be added after other shapes and thus appear on top */
  public addAxesValues(): void {
    const axesContainer = new createjs.Container();

    /* Write the vertical axis values */
    for (let y = 0; y <= this.config.canvasH; y += this.config.gridScale) {
      if (y % (10 * this.config.gridScale) === 0) {
        const yNum: string =
          ((y * this.config.distScale) / 1000).toString() + ' m';
        const text = new createjs.Text(yNum, '10px Arial', 'black');
        /* y-axis position of the text is set to the value */
        text.y = y;

        // text.y =
        //   text.y === this.config.canvasH ? this.config.canvasH + 20 : text.y;
        /* Set the other values just below the upper border */

        switch (text.y) {
          case 0:
            /* Hide 0m value off the canvas */
            text.y = -20;
            break;
          case this.config.canvasH:
            /* Hide the bottommost line value off the canvas */
            text.y = -20;
            break;
          default:
            break;
        }
        /* Set the other values just to the right of the left border */
        text.x = 2;
        text.textBaseline = 'middle';
        axesContainer.addChild(text);
      }
    }

    /* Write the horizontal axis values */
    for (let x = 0; x <= this.config.canvasW; x += this.config.gridScale) {
      if (x % (10 * this.config.gridScale) === 0) {
        const xNum: string =
          ((x * this.config.distScale) / 1000).toString() + ' m';
        const text = new createjs.Text(xNum, '10px Arial', 'black');
        /* x-axis position of the text is set to the value */
        text.x = x;
        /* Set exceptions to the x-axis positioning */
        switch (text.x) {
          case 0:
            /* Shift 0m out slightly from left*/
            text.x = 10;
            break;
          case this.config.canvasW:
            /* Hide the rightmost line value off the canvas */
            text.x = -20;
            break;
          default:
            break;
        }
        /* Set the other values just below the upper border */
        text.y = 2;
        text.textAlign = 'center';
        axesContainer.addChild(text);
      }
      axesContainer.cache(0, 0, this.config.canvasW, this.config.canvasH);
      this.config.stage.addChild(axesContainer);
    }
  }
}
