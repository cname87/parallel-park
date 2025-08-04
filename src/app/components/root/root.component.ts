import { MenuComponent } from '../menu/menu.component';
import { Component, AfterViewInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { CarService } from '../../services/car.service';
import { StreetService } from '../../services/street.service';
import { GridService } from '../../services/grid.service';
import { MoveService } from '../../services/move.service';
import { ObjectsService } from '../../services/objects.service';
import { ManoeuvreService } from '../../services/manoeuvres/manoeuvre.service';
import { IManoeuvre } from '../../services/manoeuvres/manoeuvre.service';
import { LoggerService } from '../../services/logger.service';
import { ManualMoveService } from '../../services/manual-move.service';
import { DataService } from '../../services/data.service';
import { SnackbarService } from '../../services/snackbar.service';
import {
  EButtonStatus,
  ECar,
  EMode,
  EManoeuvre,
  EStreet,
  LoggingLevel,
  TScenario,
} from '../../shared/types';
import { MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

/**
 * This component runs the application.
 */
@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  standalone: true,
  imports: [MenuComponent],
})
export class AppComponent implements AfterViewInit {
  constructor(
    private config: ConfigService,
    private grid: GridService,
    private street: StreetService,
    private car: CarService,
    private mover: MoveService,
    private objects: ObjectsService,
    private manoeuvre: ManoeuvreService,
    private keyMove: ManualMoveService,
    private data: DataService,
    private logger: LoggerService,
    private snack: SnackbarService,
  ) {
    this.defaultScenario = this.objects.scenarios[0];
  }
  /* Operation mode */
  private mode = EMode.Single;
  /* Detects main button click */
  private isMainButtonClicked = false;
  /* Stores the main button status when last clicked */
  private mainButtonLastClickStatus!: EButtonStatus;
  private selectedManoeuvre = EManoeuvre.Park2Rotate1StraightMinAngle;
  private carSetup = ECar.Fiat_Ducato_MWB_Van_2025;
  private streetSetup = EStreet.Width_1904mm;
  private defaultScenario!: TScenario;
  private infoSnackRef!: MatSnackBarRef<TextOnlySnackBar>;

