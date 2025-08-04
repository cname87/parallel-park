import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material/material.module';

import { AppComponent } from '../components/root/root.component';
import { ModeComponent } from '../components/mode/mode.component';
import { ManoeuvreComponent } from '../components/manoeuvre/manoeuvre.component';
import { MenuComponent } from '../components/menu/menu.component';
import { ButtonComponent } from '../components/button/button.component';
import { CarComponent } from '../components/car/car.component';
import { StreetComponent } from '../components/street/street.component';
import { CustomCarComponent } from '../components/customCar/custom-car.component';
import { CustomStreetComponent } from '../components/customStreet/custom-street.component';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../services/snackbar.service';
import { ManualModeComponent } from '../components/manual-mode/manual-mode.component';

@NgModule({
  declarations: [],
  imports: [
    AppComponent,
    BrowserModule,
    BrowserAnimationsModule,
    ButtonComponent,
    CarComponent,
    CustomCarComponent,
    CustomStreetComponent,
    ManoeuvreComponent,
    ManualModeComponent,
    MenuComponent,
    ModeComponent,
    StreetComponent,
    FlexLayoutModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSnackBarModule,
  ],
  providers: [
    {
      provide: MatSnackBarModule,
      useValue: {},
    },
    SnackbarService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
