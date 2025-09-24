import { AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Component } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { EButtonStatus, ECar, ERunMode, EStreet } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { BaseComponent } from '../../shared/base.component';
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
export class MenuComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  constructor(private data: DataService) {
    super();
  }

  public showScenarioForm: 'none' | 'block' = 'block';
  public showCustomCarForm: 'none' | 'block' = 'none';
  public showCustomStreetForm: 'none' | 'block' = 'none';
  public showManualMode = false;

  private buttonStatus: EButtonStatus = EButtonStatus.Reset;
  private mode: ERunMode = ERunMode.Automated;
  private car: ECar = ECar.VW_T5_LWB_Van_2005;
  private street: EStreet = EStreet.Width_1904mm;

  /**
   * Initialize subscriptions with proper cleanup using takeUntil pattern.
   */
  ngOnInit(): void {
    // Subscribe to car changes
    const carObj = this.data.getCar();
    if (carObj && carObj.car$) {
      carObj.car$.pipe(takeUntil(this.destroy$)).subscribe((value: ECar) => {
        this.car = value;
        this.updateDisplayState();
      });
    }

    // Subscribe to mode changes
    const modeObj = this.data.getRunMode();
    if (modeObj && modeObj.runMode$) {
      modeObj.runMode$
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: ERunMode) => {
          this.mode = value;
          this.updateDisplayState();
        });
    }

    // Subscribe to street changes
    const streetObj = this.data.getStreet();
    if (streetObj && streetObj.street$) {
      streetObj.street$
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: EStreet) => {
          this.street = value;
          this.updateDisplayState();
        });
    }

    // Subscribe to button status changes
    const buttonObj = this.data.getButton('main');
    if (buttonObj && buttonObj.buttonStatus$) {
      buttonObj.buttonStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe((status: EButtonStatus) => {
          this.buttonStatus = status;
          this.updateDisplayState();
        });
    }
  }

  /**
   * Sets up the various displays.
   */
  ngAfterViewInit(): void {
    // Initial display state setup
    this.updateDisplayState();
  }

  /**
   * Updates the display state based on current values.
   * Centralized logic for managing form visibility.
   */
  private updateDisplayState(): void {
    if (this.buttonStatus === EButtonStatus.Run) {
      this.showManualMode = false;
      switch (this.mode) {
        case ERunMode.Automated:
        case ERunMode.Keyboard:
          this.showScenarioForm = 'block';
          this.showCustomCarForm =
            this.car === ECar.Custom_Car ? 'block' : 'none';
          this.showCustomStreetForm =
            this.street === EStreet.Custom_Street ? 'block' : 'none';
          break;
        default:
          break;
      }
    }

    if (this.buttonStatus === EButtonStatus.Reset) {
      this.showScenarioForm = 'none';
      this.showCustomCarForm = 'none';
      this.showCustomStreetForm = 'none';
      switch (this.mode) {
        case ERunMode.Keyboard:
          this.showManualMode = true;
          break;
        default:
          break;
      }
    }
  }
}
