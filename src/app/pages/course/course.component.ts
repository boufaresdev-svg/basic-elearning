import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService, Course, CourseContent } from '../../services/supabase.service';
import { takeUntil, switchMap, of } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.css'
})
export class CourseComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  currentModule: CourseContent | null = null;
  currentModuleIndex: number = 0;
  accessKey: string = '';
  isAccessGranted: boolean = false;
  showAccessKeyInput: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Media handling
  currentVideoUrl: SafeResourceUrl | null = null;
  currentPdfUrl: SafeResourceUrl | null = null;
  showVideo: boolean = false;
  showPdf: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('CourseComponent initialized');
    this.isLoading = true;

    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const courseId = params['id'];
          console.log('Course ID from route:', courseId);
          if (!courseId) {
            this.router.navigate(['/formations']);
            return of(null);
          }
          return this.supabaseService.getCourseById(courseId);
        })
      )
      .subscribe({
        next: (course) => {
          console.log('Course received:', course);
          console.log('Setting isLoading to false');
          this.isLoading = false;

          if (course) {
            this.course = course;
            console.log('Course assigned. Has access_key:', !!course.access_key);
            console.log('Contents length:', course.contents?.length || 0);

            // Check if course has access key requirement
            if (course.access_key) {
              console.log('Course requires access key');
              this.showAccessKeyInput = true;
              this.isAccessGranted = false;
              console.log('State after setting: showAccessKeyInput=', this.showAccessKeyInput, 'isAccessGranted=', this.isAccessGranted);
            } else {
              console.log('Course is freely accessible');
              // Course is freely accessible
              this.isAccessGranted = true;
              this.showAccessKeyInput = false;
              this.loadFirstModule();
            }
          } else {
            console.log('Course is null/undefined');
            this.errorMessage = 'Cours introuvable';
          }

          // Manually trigger change detection
          this.cdr.detectChanges();
          console.log('Change detection triggered');
        },
        error: (err) => {
          console.error('Error in subscription:', err);
          this.isLoading = false;
          this.errorMessage = 'Erreur lors du chargement du cours';
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  validateAccessKey() {
    if (!this.course || !this.accessKey.trim()) {
      this.errorMessage = 'Veuillez entrer une clé d\'accès';
      return;
    }

    const courseAccessKey = this.course.access_key;
    if (this.accessKey.trim().toUpperCase() === courseAccessKey?.toUpperCase()) {
      this.isAccessGranted = true;
      this.showAccessKeyInput = false;
      this.errorMessage = '';
      this.loadFirstModule();
    } else {
      this.errorMessage = 'Clé d\'accès invalide';
    }
  }

  private loadFirstModule() {
    if (this.course && this.course.contents && this.course.contents.length > 0) {
      this.currentModuleIndex = 0;
      this.loadModule(0);
    }
  }

  loadModule(index: number) {
    if (!this.course || !this.course.contents || index < 0 || index >= this.course.contents.length) {
      return;
    }

    this.currentModuleIndex = index;
    this.currentModule = this.course.contents[index];

    // Reset media display
    this.showVideo = false;
    this.showPdf = false;
    this.currentVideoUrl = null;
    this.currentPdfUrl = null;

    // Load media if available
    if (this.currentModule.video_url) {
      this.currentVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentModule.video_url);
    }

    if (this.currentModule.pdf_url) {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentModule.pdf_url);
    }
  }

  nextModule() {
    if (this.course && this.currentModuleIndex < this.course.contents.length - 1) {
      this.loadModule(this.currentModuleIndex + 1);
    }
  }

  previousModule() {
    if (this.currentModuleIndex > 0) {
      this.loadModule(this.currentModuleIndex - 1);
    }
  }

  toggleVideo() {
    this.showVideo = !this.showVideo;
    if (this.showVideo) {
      this.showPdf = false;
    }
  }

  togglePdf() {
    this.showPdf = !this.showPdf;
    if (this.showPdf) {
      this.showVideo = false;
    }
  }

  goBack() {
    this.router.navigate(['/formations']);
  }

  getCourseProgress(): number {
    if (!this.course || !this.course.contents.length) return 0;
    return Math.round(((this.currentModuleIndex + 1) / this.course.contents.length) * 100);
  }

  getModuleTypeIcon(module: CourseContent): string {
    if (module.video_url && module.pdf_url) return '🎥📄';
    if (module.video_url) return '🎥';
    if (module.pdf_url) return '📄';
    return '📝';
  }

  getCategoryLabel(): string {
    if (!this.course) return '';

    const categoryLabels: { [key: string]: string } = {
      'thermo': 'Formations Thermo Fromage',
      'automatisme': 'Formations Automatisme',
      'process': 'Formations Process'
    };

    return categoryLabels[this.course.category] || this.course.category;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.validateAccessKey();
    }
  }
}
