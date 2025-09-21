import { Injectable } from '@angular/core';
import { TPoint, TPosition } from '../shared/types';
import { CarService } from './car.service';
import { ConfigService } from './config.service';
import { StreetService } from './street.service';
import { LoggerService } from './logger.service';

/**
 * Provides some calculation utilities.
 */

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  constructor(
    private config: ConfigService,
    private street: StreetService,
    private logger: LoggerService,
  ) {}

  /**
   * Angle Measurement
   * The angle of a line L is the angle formed with the x-axis.  Consider that line L has a first (lower) and a second (upper) point.  0 degrees is the angle formed when L lies on the x-axis with the second point to the right.  If the line L does not lie on the x-axis then let m be the intersection point.  A positive non-zero angle is measured counterclockwise from the x-axis right of m to the section of L containing the second point.  180 degrees is the angle formed when L lies on the x-axis with the second point to the left.
   * The angle of rotation of a car is the angle of a line lengthwise through the car, e.g. one of the sides.  The first (lower) point is the intersection of that line with the rear axle and the second (upper) point is the intersection of that line with the front axle.
   */

  /**
   * @param car Checks the car has not collided with the rear or front car outer corners, (that face in towards the parking space), or with the canvas edge, and it checks that none of the car corners collide with either the rear or front cars or the canvas edge
   * @returns True is a collision was detected. False if not.
   */
  public checkCollision = (car: CarService): boolean => {
    //
    let collision = false;

    /* Test for a collision between the parking car shape and the rear and front outer corners (that face into the parking space) of the parked cars using create.js functionality */
    const rearCarOuterCornerLocal = car.carShape.globalToLocal(
      this.street.rearCarOuterCorner.x,
      this.street.rearCarOuterCorner.y,
    );
    const frontCarOuterCornerLocal = car.carShape.globalToLocal(
      this.street.frontCarOuterCorner.x,
      this.street.frontCarOuterCorner.y,
    );
    if (
      car.carShape.hitTest(rearCarOuterCornerLocal.x, rearCarOuterCornerLocal.y)
    ) {
      this.logger.log(`Collision: Rear parked car outer corner collision`);
      collision = true;
    }
    if (
      car.carShape.hitTest(
        frontCarOuterCornerLocal.x,
        frontCarOuterCornerLocal.y,
      )
    ) {
      this.logger.log(`Collision: Front parked car outer corner collision`);
      collision = true;
    }

    /* Test for collision between parking car inner corners and parked car shapes */
    const parkingCarCorners: TPoint[] = [
      car.frontStarboardCorner,
      car.frontPortCorner,
      car.rearStarboardCorner,
      car.rearPortCorner,
    ];

    /* Test for a collision between the parked car shapes and the rear and front outer corners (that face into the parking space) of the parking ar using create.js functionality */
    parkingCarCorners.forEach((corner) => {
      if (this.street.rearCarShape) {
        const rearCarCornerLocal = this.street.rearCarShape.globalToLocal(
          corner.x,
          corner.y,
        );
        if (
          this.street.rearCarShape.hitTest(
            rearCarCornerLocal.x,
            rearCarCornerLocal.y,
          )
        ) {
          this.logger.log(`Collision: Parking car corner with rear parked car`);
          collision = true;
        }
      }
      if (this.street.frontCarShape) {
        const frontCarCornerLocal = this.street.frontCarShape.globalToLocal(
          corner.x,
          corner.y,
        );
        if (
          this.street.frontCarShape.hitTest(
            frontCarCornerLocal.x,
            frontCarCornerLocal.y,
          )
        ) {
          this.logger.log(`Collision: Parking car corner with front car`);
          collision = true;
        }
      }
    });

    return collision;
  };

  /**
   * This method calculates the required center of rotation to rotate the car between 2 positions.
   * The position of the car is defined by the x,y coordinates of the midpoint of the rear axle, and the rotation of the car (as defined above).
   */
  getRotationBetween2Positions(
    position1: TPosition,
    position2: TPosition,
  ): TPoint {
    const x1 = position1.point.x;
    const y1 = position1.point.y;
    const m1 = Math.tan(-position1.rotation); // -ve to account for the non-standard way angles are measured on the canvas.
    const x2 = position2.point.x;
    const y2 = position2.point.y;
    const m2 = Math.tan(-position2.rotation);

    // y - y1 = m(x - x1)
    // m1 * x + (-1) * y + (y1 - m1 * x1)
    // a1x + b1y + c1 = 0#
    // a1 = m1; b1 = -1; c1 = y1 - m1 * x1;
    const a1 = m1;
    const b1 = -1;
    const c1 = y1 - m1 * x1;
    const a2 = m2;
    const b2 = -1;
    const c2 = y2 - m2 * x2;

    // coRx = (b1c2−b2c1 / a1b2−a2b1), coRy = (c1a2−c2a1 / a1b2−a2b1)
    const coRx = (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1);
    const coRy = (c1 * a2 - c2 * a1) / (a1 * b2 - a2 * b1);

    return { x: coRx, y: coRy };
  }

  /**
   * This method returns the movement of a point when the point is rotated through a given angle around a center of rotation.
   *
   * @param point: The x and y coordinates of the point to be moved.
   * @param center: The x and y coordinates of the center of rotation around which the point is rotated.
   * @param angle: The angle, in degrees, to rotate the point relative to the x-axis with the angle measured positive counter-clockwise.
   * @returns The end x and y coordinates of the point following the rotation.
   */
  getRotatedPoint = (point: TPoint, center: TPoint, angle: number): TPoint => {
    /**
     * Consider the center of rotation (CoR) to be the origin of the x-y axis.
     * See note on angle measurement above.
     * A line L of length r connects the center of rotation, which is the first or lower point, to the point to be rotated (P0), which is the second or higher point.
     * Formula derivation:
     * 1. P0x = CORx + rCos(As).
     * 2. P0 is moved to P1 along an arc set by the line L rotating around the CoR.  The angle rotated is Ar.
     * => P1x = CORx + rCos(As+Ar).
     * 3. P1x – P0x = r(Cos(As+Ar) – Cos(As)).
     * So the offset of P1 relative to P0 is given by rCost(As+Ar) – rCos(As).
     * Similarly P1y - P0y = r(Sin(As+Ar) – Sin(As)).
     */
    const r = this.getDistance(center, point);
    const angleStartRads =
      this.getAngle(center, point) * this.config.DEG_TO_RAD;
    const angleRotatedRads = angle * this.config.DEG_TO_RAD;
    const offsetX =
      center.x +
      r *
        (Math.cos(angleStartRads + angleRotatedRads) -
          Math.cos(angleStartRads));
    const offsetY =
      center.x +
      r *
        (Math.sin(angleStartRads + angleRotatedRads) -
          Math.sin(angleStartRads));
    return { x: offsetX, y: offsetY };
  };

  /**
   * Returns the distance between two points.
   * @param point1 The first point.
   * @param point2 The second point.
   * @returns The distance in the units used in defining the points.
   */
  getDistance = (point1: TPoint, point2: TPoint): number => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2),
    );
  };

  /**
   * Returns the angle formed by the line between two points.
   * See note on angle measurement above.
   * Consider the two points to be P1 and P2 and that a line L connects P1 and P2w with P1 being the first (lower) point.
   * @param point1: The first point.
   * @param point2: The second point.
   * @returns: The angle in degrees.
   */
  getAngle = (point1: TPoint, point2: TPoint): number => {
    return (
      Math.atan((point2.y - point1.y) / (point2.x - point1.x)) *
      this.config.RAD_TO_DEG
    );
  };
}
