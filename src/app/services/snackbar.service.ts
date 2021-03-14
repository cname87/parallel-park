import { Injectable, NgZone } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { Subject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  EButtonStatus,
  EMode,
  ISnackOpen,
  LoggingLevel,
} from '../shared/types';
import { ConfigService } from './config.service';
import { DataService } from './data.service';
import { LoggerService } from './logger.service';

/**
 * Provides a service to display on-screen messages.
 */

@Injectable()
export class SnackbarService {
  constructor(
    private config: ConfigService,
    private data: DataService,
    private logger: LoggerService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
  ) {
    this.#pause = false;
    this.addMouseEvents();
  }

  #pauseSubject: Subject<MatSnackBarRef<TextOnlySnackBar>> = new Subject();
  #pause: boolean;
  #infoSubject: Subject<MatSnackBarRef<TextOnlySnackBar>> = new Subject();
  public pause$: Observable<
    MatSnackBarRef<TextOnlySnackBar>
  > = this.#pauseSubject.asObservable();
  public info$: Observable<
    MatSnackBarRef<TextOnlySnackBar>
  > = this.#infoSubject.asObservable();
  #buttonLastClickStatus = EButtonStatus.Reset;
  #mode = EMode.Keyboard;

  /* Subscribe to track the operation mode */
  public trackMode(): void {
    this.data
      .getMode()
      .mode$.pipe(
        this.logger.tapLog('Snackbar Service Mode click:', LoggingLevel.DEBUG),
      )
      .subscribe((data: EMode) => {
        this.#mode = data;
      });
  }

  /* Track the button status */
  /* Called by the root program when the button is enabled */
  public trackButton(): void {
    this.data
      .getButton('main')
      .buttonLastClick$.pipe(
        this.logger.tapLog(
          'Snackbar Service Button click:',
          LoggingLevel.DEBUG,
        ),
      )
      .subscribe((data: EButtonStatus) => {
        this.#buttonLastClickStatus = data;
      });
  }

  /* Add all mouse events that interact with the grid here */
  private addMouseEvents() {
    this.config.stage.on('stagemousedown', (event: unknown) => {
      const eventTyped = event as { stageX: number; stageY: number };
      const message = `The canvas was paused by a click at X: ${this.config.round(
        (eventTyped.stageX * this.config.distScale) / 1000,
        1,
      )}m  Y: ${this.config.round(
        (eventTyped.stageY * this.config.distScale) / 1000,
        1,
      )}m`;
      /* Run pause notice only when running in single scenario mode & a pause message not already showing */
      if (
        this.#mode === EMode.Single &&
        this.#buttonLastClickStatus === EButtonStatus.Run &&
        !this.#pause
      ) {
        this.open({
          message,
          snackConfig: {
            duration: 0,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
          pause: true,
        });
      }
    });
  }

  public open({
    message,
    snackConfig: config = {
      duration: this.config.infoMessageDuration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    },
    pause = false,
  }: ISnackOpen): void {
    /* No snackbar is presented if '' is passed in as the message */
    if (message === '') {
      return;
    }
    let action = '';
    if (pause === true) {
      action = 'RESUME';
    }
    this.zone.run(() => {
      const snackRef = this.snackBar.open(message, action, {
        duration: config.duration,
        horizontalPosition: config.horizontalPosition,
        verticalPosition: config.verticalPosition,
        panelClass: 'snackBar',
      });

      if (pause) {
        this.#pause = true;
        this.#pauseSubject.next(snackRef);
        snackRef
          .onAction()
          .pipe(take(1))
          .subscribe(() => {
            snackRef.dismiss();
            this.#pause = false;
          });
        snackRef
          .afterDismissed()
          .pipe(take(1))
          .subscribe(() => {
            this.#pause = false;
          });
      } else {
        this.#infoSubject.next(snackRef);
      }
    });
  }
}
