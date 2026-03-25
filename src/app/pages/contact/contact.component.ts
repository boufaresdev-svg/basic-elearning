import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  onSubmit() {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.submitError = '';

      // Simulate form submission
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.resetForm();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 1000);
    }
  }

  private validateForm(): boolean {
    if (!this.contactForm.name.trim()) {
      this.submitError = 'CONTACT_PAGE.ERROR_NAME_REQUIRED';
      return false;
    }
    if (!this.contactForm.email.trim()) {
      this.submitError = 'CONTACT_PAGE.ERROR_EMAIL_REQUIRED';
      return false;
    }
    if (!this.contactForm.subject.trim()) {
      this.submitError = 'CONTACT_PAGE.ERROR_SUBJECT_REQUIRED';
      return false;
    }
    if (!this.contactForm.message.trim()) {
      this.submitError = 'CONTACT_PAGE.ERROR_MESSAGE_REQUIRED';
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactForm.email)) {
      this.submitError = 'CONTACT_PAGE.ERROR_EMAIL_INVALID';
      return false;
    }

    return true;
  }

  private resetForm() {
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: ''
    };
  }
}
