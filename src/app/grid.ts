import * as createjs from 'createjs-module';

export class Grid {
  /**
   * This prints a grid on the passed-in canvas where each box is equivalent to the number of pixels divided by the scale.
   * @param scale The number of pixels per box
   * @param stage The createjs stage
   */

  /** TODO Add numbers across the top and sides */

  constructor(stage: createjs.Stage, scale = 5) {
    const canvasW = (stage.canvas as HTMLCanvasElement).width;
    const canvasH = (stage.canvas as HTMLCanvasElement).height;

    // Set up grid
    const gridContainer = new createjs.Container();

    const border = new createjs.Shape();
    border.graphics
      .endFill()
      .beginStroke('Black')
      .setStrokeStyle(1)
      .rect(0, 0, canvasW, canvasH);
    gridContainer.addChild(border);

    const line = new createjs.Shape();
    for (let y = 0; y <= canvasH; y += scale) {
      let strokeT = 0.5;
      if (y % (10 * scale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(-0.5, y - 0.5) // 0.5 there to snap to pixel
        .lineTo(canvasW + 0.5, y - 0.5);
      gridContainer.addChild(line);
    }

    for (let x = 0; x <= canvasW; x += scale) {
      let strokeT = 0.5;
      if (x % (10 * scale) === 0) {
        strokeT = 1;
      }
      line.graphics
        .beginStroke('Grey')
        .setStrokeStyle(strokeT)
        .moveTo(x - 0.5, -0.5) // 0.5 there to snap to pixel
        .lineTo(x - 0.5, canvasH + 0.5);
      gridContainer.addChild(line);
    }

    gridContainer.cache(0, 0, canvasW, canvasH);
    stage.addChild(gridContainer);
    stage.update();
  }
}
