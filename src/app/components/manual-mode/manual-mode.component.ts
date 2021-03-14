import { Component } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { TButtonNames } from '../../shared/types';

/**
 * Displays the manual mode button menu.
 */
@Component({
  selector: 'app-manual-mode',
  templateUrl: './manual-mode.component.html',
  styleUrls: ['./manual-mode.component.scss'],
})
export class ManualModeComponent {
  //
  buttonTexts: Map<TButtonNames, string>;

  constructor(private config: ConfigService) {
    this.buttonTexts = this.config.manualModeRunTexts;
  }
}
