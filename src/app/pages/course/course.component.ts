import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService, Course, CourseContent, Quiz, QuizQuestion } from '../../services/supabase.service';
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

  // Quiz handling
  isQuizActive: boolean = false;
  currentQuiz: Quiz | null = null;
  quizAnswers: { [questionId: string]: string | string[] } = {};
  quizStartTime: Date | null = null;
  quizTimeRemaining: number = 0;
  quizTimerInterval: any = null;
  showQuizResults: boolean = false;
  quizScore: number = 0;
  quizTotalPoints: number = 0;
  quizPassed: boolean = false;

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
    this.stopQuizTimer();
  }

  // Quiz Methods
  startQuiz() {
    if (!this.currentModule || !this.currentModule.quiz) return;

    this.currentQuiz = this.currentModule.quiz;
    this.isQuizActive = true;
    this.showQuizResults = false;
    this.quizAnswers = {};
    this.quizStartTime = new Date();

    // Start timer if quiz has time limit
    if (this.currentQuiz.timeLimit) {
      this.quizTimeRemaining = this.currentQuiz.timeLimit * 60; // Convert to seconds
      this.startQuizTimer();
    }

    // Reset media display when starting quiz
    this.showVideo = false;
    this.showPdf = false;
  }

  startQuizTimer() {
    this.quizTimerInterval = setInterval(() => {
      if (this.quizTimeRemaining > 0) {
        this.quizTimeRemaining--;
      } else {
        this.submitQuiz(); // Auto-submit when time runs out
      }
    }, 1000);
  }

  stopQuizTimer() {
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }
  }

  getQuizTimerDisplay(): string {
    const minutes = Math.floor(this.quizTimeRemaining / 60);
    const seconds = this.quizTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  selectAnswer(questionId: string, answer: string) {
    this.quizAnswers[questionId] = answer;
  }

  toggleMultipleChoice(questionId: string, option: string) {
    if (!this.quizAnswers[questionId]) {
      this.quizAnswers[questionId] = [];
    }

    const answers = this.quizAnswers[questionId] as string[];
    const index = answers.indexOf(option);

    if (index > -1) {
      answers.splice(index, 1);
    } else {
      answers.push(option);
    }
  }

  isOptionSelected(questionId: string, option: string): boolean {
    const answer = this.quizAnswers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(option);
    }
    return answer === option;
  }

  canSubmitQuiz(): boolean {
    if (!this.currentQuiz) return false;

    // Check if all questions are answered
    return this.currentQuiz.questions.every(q => {
      const answer = this.quizAnswers[q.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer && answer.trim().length > 0;
    });
  }

  submitQuiz() {
    if (!this.currentQuiz) return;

    this.stopQuizTimer();

    // Calculate score
    let score = 0;
    const totalPoints = this.currentQuiz.questions.reduce((sum, q) => sum + q.points, 0);

    this.currentQuiz.questions.forEach(question => {
      const userAnswer = this.quizAnswers[question.id];
      const correctAnswer = question.correctAnswer;

      let isCorrect = false;

      if (Array.isArray(correctAnswer)) {
        // Multiple correct answers
        if (Array.isArray(userAnswer)) {
          const sortedUserAnswer = [...userAnswer].sort();
          const sortedCorrectAnswer = [...correctAnswer].sort();
          isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
        }
      } else {
        // Single correct answer
        if (question.type === 'short-answer') {
          isCorrect = userAnswer?.toString().trim().toLowerCase() === correctAnswer.toLowerCase();
        } else {
          isCorrect = userAnswer === correctAnswer;
        }
      }

      if (isCorrect) {
        score += question.points;
      }
    });

    this.quizScore = score;
    this.quizTotalPoints = totalPoints;
    this.quizPassed = (score / totalPoints) * 100 >= this.currentQuiz.passingScore;
    this.showQuizResults = true;
    this.isQuizActive = false;

    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retakeQuiz() {
    if (this.currentQuiz?.allowRetake) {
      this.startQuiz();
    }
  }

  exitQuiz() {
    this.isQuizActive = false;
    this.showQuizResults = false;
    this.currentQuiz = null;
    this.quizAnswers = {};
    this.stopQuizTimer();
  }

  isAnswerCorrect(questionId: string): boolean {
    if (!this.currentQuiz || !this.showQuizResults) return false;

    const question = this.currentQuiz.questions.find(q => q.id === questionId);
    if (!question) return false;

    const userAnswer = this.quizAnswers[questionId];
    const correctAnswer = question.correctAnswer;

    if (Array.isArray(correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        const sortedUserAnswer = [...userAnswer].sort();
        const sortedCorrectAnswer = [...correctAnswer].sort();
        return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
      }
      return false;
    } else {
      if (question.type === 'short-answer') {
        return userAnswer?.toString().trim().toLowerCase() === correctAnswer.toLowerCase();
      }
      return userAnswer === correctAnswer;
    }
  }

  getQuestionScore(questionId: string): number {
    return this.isAnswerCorrect(questionId)
      ? this.currentQuiz?.questions.find(q => q.id === questionId)?.points || 0
      : 0;
  }

  getQuizPercentage(): number {
    if (this.quizTotalPoints === 0) return 0;
    return Math.round((this.quizScore / this.quizTotalPoints) * 100);
  }

  validateAccessKey() {
    console.log('validateAccessKey called');
    if (!this.course || !this.accessKey.trim()) {
      this.errorMessage = 'Veuillez entrer une clé d\'accès';
      return;
    }

    const courseAccessKey = this.course.access_key;
    console.log('Entered key:', this.accessKey.trim().toUpperCase());
    console.log('Expected key:', courseAccessKey?.toUpperCase());

    if (this.accessKey.trim().toUpperCase() === courseAccessKey?.toUpperCase()) {
      console.log('Access key is valid! Granting access...');
      this.isAccessGranted = true;
      this.showAccessKeyInput = false;
      this.errorMessage = '';
      this.loadFirstModule();
      console.log('After loadFirstModule - showVideo:', this.showVideo, 'showPdf:', this.showPdf);
      this.cdr.detectChanges();
    } else {
      console.log('Access key is invalid');
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

    console.log('Loading module:', this.currentModule);
    console.log('Module has quiz:', !!this.currentModule.quiz);
    if (this.currentModule.quiz) {
      console.log('Quiz details:', this.currentModule.quiz);
    }

    // Reset media display
    this.showVideo = false;
    this.showPdf = false;
    this.currentVideoUrl = null;
    this.currentPdfUrl = null;

    // Load media if available - handle both snake_case and camelCase
    const videoUrl = (this.currentModule as any).video_url || (this.currentModule as any).videoUrl;
    const pdfUrl = (this.currentModule as any).pdf_url || (this.currentModule as any).pdfUrl;

    console.log('Video URL:', videoUrl);
    console.log('PDF URL:', pdfUrl);

    if (videoUrl) {
      this.currentVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
      // Automatically show video if available
      this.showVideo = true;
      console.log('Video will be shown');
    }

    if (pdfUrl) {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
      // If no video, automatically show PDF
      if (!videoUrl) {
        this.showPdf = true;
        console.log('PDF will be shown (no video)');
      }
    }

    console.log('Final state - showVideo:', this.showVideo, 'showPdf:', this.showPdf);

    // Trigger change detection
    this.cdr.detectChanges();
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
    let icon = '';

    if (module.video_url) icon += '🎥';
    if (module.pdf_url) icon += '📄';
    if (module.quiz) icon += '�';

    return icon || '�';
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
