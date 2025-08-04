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
import { EMode, IModeForm, IMode } from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ConfigService } from '../../services/config.service';

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
    // MatHint, MatLabel, MatError are included via MatFormFieldModule in recent Angular Material versions
    MatRadioModule,
  ],
})
export class ModeComponent implements OnInit {
  //
  /* Set to true to start in loop mode for testing */
  #runLoopTest: boolean;

  /* Form variables */
  modeForm!: FormGroup;
  #modeInitialFormValue: IModeForm;
  #mode$!: Observable<EMode>;
  #mode!: IMode;

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private config: ConfigService,
  ) {
    this.#runLoopTest = this.config.runLoopTest;
    /* Note that the radio group formControlName is 'mode' */
    if (this.#runLoopTest === true) {
      this.#modeInitialFormValue = { mode: EMode.Loop };
    } else {
      this.#modeInitialFormValue = { mode: EMode.Single };
    }
  }

  ngOnInit(): void {
    this.modeForm = this.formBuilder.group(this.#modeInitialFormValue);
    this.#mode$ = this.modeForm.valueChanges.pipe(
      startWith(this.#modeInitialFormValue),
      map((modeFormValue: IModeForm) => modeFormValue.mode),
      shareReplay(1),
    );
    this.#mode = {
      modeForm: this.modeForm,
      mode$: this.#mode$,
    };
    this.data.setMode(this.#mode);
  }
}
