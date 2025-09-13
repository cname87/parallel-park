import { AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Component } from '@angular/core';
import { EButtonStatus, ECar, ERunMode, EStreet } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ModeComponent } from '../mode/mode.component';
import { ButtonComponent } from '../button/button.component';
import { ManualModeComponent } from '../manual-mode/manual-mode.component';
import { ManoeuvreComponent } from '../manoeuvre/manoeuvre.component';
import { CarComponent } from '../car/car.component';
import { StreetComponent } from '../street/street.component';

/**
 * This component displays the selection menus.
 */

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    ModeComponent,
    ButtonComponent,
    ManualModeComponent,
    ManoeuvreComponent,
    CarComponent,
    StreetComponent,
  ],
})
export class MenuComponent implements AfterViewInit {
  constructor(private data: DataService) {}

  public showScenarioForm: 'none' | 'block' = 'block';
  public showCustomCarForm: 'none' | 'block' = 'none';
  public showCustomStreetForm: 'none' | 'block' = 'none';
  public showManualMode = false;

  /**
   * Sets up the various displays.
   */
  ngAfterViewInit(): void {
    let buttonStatus: EButtonStatus;
    let mode: ERunMode;
    let car: ECar;
    let street: EStreet;

    const carObj = this.data.getCar();
    if (carObj && carObj.car$) {
      carObj.car$.subscribe((value: ECar) => {
        car = value;
        if (value === ECar.Custom_Car && buttonStatus === EButtonStatus.Run) {
          this.showCustomCarForm = 'block';
        } else {
          this.showCustomCarForm = 'none';
        }
      });
    }

    const modeObj = this.data.getRunMode();
    if (modeObj && modeObj.runMode$) {
      modeObj.runMode$.subscribe((value: ERunMode) => {
        mode = value;
        if (mode === ERunMode.Automated && buttonStatus === EButtonStatus.Run) {
          this.showScenarioForm = 'block';
        }
        if (mode === ERunMode.Keyboard && buttonStatus === EButtonStatus.Run) {
          this.showScenarioForm = 'block';
        }
      });
    }

    const streetObj = this.data.getStreet();
    if (streetObj && streetObj.street$) {
      streetObj.street$.subscribe((value: EStreet) => {
        street = value;
        if (
          value === EStreet.Custom_Street &&
          buttonStatus === EButtonStatus.Run
        ) {
          this.showCustomStreetForm = 'block';
        } else {
          this.showCustomStreetForm = 'none';
        }
      });
    }

    const buttonObj = this.data.getButton('main');
    if (buttonObj && buttonObj.buttonStatus$) {
      buttonObj.buttonStatus$.subscribe((status: EButtonStatus) => {
        buttonStatus = status;
        if (status === EButtonStatus.Run) {
          this.showManualMode = false;
          switch (mode) {
            case ERunMode.Automated:
            case ERunMode.Keyboard:
              this.showScenarioForm = 'block';
              if (car === ECar.Custom_Car) {
                this.showCustomCarForm = 'block';
              } else {
                this.showCustomCarForm = 'none';
              }
              if (street === EStreet.Custom_Street) {
                this.showCustomStreetForm = 'block';
              } else {
                this.showCustomStreetForm = 'none';
              }
              break;
            default:
              break;
          }
        }
        if (status === EButtonStatus.Reset) {
          this.showScenarioForm = 'none';
          this.showCustomCarForm = 'none';
          this.showCustomStreetForm = 'none';
          switch (mode) {
            case ERunMode.Keyboard:
              this.showManualMode = true;
              break;
            default:
              break;
          }
        }
      });
    }
  }
}
