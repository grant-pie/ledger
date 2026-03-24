import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  standalone: false,
})
export class AppComponent {
  // Injecting ThemeService here ensures it is instantiated (and the saved
  // theme applied to <html>) before any child route renders.
  constructor(public themeService: ThemeService) {}
}
