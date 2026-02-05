import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  // Hardcoded admin credentials
  private readonly ADMIN_USERNAME = 'sms2iadmin@sms2i.com';
  private readonly ADMIN_PASSWORD = 'mahdianas123';

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  private returnUrl: string = '/admin';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return url from route parameters or default to '/admin'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';

    // Check if already authenticated
    if (localStorage.getItem('isAuthenticated') === 'true') {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Accept any login credentials (using fake data)
    setTimeout(() => {
      // Login successful
      this.isLoading = false;

      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', this.email);
      
      // Extract name from email
      const userName = this.email.split('@')[0].replace(/[._]/g, ' ');
      localStorage.setItem('userName', userName);

      // Check if admin
      if (this.email === this.ADMIN_USERNAME && this.password === this.ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        this.router.navigate(['/admin']);
      } else {
        localStorage.setItem('isAdmin', 'false');
        this.router.navigate(['/dashboard']);
      }

      if (this.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
    }, 800);
  }
}
