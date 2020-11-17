export class Car {
  /**
   * All distances in millimeters
   * All angles in degrees
   * The reference x-axis is the top of the canvas with the positive direction to the right
   * The reference y-axis is the left side of the canvas with the positive direction to the bottom
   * NOTE y-axis +ve direction is down NOT up
   * Angles are measured counter-clockwise from the x-axis
   * The center of the car is the point midway between both front and back and midmay between the 2 sides
   */

  private rearOverhang: number;
  private wheelBase: number;
  private frontOverhang: number;
  private wheelToWheelWidth: number;
  private sideOverhang: number;
  private turningCircle: number;
  centerPositionX: number;
  centerPositionY: number;
  rotation: number;
  steeringWheelAngle: number;
  speed: number;

  constructor(
    rearOverhang = 996, // Distance from rear axle to rear bumper
    wheelBase = 3400, // Distance from front axle to rear axle
    frontOverhang = 894, // Distance from front axle to front bumper
    wheelToWheelWidth = 1628, // Distance from centre wheel to centre wheel on the same axis
    sideOverhang = 138, // Distance from centre wheel to side wall (not including mirrors)
    turningCircle = 6600, // Circle formed by front outside corner when steering wheel at maximum turn
    centerPositionX = 0, // Distance from the center of the car to the reference y axis
    centerPositionY = 1904, // Distance from the center of the car to the reference x axis
    rotation = 0, // The angle formed by a line lengthwise through the car and the x-axis
    steeringWheelAngle = 0, // The turn of the steering wheel from -100 (max CCW) to 100 (max CW)
    speed = 0, // Speed in meters per second
  ) {
    this.rearOverhang = rearOverhang;
    this.wheelBase = wheelBase;
    this.frontOverhang = frontOverhang;
    this.wheelToWheelWidth = wheelToWheelWidth;
    this.sideOverhang = sideOverhang;
    this.turningCircle = turningCircle;
    this.centerPositionX = centerPositionX;
    this.centerPositionY = centerPositionY;
    this.rotation = rotation;
    this.steeringWheelAngle = steeringWheelAngle;
    this.speed = speed;
  }

  public get length(): number {
    return this.rearOverhang + this.wheelBase + this.frontOverhang;
  }

  public get width(): number {
    return this.wheelToWheelWidth + 2 * this.sideOverhang;
  }

  public get turnCentre(): number {
    return (
      Math.sqrt(
        Math.pow(this.turningCircle, 2) -
          Math.pow(this.rearOverhang + this.wheelBase, 2),
      ) -
      this.width / 2
    );
  }

  /* This returns the change in the position of the center of the car, when driven for time t, as x and y values
   */
  calcDeltaPositionXY(
    time = 0.001, // movement time in seconds, defaults to 1ms
  ) {
    return {
      x: 0.8,
      y: 0.2,
    };
  }

  calcDeltaCarAngle(
    time = 0.001, // movement time in seconds, defaults to 1ms
  ) {
    return -10;
  }
}
