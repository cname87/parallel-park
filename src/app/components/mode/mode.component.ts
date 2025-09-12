import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import {
  ERunMode,
  IRunModeForm,
  IRunMode,
  EParkMode,
  IParkMode,
  IParkModeForm,
} from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ConfigService } from '../../services/config.service';
import { ScreenService } from '../../services/screen.service';

/**
 * Displays the mode menu.
 */

@Component({
  selector: 'app-mode',
  templateUrl: './mode.component.html',
  styleUrls: ['./mode.component.scss'],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatRadioModule,
  ],
})
export class ModeComponent implements OnInit {
  /* Form variables */
  modeForm!: FormGroup;
  #runModeInitialFormValue: IRunModeForm;
  #parkModeInitialFormValue: IParkModeForm;
  #runMode$!: Observable<ERunMode>;
  #runMode!: IRunMode;
  #parkMode$!: Observable<EParkMode>;
  #parkMode!: IParkMode;

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private config: ConfigService,
    private screen: ScreenService,
  ) {
    this.#runModeInitialFormValue = { runMode: ERunMode.Single };
    this.#parkModeInitialFormValue = { parkMode: EParkMode.Parallel };
  }

  ngOnInit(): void {
    /* Initialize the form */
    this.modeForm = this.formBuilder.group({
      runMode: [this.#runModeInitialFormValue.runMode],
      parkMode: [this.#parkModeInitialFormValue.parkMode],
    });

    this.#runMode$ = this.modeForm.valueChanges.pipe(
      startWith({ runMode: this.#runModeInitialFormValue.runMode }),
      map((modeFormValue: { runMode: ERunMode }) => modeFormValue.runMode),
      shareReplay(1),
    );
    this.#runMode = {
      modeForm: this.modeForm,
      runMode$: this.#runMode$,
    };
    this.data.setRunMode(this.#runMode);

    this.#parkMode$ = this.modeForm.valueChanges.pipe(
      startWith({ parkMode: this.#parkModeInitialFormValue.parkMode }),
      map((modeFormValue: { parkMode: EParkMode }) => modeFormValue.parkMode),
      shareReplay(1),
    );
    this.#parkMode = {
      modeForm: this.modeForm,
      parkMode$: this.#parkMode$,
    };
    this.data.setParkMode(this.#parkMode);
  }
}
