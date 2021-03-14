import { Component, OnInit } from '@angular/core';
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
    this.#runLoopTest === true
      ? (this.#modeInitialFormValue = { mode: EMode.Loop })
      : (this.#modeInitialFormValue = { mode: EMode.Single });
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