  /* Utility function used to watch for button clicks */
  private runEventLoop = (timeMs = 0): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), timeMs);
    });
  };

  /**
   * Utility to construct the current scenario object.
   */
  private getCurrentScenario(): TScenario {
    return {
      manoeuvre: this.selectedManoeuvre,
      carSetup: this.carSetup,
      streetSetup: this.streetSetup,
    };
  }

  /**
   * Sets up the screen including positioning the car in its pre-parked position and also creates a manoeuvre for a scenario.
   *
   * @returns A manoeuvre, i.e. the set of moves to complete a parking manoeuvre.
   */
  setupScreen(scenario: TScenario = this.defaultScenario): IManoeuvre {
    //
    /* Clear the screen */
    this.config.stage.removeAllChildren();
    this.config.stage.update();

    /* Modify the car instance to contain the properties of a chosen car */
    this.car.update(this.objects[scenario.carSetup]);

    /* Modify the street instance to contain the properties of the basic street.
    Note: The parking space length may be zero and therefore set later. */
    this.street.update(this.objects[scenario.streetSetup]);

    /* Print the grid */
    this.grid.createGrid();

    /* Run the parking calculations getting a manoeuvre containing set of moves.
    The returned object contains the parking space length, a minimum kerb distance (if necessary), 
    the start position and the set of moves. */
    const manoeuvre = this.manoeuvre.getManoeuvre({
      manoeuvre: scenario.manoeuvre,
      street: this.street,
      car: this.car,
      config: this.config,
    });

    /* Update the parking space length if not already set. (A custom street may have already set a value, e.g. for keyboard use). */
    if (!this.street.parkingSpaceLength) {
      this.street.parkingSpaceLength = manoeuvre.parkingSpaceLength;
    }

    /* Print the street layout setting the parking space length */
    this.street.drawStreet({
      parkingSpaceLength: this.street.parkingSpaceLength,
    });

    /* Print the axis values (on top of the street) */
    this.grid.addAxesValues();

    /* Add the car to the street in its start position */
    this.car.draw({
      ...manoeuvre.startPosition,
    });

    return manoeuvre;
  }

  /**
   * This runs a set of manoeuvres based on a list of supplied scenarios..
   */
  async runPlaylist(scenarios: TScenario[]): Promise<void> {
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
      await this.runManoeuvre(scenario);
      /* Reset if the button clicked when status = Reset */
      if (this.mainButtonLastClickStatus === EButtonStatus.Reset) {
        break;
      }
    }
  }

  /**
   * This runs one parking manoeuvre, i.e. feeds a set of moves to the move service to park the car.
   */
  async runManoeuvre(scenario: TScenario): Promise<void> {
    //
    const manoeuvre = this.setupScreen(scenario);
    //
    /* Print out all manoeuvre data */
    this.logger.log(`**********************************`);
    this.logger.log(`Manoeuvre: ${scenario.manoeuvre}`);
    this.logger.log(`Street name: ${scenario.streetSetup}`);
    this.logger.log(`Car name: ${scenario.carSetup}`);
    this.logger.log(
      `Total parking space: ${Math.round(
        manoeuvre.parkingSpaceLength * this.config.distScale,
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
        (manoeuvre.parkingSpaceLength -
          this.car.length -
          2 * this.street.safetyGap) *
          this.config.distScale,
      )}mm`,
    );
    this.logger.log(
      `Kerb distance: ${Math.round(
        manoeuvre.minKerbDistance * this.config.distScale,
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
    for (const key in manoeuvre.movie) {
      if (Object.prototype.hasOwnProperty.call(manoeuvre.movie, key)) {
        const move = manoeuvre.movie[key];
        await this.mover.routeMove(move);
        /* Reset if the button clicked when status = Reset */
        if (this.mainButtonLastClickStatus === EButtonStatus.Reset) {
          break;
        }
      }
    }

    /* Test and report parking errors */
    if (this.mainButtonLastClickStatus !== EButtonStatus.Reset) {
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
      if (Math.abs(this.car.readCarRotation) > this.config.errorParkAngle) {
        this.logger.log(
          `Park Fail:\nCar Rotation is ${this.config.round(
            this.car.readCarRotation * this.config.RAD_TO_DEG,
            0,
          )} degrees`,
          LoggingLevel.ERROR,
        );
        parkingError = true;
      }
      if (
        Math.round(this.car.readFrontPortCorner.y) >
        this.config.errorDistFromKerb
      ) {
        this.logger.log(
          `Park Fail:\nDistance from kerb to front port corner is ${this.config.round(
            this.car.readFrontPortCorner.y * this.config.distScale,
            0,
          )}mm`,
          LoggingLevel.ERROR,
        );
        parkingError = true;
      }
      if (
        Math.round(this.car.readRearPortCorner.y) >
        this.config.errorDistFromKerb
      ) {
        this.logger.log(
          `Park Fail:\nDistance from kerb to rear port corner is ${this.config.round(
            this.car.readRearPortCorner.y * this.config.distScale,
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

    /* Put in a short delay between manoeuvres when in loop mode*/
    if (
      this.mode === EMode.Loop &&
      this.mainButtonLastClickStatus !== EButtonStatus.Reset
    ) {
      await this.runEventLoop(1000);
    }
  }

  /**
   * The main program loop.
   */
  async ngAfterViewInit(): Promise<void> {
    //
    /* Avoids view error */
    await this.runEventLoop();

    /* Subscribe to track the button status from the last click */
    this.data
      .getButton('main')
      .buttonLastClick$.pipe(
        this.logger.tapLog(
          'Root Component main button click detected',
          LoggingLevel.DEBUG,
        ),
      )
      .subscribe((status: EButtonStatus) => {
        this.mainButtonLastClickStatus = status;
        /* Reset this flag to false to detect a main button click */
        this.isMainButtonClicked = true;
      });

    /* Subscribe to track the selected parking manoeuvre, car and street setup */
    const manoeuvreService = this.data.getManoeuvre();
    if (manoeuvreService.manoeuvre$) {
      manoeuvreService.manoeuvre$
        .pipe(this.logger.tapLog('Manoeuvre chosen:', LoggingLevel.DEBUG))
        .subscribe((manoeuvre: EManoeuvre) => (this.selectedManoeuvre = manoeuvre));
    }

    const carService = this.data.getCar();
    if (carService.car$) {
      carService.car$
        .pipe(this.logger.tapLog('Car chosen:', LoggingLevel.DEBUG))
        .subscribe((car: ECar) => (this.carSetup = car));
    }

    const streetService = this.data.getStreet();
    if (streetService.street$) {
      streetService.street$
        .pipe(this.logger.tapLog('Street chosen:', LoggingLevel.DEBUG))
        .subscribe((street: EStreet) => (this.streetSetup = street));
    }

    const modeService = this.data.getMode();
    if (modeService.mode$) {
      modeService.mode$
        .pipe(this.logger.tapLog('Mode chosen:', LoggingLevel.DEBUG))
        .subscribe((data: EMode) => {
          this.mode = data;
        });
    }

    /* Subscribe to get latest info messages */
    this.snack.info$.subscribe((snackRef: MatSnackBarRef<TextOnlySnackBar>) => {
      this.infoSnackRef = snackRef;
    });

    /* Enable required tracking in the services */
    this.mover.trackButton();
    this.snack.trackButton();
    this.snack.trackMode();

    /* Read current scenario and set up starting default screen */
    let scenario: TScenario = this.getCurrentScenario();
    this.setupScreen(scenario);

    /* It loops to here after each completed loop or selected parking manoeuvre and awaits a button click */
    while (true) {
      //
      /* Redraw screen here only if the Reset button was pressed during a manoeuvre i.e. leave the car 'parked' until the next button click otherwise */
      if (this.mainButtonLastClickStatus === EButtonStatus.Reset) {
        /* Dismiss any open info snackbar */
        this.infoSnackRef.dismiss();

        scenario = this.getCurrentScenario();
        this.setupScreen(scenario);
      }

      /* Reset all if the loop mode is selected */
      if (this.mode === EMode.Loop) {
        // Defensive: getManoeuvre() may be undefined
        const manoeuvreService = this.data.getManoeuvre();
        if (
          manoeuvreService.manoeuvreForm &&
          manoeuvreService.manoeuvreInitialFormValue
        ) {
          manoeuvreService.manoeuvreForm.setValue(
            manoeuvreService.manoeuvreInitialFormValue,
          );
        }
        const carService = this.data.getCar();
        if (carService.carForm) {
          carService.carForm.setValue({
            car: ECar.VW_T5_LWB_Van_2005,
          });
        }
        const streetService = this.data.getStreet();
        if (streetService.streetForm) {
          streetService.streetForm.setValue({
            street: EStreet.Width_1904mm,
          });
        }
        /* Repaint screen to the defaults */
        scenario = this.getCurrentScenario();
        this.setupScreen(scenario);
        // Disable all form controls (except mode)
        this.data.getMode().modeForm.enable({ emitEvent: false });
        manoeuvreService.manoeuvreForm.disable({ emitEvent: false });
        carService.carForm.disable({ emitEvent: false });
        streetService.streetForm.disable({ emitEvent: false });
      } else {
        this.data.getMode().modeForm.enable({ emitEvent: false });
        this.data.getManoeuvre().manoeuvreForm.enable({ emitEvent: false });
        this.data.getCar().carForm.enable({ emitEvent: false });
        this.data.getStreet().streetForm.enable({ emitEvent: false });
      }

      /* Set button mode to 'Run' */
      this.data.getButton('main').enableRun();

      /* Set to wait for the next button click */
      this.isMainButtonClicked = false;
      let invalid = false;
      do {
        await this.runEventLoop();
        /* Disable menus if custom car or street entry form is invalid */

        if (
          // Add ? as custom car and street are optional
          this.data.getCustomCar()?.customCarForm?.invalid ||
          this.data.getCustomStreet()?.customStreetForm?.invalid
        ) {
          invalid = true;
          this.data.getButton('main').disable();
          this.data.getMode().modeForm.disable({ emitEvent: false });
          this.data
            .getManoeuvre()
            .manoeuvreForm.disable({ emitEvent: false });
          this.data.getCar().carForm.disable({ emitEvent: false });
          this.data.getStreet().streetForm.disable({ emitEvent: false });
        } else if (invalid === true) {
          invalid = false;
          this.data.getButton('main').enableRun();
          this.data.getMode().modeForm.enable({ emitEvent: false });
          this.data.getManoeuvre().manoeuvreForm.enable({ emitEvent: false });
          this.data.getCar().carForm.enable({ emitEvent: false });
          this.data.getStreet().streetForm.enable({ emitEvent: false });
        }
      } while (this.isMainButtonClicked === false);

      /* Disable all form controls */
      this.data.getMode().modeForm.disable({ emitEvent: false });
      this.data.getManoeuvre().manoeuvreForm.disable({ emitEvent: false });
      this.data.getCar().carForm.disable({ emitEvent: false });
      this.data.getStreet().streetForm.disable({ emitEvent: false });

      /* Set button to 'Reset' */
      this.data.getButton('main').enableReset();

      /* Allows menu changes take place */
      await this.runEventLoop();

      switch (this.mode) {
        case EMode.Keyboard:
          /* Read updated scenario */
          scenario = this.getCurrentScenario();
          this.setupScreen(scenario);
          /* Enable keyboard moving */
          this.keyMove.runKeyboard();
          /* Set to wait for the next button click */
          this.isMainButtonClicked = false;
          do {
            await this.runEventLoop();
          } while (this.isMainButtonClicked === false);
          /* Cancel keyboard operation */
          this.keyMove.cancelKeyboard();
          break;
        case EMode.Loop:
          const scenarios = this.objects.scenarios;
          await this.runPlaylist(scenarios);
          break;
        case EMode.Single:
          /* Read updated scenario */
          scenario = this.getCurrentScenario();
          await this.runPlaylist([scenario]);
          break;
        default:
          throw new Error('Unexpected mode in switch statement');
      }
    }
  }
}
