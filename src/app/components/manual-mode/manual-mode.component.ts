import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ConfigService } from '../../services/config.service';
import { TButtonNames } from '../../shared/types';
import { ButtonComponent } from '../button/button.component';

/**
 * Displays the manual mode button menu.
 */
@Component({
  selector: 'app-manual-mode',
  templateUrl: './manual-mode.component.html',
  styleUrls: ['./manual-mode.component.scss'],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    // MatHint, MatLabel, MatError are included via MatFormFieldModule in recent Angular Material versions
    ButtonComponent,
  ],
})
export class ManualModeComponent {
  //
  buttonTexts: Map<TButtonNames, string>;

  constructor(private config: ConfigService) {
    this.buttonTexts = this.config.manualModeRunTexts;
  }
}
