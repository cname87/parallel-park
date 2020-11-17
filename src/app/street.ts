export class Street {
  stageW: number;
  stageH: number;
  scale: number;
  private rearCarLength: number;
  private rearCarWidth: number;
  private rearCarFromLeft: number;
  private rearCarFromBottom: number;

  // parkingSpaceLength = carLength + (1750 / scale);
  // const parkingSpaceFromLeft = rearCarFromLeft + rearCarLength;

  // const frontCarLength = 5400 / scale;
  // const frontCarFromLeft = parkingSpaceFromLeft + parkingSpaceLength;
  // const frontCarWidth = 1904 / scale;

  // const carFromBackOfFrontCar = 200 / scale;
  // const carFromLeft = frontCarFromLeft + carFromBackOfFrontCar;
  // const carFromSideOfFrontCar = 300 / scale;
  // // const carFromKerb = frontCarWidth + carFromSideOfFrontCar;
  // const carFromKerb = 0;



  constructor(
    stageW = 1200,
    stageH = 800,
    scale = 20, // Scales distance in millimeters to pixels on the canvas
    rearCarLength = 1000,
    rearCarWidth = 1904,
    rearCarFromLeft = 0,
    rearCarFromBottom = 0,
  ) {
    this.stageW = stageW;
    this.stageH = stageH;
    this.scale = scale;
    this.rearCarLength = rearCarLength;
    this.rearCarWidth = rearCarWidth;
    this.rearCarFromLeft = rearCarFromLeft;
    this.rearCarFromBottom = rearCarFromBottom;
  }


  public get rearCarScaledLength() : number {
    return this.rearCarLength / this.scale;
  }

  public get rearCarScaledWidth() : number {
    return this.rearCarWidth / this.scale;
  }

  public get x() : number {
    return this.rearCarFromLeft / this.scale;
  }

  public get y() : number {
    const rearCarScaledFromBottom = this.rearCarFromBottom / this.scale;
    const distScaledFromTop
      = this.stageH - this.rearCarScaledWidth - rearCarScaledFromBottom;
    return (distScaledFromTop);
  }

}
