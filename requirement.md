# Purpose
The purpose is to help the user understand how best to parallel park their car.  It allows the user experiment with different parallel parking strategies, i.e. sequences of reversing manoeuvres, and watch the result on the canvas to allow angles and distances be visualised.  It includes a proposed ideal parking strategy that the user can review on the canvas. All key dimenesions are configurable so the user can set up the canvas to match their car. 
- It is not a review of the mathematics involved.  The underlying mathematics are lifted from referenced papers.
- It is not just an animation of the ideal strategy - the user can play with other sequences of manoeuvres to gain an appreciation of how varying the manoeuvres affects the outcome.  
- It is not a parking game where you steer a car via the keyboard or other input device attempting to park in different situations. 

# Background

I drive a VW long wheel base Transporter van so I have an interest in being able to parallel park efficiently.  
A first internet search... Blackburn, Hoyle, Norbert Herrmann, Jerome White Nico Schertler
Summarise the Maths?
Summarise the ideal strategy.

# User Guide


# Requirement for the page

1. Has a data entry section:

   1. Has entry fields for the vehicle dimensions
      1. Wheel base
      2. Wheel-to-wheel width
      3. Side overhang
      4. Front overhang
      5. Rear overhang
      6. Turning circle 

   2. Has entry fields for the layout dimensions
      1. Parking space length
      2. Obstacle car width
      3. Car start position
      4. Out from obstacle car
      5. Forward from obstacle car

   3. Has entry fields for the move command
      1. There are multiple sets of move parameters. Each set consists of: 
         1. Steering wheel position (radio button)
            1. Centered
            2. Clockwise full lock
            3. Anti-clockwise full lock
         2. Distance to be moved (enabled if steering in centered)
         3. Angle to rotate car (enabled if steering is not centered)

   4. All entry fields are loaded with defaults when the page is loaded

2. Has an action menu:
   
   1. Has an action button labelled 'Reset' that sets up the canvas with the entered values. It repaints the canvas setting up the position and dimensions as per the entry fields
   2. Has an action button labelled 'Move Car' that moves the car on the canvas.  The command triggers multiple consectutive moves as per the multiple sets of move parameters in the entry fields.

3. Has an information area:
   
   1. Shows the canvas grid dimension in meters 

4. Has a 2D canvas:

   1. Shows the parking space consisting of two parks cars with a space in between
   2. Shows the car to be parked in it's configured starting position
   3. Shows how the car moves in response to the configured move parameters in the entry fields

