(function calculate() {

  const scaling = "fit"; // this will resize to fit inside the screen dimensions
  const width = 800;
  const height = 400;
  const color = light;
  const outerColor = dark;

  const frame = new Frame(scaling, width, height, color, outerColor);
  frame.on("ready", () => {
      console.log("Event ready received from ZIM Frame");

    var grid = new Grid({percent:false});

    const stage = frame.stage;
    let stageW = frame.width;
    let stageH = frame.height;

    const scale = 20;

    const carRearOverhang = 996 / scale;
    const carWheelBase = 3400 / scale;
    const carFrontOverhang = 894 / scale;
    const carTurningCircle = 6600 / scale;
    const carWheelToWheelWidth = 1628 / scale;
    const carSideOverhang = 138 / scale;
    const carWidth = carWheelToWheelWidth + (2 * carSideOverhang);
    console.log(`carWidth: ${carWidth}`);
    const carTurnCenterFromCarCenter =
      Math.sqrt(Math.pow(carTurningCircle, 2) -
      Math.pow((carRearOverhang + carWheelBase), 2)) -
      (carWidth / 2);
    console.log(`carTurnCenterFromCarCenter: ${carTurnCenterFromCarCenter}`);
    const carLength = carRearOverhang + carWheelBase + carFrontOverhang;
    let carRotation = 0;

    const rearCarFromLeft = 0 / scale;
    const rearCarLength = 1000 / scale;
    const rearCarWidth = 1904 / scale;
    const rearCarY = stageH - rearCarWidth;

    const parkingSpaceLength = carLength + (1750 / scale);
    const parkingSpaceFromLeft = rearCarFromLeft + rearCarLength;

    const frontCarLength = 5400 / scale;
    const frontCarFromLeft = parkingSpaceFromLeft + parkingSpaceLength;
    const frontCarWidth = 1904 / scale;

    const carFromBackOfFrontCar = 200 / scale;
    const carFromLeft = frontCarFromLeft + carFromBackOfFrontCar;
    const carFromSideOfFrontCar = 300 / scale;
    // const carFromKerb = frontCarWidth + carFromSideOfFrontCar;
    const carFromKerb = 0;


    // const carX = carFromLeft + (carLength / 2);
    const carX = rearCarFromLeft + rearCarLength + (carLength / 2);
    // const carY = stageH - (carWidth + carFromKerb) + (carWidth / 2);
    const carY = stageH - carWidth / 2;

    let rearCar = new Rectangle(rearCarLength, rearCarWidth, red, black, 1)
      .pos(rearCarFromLeft, rearCarY, LEFT, TOP)

    let parkingSpace = new Rectangle(parkingSpaceLength, frontCarWidth, 0)
      .pos(parkingSpaceFromLeft, 0, LEFT, BOTTOM)

    let frontCar = new Rectangle(frontCarLength, frontCarWidth, red, black, 1)
      .pos(frontCarFromLeft, 0, LEFT, BOTTOM)

    const xMovement = -100;
    const yMovement = 0;

    let car = new Rectangle(carLength, carWidth, blue, black, 1)
      .centerReg(stage, null, false)
      .addTo(stage)
      .loc(carX, carY);

    let carRearAxle = new Line({
        thickness:1,
        points:[[carX-(carLength/2)+carRearOverhang,carY+(carWidth/2)-carSideOverhang],
          [carX-(carLength/2)+carRearOverhang,carY-(carWidth/2)+carSideOverhang]]});

    const carContainer = new Container();
    stage.addChild(carContainer);
    carContainer.addChild(car);
    carContainer.addChild(carRearAxle);

    const turnCircle = new Circle( carTurnCenterFromCarCenter, null, "red", 1)
      .pos({x:(carX - (carLength / 2) + carRearOverhang), y:(carY - carTurnCenterFromCarCenter), regX:true, regY:true});


    const turnCircle2 = new Circle( carTurningCircle, null, "red", 1)
      .pos({x:(carX - (carLength / 2) + carRearOverhang), y:(carY - carTurnCenterFromCarCenter), regX:true, regY:true});

    let start = undefined;
    let count = 0
    let elapsedLast = 0;
    let diff = 0;
    function step(timestamp) {
      if (start === undefined)
        start = timestamp;
      const elapsed = timestamp - start;

      diff = elapsed - elapsedLast
      elapsedLast = elapsed;

      count++;
      console.log(`elapsed: ${elapsed}`);
      console.log(`diff: ${diff}`)
      console.log(`count: ${count}`);

      let movX = 0;
      let movY = 0;
      rotAngle = 0;


      if (elapsed <= 10000) {
        carContainer.rot(-count/100, (carX - (carLength / 2) + carRearOverhang), (carY - carTurnCenterFromCarCenter));

      }
      if (elapsed > 10000) {
        carRotation = carContainer.rotation;
        console.log(-carRotation);
        movX = 1;
        movY = movX * Math.tan(carRotation* Math.PI / 180);
        carContainer.mov(movX,movY);
      }

      stage.update();

      if (elapsed < 20000) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);

  });

})()
