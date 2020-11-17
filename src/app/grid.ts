import * as createjs from 'createjs-module';

export class Grid {
  /**
   * This prints a grid on the passed-in canvas where each box is equivalent to the number of pixels divided by the scale.
   * @param scale The number of pixels per box
   * @param canvas The canvas upon which to draw the grid
   * @param stage The createjs stage
   */

  /** TODO Add numbers across the top and sides */

  constructor(scale = 5, canvas: HTMLCanvasElement, stage: createjs.Stage) {
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Set up grid
    const line = new createjs.Shape();
    for (let y = 0; y <= canvasH; y += scale) {
      let strokeT = 0.5;
      if (y % (10 * scale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(0, y)
        .lineTo(canvasW, y);
      line.cache(0, 0, canvasW, canvasH);
      stage.addChild(line);
    }

    for (let x = 0; x <= canvasW; x += scale) {
      let strokeT = 0.5;
      if (x % (10 * scale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(x, 0)
        .lineTo(x, canvasH);
      line.cache(0, 0, canvasW, canvasH);
      stage.addChild(line);
    }
  }
}
