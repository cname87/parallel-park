import { AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatHint, MatLabel, MatError } from '@angular/material/form-field';
import { Component } from '@angular/core';
import { EButtonStatus, ECar, EMode, EStreet } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ModeComponent } from '../mode/mode.component';
import { ButtonComponent } from '../button/button.component';
import { ManualModeComponent } from '../manual-mode/manual-mode.component';

/**
 * This component displays the selection menus.
 */

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    // MatHint, MatLabel, MatError are included via MatFormFieldModule in recent Angular Material versions
    ModeComponent,
    ButtonComponent,
    ManualModeComponent,
  ],
})
export class MenuComponent implements AfterViewInit {
  constructor(private data: DataService) {}

  showScenarioForm: 'none' | 'block' = 'block';
  showCustomCarForm: 'none' | 'block' = 'none';
  showCustomStreetForm: 'none' | 'block' = 'none';
  showManualMode = false;

  /**
   * Sets up the various displays.
   */

  ngAfterViewInit(): void {
    let buttonStatus: EButtonStatus;
    let mode: EMode;
    let car: ECar;
    let street: EStreet;
    this.data.getMode().mode$.subscribe((value: EMode) => {
      mode = value;
      if (mode === EMode.Loop && buttonStatus === EButtonStatus.Run) {
        this.showScenarioForm = 'block';
        this.showCustomCarForm = 'none';
        this.showCustomStreetForm = 'none';
      }
      if (mode === EMode.Single && buttonStatus === EButtonStatus.Run) {
        this.showScenarioForm = 'block';
      }
      if (mode === EMode.Keyboard && buttonStatus === EButtonStatus.Run) {
        this.showScenarioForm = 'block';
      }
    });
    this.data.getCar().car$.subscribe((value: ECar) => {
      car = value;
      if (value === ECar.Custom_Car && buttonStatus === EButtonStatus.Run) {
        this.showCustomCarForm = 'block';
      } else {
        this.showCustomCarForm = 'none';
      }
    });
    this.data.getStreet().street$.subscribe((value: EStreet) => {
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
    this.data
      .getButton('main')
      .buttonStatus$.subscribe((status: EButtonStatus) => {
        buttonStatus = status;
        if (status === EButtonStatus.Run) {
          this.showManualMode = false;
          switch (mode) {
            case EMode.Single:
            case EMode.Keyboard:
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
            case EMode.Loop:
              this.showScenarioForm = 'block';
              break;
            case EMode.Keyboard:
              this.showManualMode = true;
              break;
            default:
              break;
          }
        }
      });
  }
}
