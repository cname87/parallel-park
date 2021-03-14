import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './root.component';
import { CarService } from '../../services/car.service';
import { ConfigService } from '../../services/config.service';
import { GridService } from '../../services/grid.service';
import { ManoeuvreService } from '../../services/manoeuvres/manoeuvre.service';
import { StreetService } from '../../services/street.service';

class MockConfigService {
  round3 = () => null;
}

class MockGridService {
  createGrid = () => null;
  addAxesValues = () => null;
  addMouseEvents = () => null;
}

class MockStreetService {
  update = () => null;
  drawStreet = () => null;
}

class MockCarService {
  update = () => null;
  draw = () => null;
}

class MockManoeuvreService {
  getManoeuvre = () => {
    return {
      parkingSpaceLength: 'dummy',
      startPosition: 'dummy',
    };
  };
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      // provide the component-under-test and dependent service
      providers: [
        AppComponent,
        { provide: ConfigService, useClass: MockConfigService },
        { provide: GridService, useClass: MockGridService },
        { provide: StreetService, useClass: MockStreetService },
        { provide: CarService, useClass: MockCarService },
        { provide: ManoeuvreService, useClass: MockManoeuvreService },
      ],
    }).compileComponents();
    // inject both the component and the dependent service.
    const comp = TestBed.inject(AppComponent);
    comp.ngAfterViewInit = () => new Promise(() => null);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'parallel-park'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('parallel-park');
  });
});
