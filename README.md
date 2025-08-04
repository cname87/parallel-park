# Parallel Parking

- [Parallel Parking](#parallel-parking)
  - [Introduction](#introduction)
  - [Purpose](#purpose)
  - [Optimized Manoeuvres](#optimized-manoeuvres)
  - [Required Minimum Parking Space for Various Cars](#required-minimum-parking-space-for-various-cars)
  - [Proposed practical parking strategy](#proposed-practical-parking-strategy)
  - [User Guide](#user-guide)
  - [References](#references)

## Introduction

I drive a Volkswagen Transporter long wheel base van (camper conversion) which I often need to parallel park in tight spaces in Dublin, so during these Covid evenings I fell to wondering how to most effectively parallel park. With too much spare time on my hands it turned into a small application demonstrating optimum parallel-parking manoeuvres. See <http://parking.project-perform.com/>.

## Purpose

The purpose is to help a user understand how to parallel park their car.

- It allows the user to review different parallel parking manoeuvres, i.e. sequences of reversing moves, watching the movements on the screen allowing angles and distances be visualised.
- A selection of pre-configured cars can be parked, or the car to be parked can be configured with the dimensions of the user's car.  The front car width and other street dimensions can also be customized.
- It includes a **proposed ideal *practical* parking manoeuvre** that the user can review on the screen.  This manoeuvre is based on 'rules' i.e. practical cues that the driver uses to judge turning angles, when to stop reversing, and so on.
- A manual mode allows the user to use on-screen buttons, or the keyboard, to attempt parking manoeuvres with different cars, parking space lengths, and so on, to gain an appreciation of how these variables affect the outcome.  

- This is not a review of the mathematics involved.  The underlying mathematics is extended from the referenced sources.
- It is not just a calculation of minimum parking lengths.  A number of complete manoeuvres can be run with custom car and street dimensions.  Most importantly, a non-optimized practical rules-based manoeuvre is proposed as the best real world parking strategy.  Finding this practical is the central goal of the application.
- It is not a parking game, although manual mode does allow the user play with parallel parking different cars with custom parking spaces and front car widths.

## Optimized Manoeuvres

I generated four manoeuvres that use optimized calculations:

1. **Minimum Angle Turn-In:** Turning in with the minimum angle, reversing back, and then straightening up.  The calculated minimum parking space is the same as in manoeuvres 3 and 4.
2. **Minimum Angle with Shunt:** This is the same as the Minimum Angle Turn-In manoeuvre but the car meets the rear car at an angle and then turns in.  This results in a smaller required parking space. This provides the **absolute minimum parking space** assuming the driver wants at most one such 'shunt'.  Note that this extra 'shunt' could be added to the other two manoeuvres so they would also require the absolute minimum parking space.
3. **Fixed Location Start - Medium Angle Turn-In:** Starting from a fixed position, with the rear axle opposite the rear bumper of the front car, turning in with a medium turn-in angle, and then straightening up.
4. **One Turn Only - Maximum Angle Turn-In:** Turning in using one wide turn followed by a turn of the same angle in the opposite direction, ending up straight by the kerb without any straight reversing.  This uses the maximum practical turn-in angle.

## Required Minimum Parking Space for Various Cars

- These calculated spaces include a safety gap of 300mm i.e. your car does not get closer than 300mm to either the front or rear car.
- These calculated spaces assume that the rear car corner cannot pass over the kerb. If the car rear overhang can move over the kerb then the calculated spaces would be shorter.
- The 'No Shunt' space corresponds to a manoeuvre where your car reverses directly until it is parallel to the kerb.
- The 'With Shunt' space corresponds to a manoeuvre where your car reverses until it meets the rear car at an angle and then turns in and forward until it is parallel to the kerb.
- 1.5 times the Car Length is included for comparison, as this is the minimum parking space length generally recommended by car driving schools.

|              Car             |Parking Space No Shunt|Parking Space With Shunt|Car Length * 1.5|
| :--------------------------: | :------------------: | :--------------------: | :------------: |
|      VW T5 LWB Van 2005      |       7,569mm        |        6,912mm         |     7,935mm    |
| Mercedes E-Class Estate 2020 |       7,149mm        |        6,532mm         |     7,400mm    |
| Mercedes C-Class Saloon 2020 |       6,869mm        |        6,270mm         |     7,029mm    |
|       Hyundai i30 2020       |       6,365mm        |        5,850mm         |     6,525mm    |
|       Seat Ibiza 2018        |       6,070mm        |        5,571mm         |     6,089mm    |
|       Kia Picanto 2020       |       5,686mm        |        5,138mm         |     5,393mm    |

## Proposed practical parking strategy

Looking at animations of optimized parking manoeuvres is useful to help visualise how to park but is of little practical use when one is actually trying to park a car in a tight space.  What you need is a set of rules to follow, along the lines of 'Start 1 metre out from the front car, turn until you can see the inner corner of the rear car in the driver-side mirror, ...', and so on.

There are lots of videos on Youtube proposing different strategies.  I tested all I could find using manual mode but all failed my simulation.

Here's my proposal:

1. Drive alongside the front car so you are positioned 600mm (0.6m) out from the front car.
   - Most guides don't give a distance. Some say drive as close as possible to the car in front but this is not necessary. 600mm is a safe distance. The result is not heavily dependent on this distance so a best estimate is fine.
2. Reverse back until the rear bumper of your car is in line with the rear bumper of the front car.  You can judge this by lining up the front mirrors on both cars or using a similar technique.
   - This is the instruction in most guides. Some say to reverse so your car's rear axle is opposite the rear bumper of the front car but that results in quite a wide turn-in angle - see the Fixed Location Start manoeuvre which starts from this position.
3. Stop the car and lock the wheel fully counterclockwise (for a left-hand drive car).
    - Power steering has removed the need to keep the car moving whilst moving the steering wheel.
4. Start turning in, watching in the far (kerb-side) mirror. *Watch as the rear car appears in the mirror and keep turning until your car is lined up with a spot 1250mm (1.25m) forward of the rear car.* It is difficult to judge where a spot 1250mm forward from the rear car is, but it turns out that anywhere from about 1m to 1.5m works.
   - Some guides say watch in the mirror until you line up with the corner of the rear car but that fails my simulation. Some say to refer to the front licence plate which again fails my simulation.
5. Stop the car and center the steering wheel so you can move straight back.
   - Incorporating a straight section is easier to judge than trying to go for one wide turn - see the One Turn Only manoeuvre for a manoeuvre with no straight section.
6. Reverse back until the front inner corner has cleared the rear of the front car by 300mm (0.3m), i.e. a suitable safety gap, and the rear corner of your car is within 400mm (0.4m) of the kerb.
   - It requires some practice to judge this.
7. Stop the car and lock the wheel fully clockwise (for a left-hand drive car).

8. Move backward until you are 300mm (0.3m) away from the rear car, i.e. within whatever you deem to be a safety gap.

9. Stop the car and lock the wheel fully counterclockwise (for a left-hand drive car).

10. Move forward until the car is parallel with the kerb.

11. If necessary, reverse back to center the car in the parking space.

The above strategy successfully parks all cars in the minimum parking space in the application.

I tested this strategy with my van and it behaved exactly as simulated!

If you come up with a better practical parking strategy please email me details on cname87@yahoo.com so I can simulate it.

## User Guide

The application is largely self-explanatory.

1. Select 'Automatic Mode' or 'Manual Mode' via the top radio button.
   - Automatic Mode runs an animation for a selected car and street.
   - Manual Mode allows you park via on-screen buttons or the keyboard.
2. Select a manoeuvre from the manoeuvre drop down list.
   - The manoeuvres correspond to the list of manoeuvres above.
3. Select a car from the drop-down list.
   - If you select 'Custom Car' then select the car dimensions which you should be able to find online. 'Turning Circle Radius' is the radius of a circle formed by the front outer corner of the car as it turns in its tightest circle.  
4. Select front car width from the drop down list.
   - If you select 'Custom Street' then you can select the front car width, how close to the kerb you want the car to park, and the safety gap, which is how close you allow your car to approach either the front or rear car. In Manual Mode you can also set the parking space width - if you leave this at 0 then the parking space length is the calculated minimum.
5. Press the 'Run' button in the top right.
   - In 'Automatic Mode' the animation runs.
     - Clicking anywhere on the canvas grid pauses the animation ans shows the dimensions of the clicked spot.
   - In 'Manual Mode' the street is presented with the calculated or custom-entered parking space width.
     - Press the on-screen buttons or keyboard keys to turn the wheels or move the car.
     - Press the key 'p' to park the car.  This allows you to play with exiting a parking space.
6. Press the 'RESET' button to return to the selection screen.

## References

Research consisted of a simple internet search.  The following are the key sources:

1. The earliest reference that I could find is to work by Rebecca Hoyle (Professor of Mathematics) published in 2003. I could not find the original work online - her legacy appears to be various news articles playing on the fact that a woman is the author of a paper on the mathematics of parallel-parking, for example: <https://www.derstandard.at/story/1276633/it-takes-a-woman-to-work-out-how-to-park-perfectly>.

2. Professor Simon Blackburn was commissioned in 2009 by Vauxhall Motors to produce a paper of the geometry on parallel-parking.  This paper outlines the basic mathematics involved. See <http://personal.rhul.ac.uk/uhah/058/perfect_parking.pdf>.

3. Blackburn's paper triggered a Louisiana math teacher, Jerome White, to further optimize, reducing the required parking space to a practical minimum. Blackburn assumes the car swings in and reverses back until it is parallel with the kerb whereas White allows that the car reverses until it touches the rear car at an angle and then turns forward until it is parallel to the kerb. (Further reduction of the required parking space is possible if you allow multiple back and forth movements but the reduction is small and nobody wants to be shuffling back and forth in a very tight space).  White produced some nice handwritten diagrams and formulae - <http://www.talljerome.com/NOLA/parallelparking/index.html>.

4. In 2012 Norbert Hermann published a book 'The Beauty of Everyday Mathematics' (<https://www.springer.com/gp/book/9783642221033>), which includes a chapter on parallel parking.  It doesn't add a huge amount to the work above but it does include a nice diagram that helps explains the symmetries involved.

5. in 2015 Nico Schertler produced a nice animation based on Hoyle's and Hermann's work proposing one specific manoeuvre.  See <https://nicoschertler.wordpress.com/2015/09/12/simulating-perfect-parallel-parking/>.

The original sources focus on formulae that determine the minimum parking space given the car and street dimensions.  I added the equations necessary to determine all the moves required to park, starting from a position parallel to the front car, i.e. what angle to turn in, how much to reverse forward (if any), what angle to meet the rear car, etc.
