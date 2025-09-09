import { Component, AfterViewInit } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { ScreenService } from '../../services/screen.service';

@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  standalone: true,
  imports: [MenuComponent],
})
export class AppComponent implements AfterViewInit {
  constructor(private screen: ScreenService) {}
  async ngAfterViewInit(): Promise<void> {
    await this.screen.start();
  }
}
