import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingLevel } from '../shared/types';
import { ConfigService } from './config.service';

/**
 * Provides a service to log messages to console.
 * Manually edit the initial logging
 */

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  #loggingLevel: LoggingLevel;

  constructor(private config: ConfigService) {
    /* This sets the logging level used */
    this.#loggingLevel = this.config.loggingLevel;
  }

  setLoggingLevel = (level: LoggingLevel): void => {
    this.#loggingLevel = level;
  };

  readLogginglevel = (): LoggingLevel => {
    return this.#loggingLevel;
  };

  log = (message: string, level = LoggingLevel.DEBUG): void => {
    if (level >= this.#loggingLevel) {
      switch (level) {
        case LoggingLevel.TRACE:
          console.log(message);
          break;
        case LoggingLevel.DEBUG:
          console.log(message);
          break;
        case LoggingLevel.INFO:
          console.log(message);
          break;
        case LoggingLevel.ERROR:
          console.error(message);
          break;
        default:
          break;
      }
    }
  };

  tapLog =
    (message: string, level: LoggingLevel = LoggingLevel.DEBUG) =>
    (source: Observable<any>): Observable<any> =>
      source.pipe(
        tap((val) => {
          if (level >= this.#loggingLevel) {
            switch (level) {
              case LoggingLevel.TRACE:
                console.log(`${message}\nValue: ${val}`);
                break;
              case LoggingLevel.DEBUG:
                console.log(`${message}\nValue: ${val}`);
                break;
              case LoggingLevel.INFO:
                console.log(`${message}\nValue: ${val}`);
                break;
              case LoggingLevel.ERROR:
                console.error(`${message}\nValue: ${val}`);
                break;
              default:
                break;
            }
          }
        }),
      );
}
