import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

import { ThemePalette } from '@angular/material/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EButtonStatus, IButton, TButtonNames } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ConfigService } from '../../services/config.service';

/**
 * Provides button functionality.
 */

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    // MatHint, MatLabel, MatError are included via MatFormFieldModule in recent Angular Material versions
    MatButtonModule,
  ],
})
export class ButtonComponent implements OnInit {
  //
  /* Button variables */
  @Input()
  buttonName!: TButtonNames;

  buttonText!: string | undefined;
  buttonColor: ThemePalette;
  isDisabled!: boolean;

  private buttonStatus = new BehaviorSubject<EButtonStatus>(EButtonStatus.Run);
  private buttonStatus$ = this.buttonStatus.asObservable();

  private buttonClickSubject: Subject<EButtonStatus> = new Subject();
  private buttonLastClick$: Observable<EButtonStatus> =
    this.buttonClickSubject.asObservable();

  private textsRun = this.config.allButtonTexts;

  /* Button can be enabled after ViewInit when the name has been passed in */
  constructor(
    private config: ConfigService,
    private data: DataService,
  ) {}

  private enableRun = (): void => {
    this.buttonText = this.textsRun.get(this.buttonName);
    this.buttonColor = 'primary';
    this.isDisabled = false;
    this.buttonStatus.next(EButtonStatus.Run);
  };

  private enableReset = (): void => {
    this.buttonText = this.buttonName === 'main' ? 'RESET' : 'Stop';
    this.buttonColor = 'warn';
    this.isDisabled = false;
    this.buttonStatus.next(EButtonStatus.Reset);
  };

  private disable = (): void => {
    this.buttonText = 'Wait';
    this.isDisabled = true;
    this.buttonStatus.next(EButtonStatus.Disabled);
  };

  public onClick = (_event: MouseEvent): void => {
    console.log('Button clicked:', this.buttonName);
    /* Report the button status when the button was clicked */
    this.buttonClickSubject.next(this.buttonStatus.getValue());
  };

  /* The object passed to subscribers */
  private button: IButton = {
    /* Marks the button 'Run' and enables the button */
    enableRun: this.enableRun,
    /* Marks the button 'Reset' and enables the button */
    enableReset: this.enableReset,
    /* Marks the button 'Wait' and disables the button */
    disable: this.disable,
    /* Button status observable */
    buttonStatus$: this.buttonStatus$,
    /* A click can be detected and the button status at the time of the click can be read from here */
    buttonLastClick$: this.buttonLastClick$,
  };

  ngOnInit(): void {
    this.enableRun();
    this.data.setButton(this.buttonName, this.button);
  }
}
