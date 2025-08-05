import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/components/root/root.component';
import { environment } from './environments/environment';
import { SnackbarService } from './app/services/snackbar.service';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    SnackbarService,
    // ...add other providers here if needed...
  ],
}).catch((err) => console.error(err));
