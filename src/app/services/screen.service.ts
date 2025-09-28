import { Injectable } from '@angular/core';
import { MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import {
  EButtonStatus,
  ECar,
  ERunMode,
  EManoeuvre,
  EStreet,
  IPark,
  LoggingLevel,
  TParkingScenario,
  TMove,
} from '../shared/types';
import { ConfigService } from './config.service';
import { SubscriptionManager } from '../shared/subscription-manager';
import { GridService } from './grid.service';
import { StreetService } from './street.service';
import { CarService } from './car.service';
import { MoveService } from './move.service';
import { ObjectsService } from './objects.service';
import { ParkingService } from './parking/parking.service';
import { ManualMoveService } from './manual-move.service';
import { DataService } from './data.service';
import { LoggerService } from './logger.service';
import { SnackbarService } from './snackbar.service';

@Injectable({ providedIn: 'root' })
export class ScreenService {
  private subscriptionManager = new SubscriptionManager();

  constructor(
    private config: ConfigService,
    private grid: GridService,
    private street: StreetService,
    private car: CarService,
    private mover: MoveService,
    private objects: ObjectsService,
    private park: ParkingService,
    private keyMove: ManualMoveService,
    private data: DataService,
    private logger: LoggerService,
    private snack: SnackbarService,
  ) {
    this.#defaultScenario = {
      mode: ERunMode.Automated,
      manoeuvre: EManoeuvre.Park2Rotate1StraightMinAngle,
      carSetup: ECar.Fiat_Ducato_MWB_Van_2025,
      streetSetup: EStreet.Width_1904mm,
    };
  }

  /* Operation mode */
  #mode = ERunMode.Automated;
  /* Detects main button click */
  #isMainButtonClicked = false;
  /* Stores the main button status when last clicked */
  #mainButtonLastClickStatus!: EButtonStatus;
  #selectedManoeuvre = EManoeuvre.Park2Rotate1StraightMinAngle;
  #carSetup = ECar.Fiat_Ducato_MWB_Van_2025;
  #streetSetup = EStreet.Width_1904mm;
  #defaultScenario!: TParkingScenario;
  #infoSnackRef!: MatSnackBarRef<TextOnlySnackBar>;

  /* Utility function used to watch for button clicks */
  private runEventLoop = (timeMs = 0): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), timeMs);
    });
  };

  /* Utility to construct the current scenario object. */
  public getCurrentScenario(): TParkingScenario {
    this.logger.log('getCurrentScenario called', LoggingLevel.TRACE);
    /* Read current scenario from the selected manoeuvre, car and street */
    return {
      mode: this.#mode,
      manoeuvre: this.#selectedManoeuvre,
      carSetup: this.#carSetup,
      streetSetup: this.#streetSetup,
    };
  }

  /**
   * Sets up the screen including positioning the car in its pre-parked position and also creates a manoeuvre for a scenario.
   *
   * @returns A manoeuvre, i.e. the set of moves to complete a parking manoeuvre.
   */
  public setupScreen(
    scenario: TParkingScenario = this.#defaultScenario,
  ): IPark {
    //
    /* Clear the screen */
    this.config.stage.removeAllChildren();
    this.config.stage.update();

    /* Print the grid */
    this.grid.createGrid();

    /* Modify the car instance to contain the properties of the scenario car */
    this.car.setCarFromScenario(this.objects[scenario.carSetup]);

    /* Modify the street instance to contain the properties of the scenario street.
    Note: The parking space length may be zero and therefore set later. */
    this.street.setStreetFromScenario(this.objects[scenario.streetSetup]);

    /* Run the parking calculations getting a manoeuvre containing set of moves. The returned object contains a calculated parking space length, the start position and the set of moves. */
    const manoeuvre = this.park.getParking({
      manoeuvre: scenario.manoeuvre,
      street: this.street,
      car: this.car,
      config: this.config,
    });

    /* Override the parking space length from the manoeuvre - the street parkingSpaceLength is used for Keyboard mode only. */
    this.street.updateStreetParkingSpace(manoeuvre.parkingSpaceLength);

    /* Draw the street layout setting the parking space length */
    this.street.drawStreet();

    /* Print the axis values (on top of the street) */
    this.grid.addAxesValues();

    /* Add the car to the street in its start position, with an initial angle */
    this.car.draw({ ...manoeuvre.startPosition }, manoeuvre.startAngleRads);

    return manoeuvre;
  }

  /**
   * This runs a set of manoeuvres based on a list of supplied scenarios..
   */
  async runPlaylist(scenarios: TParkingScenario[]): Promise<void> {
    /* Run the list of scenarios */
    for (const scenario of scenarios) {
      /* Set form values to match scenario */
      this.data
        .getManoeuvre()
        .manoeuvreForm.setValue({ manoeuvre: scenario.manoeuvre });
      this.data.getCar().carForm.setValue({ car: scenario.carSetup });
      this.data
        .getStreet()
        .streetForm.setValue({ street: scenario.streetSetup });
      await this.runParking(scenario);
      /* Reset if the button clicked when status = Reset */
      if (this.#mainButtonLastClickStatus === EButtonStatus.Reset) {
        break;
      }
    }
  }

  /**
   * This runs one parking scenario, i.e. feeds a set of moves to the move service to park the car.
   */
  async runParking(scenario: TParkingScenario): Promise<void> {
    //
    const parkScenario = this.setupScreen(scenario);
    //
    /* Print out all manoeuvre data */
    this.logger.log(`**********************************`);
    this.logger.log(`Manoeuvre: ${scenario.manoeuvre}`);
    this.logger.log(`Street name: ${scenario.streetSetup}`);
    this.logger.log(`Car name: ${scenario.carSetup}`);
    this.logger.log(
      `Total parking space: ${Math.round(
        parkScenario.parkingSpaceLength * this.config.distScale,
      )}mm`,
    );
    this.logger.log(`Car length: ${this.car.length * this.config.distScale}mm`);
    this.logger.log(
      `Total safety gap in parking space: ${
        2 * this.street.safetyGap * this.config.distScale
      }mm`,
    );
    this.logger.log(
      `Extra parking space: ${Math.round(
        (parkScenario.parkingSpaceLength -
          this.car.length -
          2 * this.street.safetyGap) *
          this.config.distScale,
      )}mm`,
    );
    this.logger.log(
      `Pivot point from kerb: ${Math.round(
        (this.street.carFromKerb +
          this.street.frontCarWidth +
          this.street.safetyGap) *
          this.config.distScale,
      )}mm`,
    );
    this.logger.log(`**********************************`);
    /* Run the parking manoeuvre */
    for (const key in parkScenario.movie) {
      if (Object.prototype.hasOwnProperty.call(parkScenario.movie, key)) {
        const move: TMove = parkScenario.movie[key];
        await this.mover.routeMove(move);
        /* Reset if the button clicked when status = Reset */
        if (this.#mainButtonLastClickStatus === EButtonStatus.Reset) {
          break;
        }
      }
    }

    /* Test and report parking errors */
    if (this.#mainButtonLastClickStatus !== EButtonStatus.Reset) {
      let parkingError = false;
      const manoeuvreInfo = () => {
        const currentLoggingLevel = this.logger.readLogginglevel();
        this.logger.setLoggingLevel(LoggingLevel.INFO);

        this.logger.log(`Manoeuvre: ${scenario.manoeuvre}`, LoggingLevel.INFO);
        this.logger.log(`Car: ${scenario.carSetup}`, LoggingLevel.INFO);
        this.logger.log(
          `Car Front Overhang: ${
            this.car.frontOverhang * this.config.distScale
          }mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Car Wheelbase: ${this.car.wheelbase * this.config.distScale}mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Car Rear Overhang: ${
            this.car.rearOverhang * this.config.distScale
          }mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Car Width: ${this.car.width * this.config.distScale}mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Car Turning Radius: ${
            this.car.minTurningRadius * this.config.distScale
          }mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(`Street: ${scenario.streetSetup}`, LoggingLevel.INFO);
        this.logger.log(
          `Front Car Width: ${
            this.street.frontCarWidth * this.config.distScale
          }mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Safety Gap: ${this.street.safetyGap * this.config.distScale}mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `Car From Kerb: ${this.street.carFromKerb * this.config.distScale}mm`,
          LoggingLevel.INFO,
        );
        this.logger.log(
          `******************************************`,
          LoggingLevel.INFO,
        );

        this.logger.setLoggingLevel(currentLoggingLevel);
      };
      if (Math.abs(this.car.carRotation) > this.config.errorParkAngle) {
        this.logger.log(
          `Park Fail:\nCar Rotation is ${this.config.round(
            this.car.carRotation * this.config.RAD_TO_DEG,
            0,
          )} degrees`,
          LoggingLevel.ERROR,
        );
        parkingError = true;
      }
      if (
        Math.round(this.car.frontPortCorner.y) > this.config.errorDistFromKerb
      ) {
        this.logger.log(
          `Park Fail:\nDistance from kerb to front port corner is ' +
          ${this.config.round(
            this.car.frontPortCorner.y * this.config.distScale,
            0,
          )}mm`,
          LoggingLevel.ERROR,
        );
        parkingError = true;
      }
      if (
        Math.round(this.car.rearPortCorner.y) > this.config.errorDistFromKerb
      ) {
        this.logger.log(
          `Park Fail:\nDistance from kerb to rear port corner is ' +
          ${this.config.round(
            this.car.rearPortCorner.y * this.config.distScale,
            0,
          )}mm`,
          LoggingLevel.ERROR,
        );
        parkingError = true;
      }
      if (parkingError) {
        manoeuvreInfo();
      }
    }
  }

  /**
   * The main program loop.
   */
  async start(): Promise<void> {
    //
    /* Avoids view error */
    await this.runEventLoop();

    /* Clean up any existing subscriptions before creating new ones */
    this.subscriptionManager.unsubscribeAll();

    /* Subscribe to track the button status from the last click */
    const mainButtonSub = this.data
      .getButton('main')
      .buttonLastClick$.pipe(
        this.logger.tapLog('Main button click detected', LoggingLevel.DEBUG),
      )
      .subscribe((status: EButtonStatus) => {
        this.#mainButtonLastClickStatus = status;
        /* Reset this flag to false to detect a main button click */
        this.#isMainButtonClicked = true;
      });
    this.subscriptionManager.add(mainButtonSub);

    /* Subscribe to track the selected parking manoeuvre, car and street setup */
    const manoeuvreService = this.data.getManoeuvre();
    if (manoeuvreService.manoeuvre$) {
      const manoeuvreSub = manoeuvreService.manoeuvre$
        .pipe(this.logger.tapLog('Manoeuvre chosen:', LoggingLevel.DEBUG))
        .subscribe((manoeuvre: EManoeuvre) => {
          this.#selectedManoeuvre = manoeuvre;
          this.setupScreen(this.getCurrentScenario());
        });
      this.subscriptionManager.add(manoeuvreSub);
    }

    const carService = this.data.getCar();
    if (carService.car$) {
      const carSub = carService.car$
        .pipe(this.logger.tapLog('Car chosen:', LoggingLevel.DEBUG))
        .subscribe((car: ECar) => {
          this.#carSetup = car;
          this.setupScreen(this.getCurrentScenario());
        });
      this.subscriptionManager.add(carSub);
    }

    const streetService = this.data.getStreet();
    if (streetService.street$) {
      const streetSub = streetService.street$
        .pipe(this.logger.tapLog('Street chosen:', LoggingLevel.DEBUG))
        .subscribe((street: EStreet) => {
          this.#streetSetup = street;
          this.setupScreen(this.getCurrentScenario());
        });
      this.subscriptionManager.add(streetSub);
    }

    const modeService = this.data.getRunMode();
    if (modeService.runMode$) {
      const modeSub = modeService.runMode$
        .pipe(this.logger.tapLog('Mode chosen:', LoggingLevel.DEBUG))
        .subscribe((data: ERunMode) => {
          this.#mode = data;
          this.setupScreen(this.getCurrentScenario());
        });
      this.subscriptionManager.add(modeSub);
    }

    /* Subscribe to get latest info messages */
    const infoSub = this.snack.info$.subscribe(
      (snackRef: MatSnackBarRef<TextOnlySnackBar>) => {
        this.#infoSnackRef = snackRef;
      },
    );
    this.subscriptionManager.add(infoSub);

    /* Enable required tracking in the services */
    this.mover.trackButton();
    this.snack.trackButton();
    this.snack.trackMode();

    /* Read current scenario and set up starting default screen */
    let scenario: TParkingScenario = this.getCurrentScenario();
    this.setupScreen(scenario);

    /* It loops to here after each completed loop or selected parking manoeuvre and awaits a button click */
    while (true) {
      //
      /* Redraw screen here only if the Reset button was pressed during a manoeuvre i.e. leave the car 'parked' until the next button click otherwise */
      if (this.#mainButtonLastClickStatus === EButtonStatus.Reset) {
        /* Dismiss any open info snackbar */
        if (this.#infoSnackRef) {
          this.#infoSnackRef.dismiss();
        }

        scenario = this.getCurrentScenario();
        this.setupScreen(scenario);
      }

      /* Enable all form controls */
      this.data.getRunMode().modeForm.enable({ emitEvent: false });
      this.data.getManoeuvre().manoeuvreForm.enable({ emitEvent: false });
      this.data.getCar().carForm.enable({ emitEvent: false });
      this.data.getStreet().streetForm.enable({ emitEvent: false });

      /* Set button mode to 'Run' */
      this.data.getButton('main').enableRun();

      /* Set to wait for the next button click */
      this.#isMainButtonClicked = false;
      do {
        await this.runEventLoop();
      } while (this.#isMainButtonClicked === false);

      /* Disable all form controls */
      this.data.getRunMode().modeForm.disable({ emitEvent: false });
      this.data.getManoeuvre().manoeuvreForm.disable({ emitEvent: false });
      this.data.getCar().carForm.disable({ emitEvent: false });
      this.data.getStreet().streetForm.disable({ emitEvent: false });

      /* Set button to 'Reset' */
      this.data.getButton('main').enableReset();

      /* Allows menu changes take place */
      await this.runEventLoop();

      switch (this.#mode) {
        case ERunMode.Keyboard:
          /* Read updated scenario */
          scenario = this.getCurrentScenario();
          this.setupScreen(scenario);
          /* Enable keyboard moving */
          this.keyMove.runKeyboard();
          /* Set to wait for the next button click */
          this.#isMainButtonClicked = false;
          do {
            await this.runEventLoop();
          } while (this.#isMainButtonClicked === false);
          /* Cancel keyboard operation */
          this.keyMove.cancelKeyboard();
          break;
        case ERunMode.Automated:
          /* Read updated scenario */
          scenario = this.getCurrentScenario();
          await this.runPlaylist([scenario]);
          break;
        default:
          throw new Error('Unexpected mode in switch statement');
      }
    }
  }

  /**
   * Clean up all subscriptions.
   * Should be called when the service is no longer needed.
   */
  cleanup(): void {
    this.subscriptionManager.unsubscribeAll();
  }
}
