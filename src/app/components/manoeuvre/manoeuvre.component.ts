import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
} from 'rxjs/operators';
import {
  EMode,
  EManoeuvre,
  IManoeuvre,
  IManoeuvreForm,
} from '../../shared/types';
import { DataService } from '../../services/data.service';
import { ObjectsService } from '../../services/objects.service';

/**
 * Displays the manoeuvre menu.
 */

@Component({
  selector: 'app-manoeuvre',
  templateUrl: './manoeuvre.component.html',
  styleUrls: ['./manoeuvre.component.scss'],
})
export class ManoeuvreComponent implements OnInit {
  manoeuvres: Array<[EManoeuvre, string]>;
  manoeuvreForm!: FormGroup;
  #manoeuvreInitialFormValue: IManoeuvreForm;
  #manoeuvre$!: Observable<EManoeuvre>;
  #manoeuvre!: IManoeuvre;
  message = '';
  hint = '';

  constructor(
    private formBuilder: FormBuilder,
    private data: DataService,
    private objects: ObjectsService,
  ) {
    this.manoeuvres = this.objects.manoeuvres;

    /* Note that the select group formControlName is 'manoeuvre' */
    this.#manoeuvreInitialFormValue = {
      manoeuvre: this.manoeuvres[0][0],
    };
  }

  ngOnInit(): void {
    this.manoeuvreForm = this.formBuilder.group(
      this.#manoeuvreInitialFormValue,
    );
    this.#manoeuvre$ = this.manoeuvreForm.valueChanges.pipe(
      startWith(this.#manoeuvreInitialFormValue),
      map((manoeuvreFormValue: IManoeuvreForm) => manoeuvreFormValue.manoeuvre),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.#manoeuvre = {
      manoeuvreForm: this.manoeuvreForm,
      manoeuvre$: this.#manoeuvre$,
      manoeuvreInitialFormValue: this.#manoeuvreInitialFormValue,
    };
    this.data.setManoeuvre(this.#manoeuvre);

    /* Customise input heading and hint messages */
    this.data.getMode().mode$.subscribe((value: EMode) => {
      if (value === EMode.Keyboard) {
        this.message = 'Select a manoeuvre, which sets the parking space width';
        this.hint =
          'Select a custom street to set a custom parking space width';
      } else {
        this.message = 'Select a parking manoeuvre';
        this.hint = 'The set of possible parking manoeuvres';
      }
    });
  }
}
