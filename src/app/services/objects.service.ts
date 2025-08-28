import { Injectable } from '@angular/core';
import {
  ECar,
  EMode,
  EManoeuvre,
  EStreet,
  TCarSetup,
  TScenario,
  TStreetSetup,
} from '../shared/types';
import { ConfigService } from './config.service';

/**
 * Stores all the cars, streets and manoeuvres.
 */

@Injectable({
  providedIn: 'root',
})
export class ObjectsService {
  public Width_1904mm: TStreetSetup;
  public Width_1852mm: TStreetSetup;
  public Width_1795mm: TStreetSetup;
  public Width_1595mm: TStreetSetup;
  public Width_2073mm: TStreetSetup;
  public Width_2426mm: TStreetSetup;
  public Custom_Street: TStreetSetup;

  constructor(public config: ConfigService) {
    this.Width_1904mm = {
      name: EStreet.Width_1904mm,
      rearCarWidth: 1904,
      /* Same as 2005 VW T5 van */
      frontCarWidth: 1904,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Width_1852mm = {
      /* Same as 2020 Mercedes E Class Estate */
      name: EStreet.Width_1852mm,
      rearCarWidth: 1852,
      frontCarWidth: 1852,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Width_1795mm = {
      /* Same as 2020 Hyundai i30 */
      name: EStreet.Width_1795mm,
      rearCarWidth: 1795,
      frontCarWidth: 1795,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Width_1595mm = {
      name: EStreet.Width_1595mm,
      rearCarWidth: 1450,
      /* Same as 2020 Kia Picanto - narrowest car */
      frontCarWidth: 1595,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Width_2073mm = {
      name: EStreet.Width_2073mm,
      rearCarWidth: 2073,
      /* Same as 2020 Landrover Discovery Sport */
      frontCarWidth: 2073,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Width_2426mm = {
      name: EStreet.Width_2426mm,
      rearCarWidth: 2426,
      /* Same as 2020 VW Crafter - widest van */
      frontCarWidth: 2426,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };

    this.Custom_Street = {
      name: EStreet.Custom_Street,
      rearCarWidth: 1000,
      frontCarWidth: 1000,
      carFromKerb: this.config.defaultCarFromKerb * this.config.distScale,
      safetyGap: this.config.defaultSafetyGap * this.config.distScale,
      parkingSpace: 0,
    };
  }

  get scenarios(): Array<TScenario> {
    const scenarios: Array<TScenario> = [];
    for (const street of this.streets) {
      for (const car of this.cars) {
        for (const manoeuvre of this.manoeuvres) {
          scenarios.push({
            manoeuvre: manoeuvre[0],
            carSetup: car[0],
            streetSetup: street[0],
          });
        }
      }
    }
    return scenarios;
  }

  /**
   * Car distances are expressed in real-world distances.  Thus, they can be entered with reference to real-world distances.
   * They are scaled immediately in the car service and within the program all distances are scaled.
   * See https://www.tyres.ie/tyres-calculator for tyre sizes.
   */

  readonly Fiat_Ducato_MWB_Van_2025: TCarSetup = {
    name: ECar.Fiat_Ducato_MWB_Van_2025,
    minTurningRadius: 6250, // 12.5m turning circle
    rearOverhang: 1015,
    wheelbase: 3450,
    frontOverhang: 948,
    wheelToWheelWidth: 1800, // Front 1810, rear 1790
    sideOverhang: 125, // Width 2050 => (2050 - 1800) / 2
    wheelWidth: 225, // 225/75 R16 CP
    wheelLength: 744,
  };

  readonly VW_T5_LWB_Van_2005: TCarSetup = {
    name: ECar.VW_T5_LWB_Van_2005,
    minTurningRadius: 6600,
    rearOverhang: 996,
    wheelbase: 3400,
    frontOverhang: 894,
    wheelToWheelWidth: 1628,
    sideOverhang: 138, // Width 1904 => (1904 - 1628)
    wheelWidth: 215, // 215/65 R16
    wheelLength: 686,
  };

  readonly Mercedes_E_Estate_2020: TCarSetup = {
    name: ECar.Mercedes_E_Estate_2020,
    minTurningRadius: 5850,
    rearOverhang: 1153,
    wheelbase: 2939,
    frontOverhang: 841,
    wheelToWheelWidth: 1609, // 1600mm front
    sideOverhang: 121, // 1852mm total width
    wheelWidth: 225, // 245/45 R18
    wheelLength: 660,
  };

  readonly Mercedes_C_Saloon_2020: TCarSetup = {
    name: ECar.Mercedes_C_Saloon_2020,
    minTurningRadius: 5610,
    rearOverhang: 1056,
    wheelbase: 2840,
    frontOverhang: 790,
    wheelToWheelWidth: 1588, // 1570mm front
    sideOverhang: 111, // 1810mm total width
    wheelWidth: 225, // 225/45 R17
    wheelLength: 634,
  };

  readonly Hyundai_i30_2020: TCarSetup = {
    name: ECar.Hyundai_i30_2020,
    minTurningRadius: 5300,
    rearOverhang: 740,
    wheelbase: 2650,
    frontOverhang: 950,
    wheelToWheelWidth: 1549,
    sideOverhang: 123, // 1795mm total width
    wheelWidth: 195, // 195/65 R15
    wheelLength: 634,
  };

  readonly Seat_Ibiza_2018: TCarSetup = {
    name: ECar.Seat_Ibiza_2018,
    minTurningRadius: 5000,
    rearOverhang: 699,
    wheelbase: 2564,
    frontOverhang: 796,
    wheelToWheelWidth: 1525, // 1505mm rear, 1525mm front
    sideOverhang: 127.5, // 1780mm total width
    wheelWidth: 175, // 175/65 R14
    wheelLength: 609, // 14 inch
  };

  readonly Hyundai_i10_2018: TCarSetup = {
    name: ECar.Hyundai_i10_2018,
    minTurningRadius: 4780,
    rearOverhang: 600, // Approx.
    wheelbase: 2385, // 3665mm total length
    frontOverhang: 680, // Approx.
    wheelToWheelWidth: 1480, // 1480mm rear, 1467mm front
    sideOverhang: 90, // Approx; 1660mm total width
    wheelWidth: 175, // 175/65 R14
    wheelLength: 609, // 14 inch
  };

  /* This is taken as the smallest car encountered */
  /* Therefore the narrowest front car width is 1595mm */
  readonly Kia_Picanto_2020: TCarSetup = {
    name: ECar.Kia_Picanto_2020,
    minTurningRadius: 4800,
    rearOverhang: 520,
    wheelbase: 2400, // 3595mm total length
    frontOverhang: 675,
    wheelToWheelWidth: 1403, // 1403mm rear, 1394mm front
    sideOverhang: 96, // 1595mm total width
    wheelWidth: 175, // 175/65 R14
    wheelLength: 609, // 14 inch
  };

  Custom_Car: TCarSetup = {
    name: ECar.Custom_Car,
    minTurningRadius: 6600,
    rearOverhang: 996,
    wheelbase: 3400,
    frontOverhang: 894,
    wheelToWheelWidth: 1628,
    sideOverhang: 138,
    wheelWidth: 215,
    wheelLength: 686,
  };

  readonly modes: EMode[] = [EMode.Loop, EMode.Single, EMode.Keyboard];

  readonly manoeuvres: Array<[EManoeuvre, string]> = [
    [
      EManoeuvre.Park2Rotate1StraightMinAngle,
      'No Forward Pull-In; Minimum Angle Turn-In',
    ],
    [
      EManoeuvre.Park2Rotate0Straight,
      'No Forward Pull-In; Maximum Angle Turn-In',
    ],
    [
      EManoeuvre.Park2Rotate1StraightFixedStart,
      'No Forward Pull-In; Fixed Location Start',
    ],
    [
      EManoeuvre.Park2Rotate1StraightSetManual,
      'No Forward Pull-In; Manual Parameters',
    ],
    [
      EManoeuvre.Park3Rotate1StraightMinAngle,
      'Forward Pull-In; Minimum Angle Turn-In',
    ],
    [
      EManoeuvre.Park3UsingRules1,
      'Park By Rule 1 - NOT using optimal calculations',
    ],
    [
      EManoeuvre.Park3UsingRules2,
      'Park By Rule 2 - NOT using optimal calculations',
    ],
  ];

  readonly cars: Array<[ECar, string]> = [
    [ECar.Fiat_Ducato_MWB_Van_2025, 'Fiat Ducato MWB Van 2025'],
    [ECar.VW_T5_LWB_Van_2005, 'VW T5 LWB Van 2005'],
    [ECar.Mercedes_E_Estate_2020, 'Mercedes E-Class Estate 2020'],
    [ECar.Mercedes_C_Saloon_2020, 'Mercedes C-Class Saloon 2020'],
    [ECar.Hyundai_i30_2020, 'Hyundai i30 2020'],
    [ECar.Hyundai_i10_2018, 'Hyundai i10 2018'],
    [ECar.Seat_Ibiza_2018, 'Seat Ibiza 2018'],
    [ECar.Kia_Picanto_2020, 'Kia Picanto 2020'],
    [ECar.Custom_Car, 'Custom Car'],
  ];

  readonly streets: Array<[EStreet, string]> = [
    [EStreet.Width_1904mm, 'Front Car Width: 1904mm'],
    [EStreet.Width_1852mm, 'Front Car Width: 1852mm'],
    [EStreet.Width_1795mm, 'Front Car Width: 1795mm'],
    [EStreet.Width_1595mm, 'Front Car Width: 1595mm'],
    [EStreet.Width_2073mm, 'Front Car Width: 2073mm'],
    [EStreet.Width_2426mm, 'Front Car Width: 2426mm'],
    [EStreet.Custom_Street, 'Custom Front Car Width'],
  ];
}
