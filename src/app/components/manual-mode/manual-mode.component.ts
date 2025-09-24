import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
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
    ButtonComponent,
  ],
})
export class ManualModeComponent {
  //

  constructor() {}
}
