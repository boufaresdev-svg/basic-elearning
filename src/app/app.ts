import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'e-learning-basique';

  constructor(private translateService: TranslateService) {
    const supportedLanguages = ['fr', 'en', 'ar'];
    const persistedLanguage = localStorage.getItem('app_language');
    const initialLanguage = persistedLanguage && supportedLanguages.includes(persistedLanguage)
      ? persistedLanguage
      : 'fr';

    this.translateService.use(initialLanguage);
    document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = initialLanguage;
  }
}
