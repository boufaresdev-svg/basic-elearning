import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly languageStorageKey = 'app_language';
  readonly availableLanguages = ['fr', 'en', 'ar'];
  currentLanguage = 'fr';
  isMenuOpen = false;
  isAuthenticated = false;
  private storageListener?: () => void;

  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.initializeLanguage();

    // Check initial authentication state
    this.checkAuthState();

    // Listen for storage changes (when user logs in/out in another tab)
    this.storageListener = () => this.checkAuthState();
    window.addEventListener('storage', this.storageListener);

    // Also check periodically for auth state changes in same tab
    setInterval(() => this.checkAuthState(), 1000);
  }

  ngOnDestroy() {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
  }

  private checkAuthState() {
    this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('rememberMe');
    this.isAuthenticated = false;
    this.closeMenu();
    this.router.navigate(['/']);
  }

  changeLanguage(language: string) {
    if (!this.availableLanguages.includes(language)) {
      return;
    }

    this.currentLanguage = language;
    localStorage.setItem(this.languageStorageKey, language);
    this.translateService.use(language);
    this.setDocumentDirection(language);
  }

  private initializeLanguage() {
    const persistedLanguage = localStorage.getItem(this.languageStorageKey);
    const initialLanguage = persistedLanguage && this.availableLanguages.includes(persistedLanguage)
      ? persistedLanguage
      : 'fr';

    this.currentLanguage = initialLanguage;
    this.translateService.use(initialLanguage);
    this.setDocumentDirection(initialLanguage);
  }

  private setDocumentDirection(language: string) {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }
}
