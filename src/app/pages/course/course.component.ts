import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService, Course, CourseContent, Quiz, QuizQuestion, DiscussionQuestion, DiscussionReply } from '../../services/supabase.service';
import { FormationApiService } from '../../services/formation-api.service';
import { takeUntil, switchMap, of, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface for grouped content structure
export interface ContentGroup {
  objectifSpecifiqueId: string;
  objectifSpecifiqueTitle: string;
  objectifSpecifiqueDescription?: string;
  contents: CourseContent[];
  expanded: boolean;
}

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
  showAccessKeyInput: boolean = false;
  showDetails: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Grouped content by objectif spécifique
  contentGroups: ContentGroup[] = [];
  groupedView: boolean = true; // Toggle for grouped vs flat view

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

  activeTab: 'overview' | 'qa' | 'notes' = 'overview';

  // Discussion Forum
  discussions: DiscussionQuestion[] = [];
  newQuestion: string = '';
  replyText: { [key: string]: string } = {};
  showReplyBox: { [key: string]: boolean } = {};
  currentUserId: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private formationApiService: FormationApiService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('CourseComponent initialized');
    this.isLoading = true;
    this.currentUserId = localStorage.getItem('userEmail') || '';

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
          // Fetch from Formation API instead of Supabase
          return this.formationApiService.getFormationById(+courseId).pipe(
            map(formationResponse => {
              console.log('Formation API response:', formationResponse);

              // Handle case where API returns array instead of single object
              let formation = formationResponse;
              if (Array.isArray(formationResponse)) {
                if (formationResponse.length === 0) {
                  return null;
                }
                // If nested array like [[{...}]]
                if (Array.isArray(formationResponse[0])) {
                  formation = formationResponse[0][0];
                } else {
                  formation = formationResponse[0];
                }
              }

              if (!formation) {
                return null;
              }

              // Convert formation to Course format
              const mappedCourse = this.formationApiService.mapFormationToCourse(formation);
              return {
                ...mappedCourse,
                contents: [] // Will be populated from API later
              } as Course;
            })
          );
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

            // Fetch course contents from API
            if (course.id) {
              this.loadCourseContents(+course.id);
            }

            // Check if course has access key requirement
            if (course.access_key === 'locked' || (course.access_key && course.access_key !== 'open')) {
              console.log('Course requires access key');
              this.isAccessGranted = false;
            } else {
              console.log('Course is freely accessible');
              this.isAccessGranted = true;
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

  // Load course contents from API grouped by objectif spécifique
  loadCourseContents(formationId: number): void {
    console.log('Loading course contents for formation:', formationId);

    // First, fetch global contents which contain objectifs spécifiques
    this.formationApiService.getContenuGlobalByFormation(formationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (globalContents) => {
          console.log('Global contents received:', globalContents);
          
          // Flatten if nested array
          let contenuGlobaux = globalContents;
          if (Array.isArray(globalContents) && Array.isArray(globalContents[0])) {
            contenuGlobaux = globalContents[0];
          }

          if (contenuGlobaux && contenuGlobaux.length > 0) {
            // For each contenu global, fetch its objectifs spécifiques
            const groupRequests = contenuGlobaux.map((contenuGlobal: any) => 
              this.formationApiService.getObjectifsSpecifiquesByContenu(contenuGlobal.idContenuGlobal).pipe(
                map(objectifs => ({
                  contenuGlobal,
                  objectifs: Array.isArray(objectifs) && Array.isArray(objectifs[0]) ? objectifs[0] : objectifs
                }))
              )
            );

            forkJoin(groupRequests).subscribe({
              next: (results) => {
                console.log('Objectifs spécifiques received:', results);
                this.buildContentGroups(results, formationId);
              },
              error: (error) => {
                console.error('Error loading objectifs spécifiques:', error);
                this.loadFlatContents(formationId);
              }
            });
          } else {
            console.log('No global contents, loading flat structure...');
            this.loadFlatContents(formationId);
          }
        },
        error: (error) => {
          console.error('Error loading global contents:', error);
          this.loadFlatContents(formationId);
        }
      });
  }

  private buildContentGroups(results: any[], formationId: number): void {
    const allContentRequests: any[] = [];
    const groupStructure: any[] = [];

    // Build the group structure and collect content requests
    results.forEach(({ contenuGlobal, objectifs }) => {
      if (objectifs && objectifs.length > 0) {
        objectifs.forEach((objectif: any) => {
          groupStructure.push({
            objectifSpecifiqueId: objectif.idObjectifSpecifique?.toString() || 'unknown',
            objectifSpecifiqueTitle: objectif.descriptionObjectifSpecifique || objectif.titre || 'Objectif',
            objectifSpecifiqueDescription: objectif.description,
            contents: [],
            expanded: true
          });

          // Fetch contenu jour for this objectif
          allContentRequests.push(
            this.formationApiService.getContenuJourByObjectifSpecifique(objectif.idObjectifSpecifique).pipe(
              switchMap(joursResponse => {
                const jours = Array.isArray(joursResponse) && Array.isArray(joursResponse[0]) ? joursResponse[0] : joursResponse;
                if (jours && jours.length > 0) {
                  // For each jour, fetch detailed contents
                  const detailRequests = jours.map((jour: any) =>
                    this.formationApiService.getContenuDetailleByJour(jour.idContenuJour).pipe(
                      map(details => ({
                        objectifId: objectif.idObjectifSpecifique,
                        details: Array.isArray(details) && Array.isArray(details[0]) ? details[0] : details
                      }))
                    )
                  );
                  return forkJoin(detailRequests);
                }
                return of([]);
              })
            )
          );
        });
      }
    });

    // Execute all content requests
    if (allContentRequests.length > 0) {
      forkJoin(allContentRequests).subscribe({
        next: (allDetails: any[]) => {
          console.log('All detailed contents received:', allDetails);
          
          // Flatten and group by objectif
          allDetails.forEach((detailGroup: any[]) => {
            if (Array.isArray(detailGroup)) {
              detailGroup.forEach(({ objectifId, details }) => {
                if (details && details.length > 0) {
                  const group = groupStructure.find(g => g.objectifSpecifiqueId === objectifId?.toString());
                  if (group) {
                    details.forEach((detail: any) => {
                      group.contents.push({
                        id: detail.idContenuDetaille?.toString() || `detail-${Math.random()}`,
                        title: detail.titre || detail.titreContenu || 'Contenu',
                        description: detail.description || detail.descriptionContenu || '',
                        video_url: detail.videoUrl || detail.urlVideo,
                        pdf_url: detail.pdfUrl || detail.urlPdf,
                        duration: detail.duree || detail.duration,
                        quiz: undefined
                      });
                    });
                  }
                }
              });
            }
          });

          this.contentGroups = groupStructure.filter(g => g.contents.length > 0);
          console.log('Content groups built:', this.contentGroups);

          // Build flat contents list for compatibility
          if (this.course) {
            this.course.contents = this.contentGroups.flatMap(g => g.contents);
            if (this.course.contents.length > 0) {
              this.loadModule(0);
            }
          }
        },
        error: (error) => {
          console.error('Error building content groups:', error);
          this.loadFlatContents(formationId);
        }
      });
    } else {
      console.log('No content requests, loading flat structure...');
      this.loadFlatContents(formationId);
    }
  }

  private loadFlatContents(formationId: number): void {
    // Fallback to flat structure
    this.formationApiService.getContenuDetailleByFormation(formationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contents) => {
          let flatContents = contents;
          if (Array.isArray(contents) && Array.isArray(contents[0])) {
            flatContents = contents[0];
          }

          if (flatContents && flatContents.length > 0) {
            const mappedContents = flatContents.map((content: any, index: number) => ({
              id: content.idContenuDetaille?.toString() || `content-${index}`,
              title: content.titre || content.titreContenu || `Module ${index + 1}`,
              description: content.description || content.descriptionContenu || '',
              video_url: content.videoUrl || content.urlVideo,
              pdf_url: content.pdfUrl || content.urlPdf,
              duration: content.duree || content.duration,
              quiz: undefined
            }));

            if (this.course) {
              this.course.contents = mappedContents;
              this.groupedView = false; // Disable grouped view
              if (mappedContents.length > 0) {
                this.loadModule(0);
              }
            }
          }
        },
        error: (error) => {
          console.error('Error loading flat contents:', error);
        }
      });
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

  startCourse() {
    if (this.isAccessGranted) {
      this.showDetails = false;
      this.loadFirstModule();
    } else {
      this.showDetails = false;
      this.showAccessKeyInput = true;
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

  loadModuleById(moduleId: string) {
    if (!this.course || !this.course.contents) return;
    
    const index = this.course.contents.findIndex(m => m.id === moduleId);
    if (index !== -1) {
      this.loadModule(index);
    }
  }

  isModuleCompleted(moduleId: string): boolean {
    if (!this.course || !this.course.contents) return false;
    
    const moduleIndex = this.course.contents.findIndex(m => m.id === moduleId);
    return moduleIndex !== -1 && moduleIndex < this.currentModuleIndex;
  }

  toggleGroup(groupId: string) {
    const group = this.contentGroups.find(g => g.objectifSpecifiqueId === groupId);
    if (group) {
      group.expanded = !group.expanded;
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
    let icon = '';

    if (module.video_url) icon += '🎥';
    if (module.pdf_url) icon += '📄';
    if (module.quiz) icon += '�';

    return icon || '�';
  }

  getCategoryLabel(): string {
    if (!this.course) return '';
    // Map of category labels
    const labels: Record<string, string> = {
      'thermo': 'Thermo Fromage',
      'automatisme': 'Automatisme',
      'process': 'Process'
    };
    return labels[this.course.category] || this.course.category;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.validateAccessKey();
    }
  }

  setActiveTab(tab: 'overview' | 'qa' | 'notes') {
    this.activeTab = tab;

    if (tab === 'qa' && this.course) {
      this.loadDiscussions();
    }
  }

  // Discussion Forum Methods
  loadDiscussions() {
    if (!this.course?.id) return;

    this.supabaseService.getDiscussions(this.course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(discussions => {
        this.discussions = discussions;
      });
  }

  postQuestion() {
    if (!this.newQuestion.trim() || !this.course?.id) return;

    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userId = localStorage.getItem('userEmail') || 'anonymous';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    this.supabaseService.addQuestion({
      courseId: this.course.id,
      moduleId: this.currentModule?.id,
      userId,
      userName,
      userAvatar: userInitials,
      question: this.newQuestion
    }).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.newQuestion = '';
        this.loadDiscussions();
      });
  }

  toggleReplyBox(questionId: string) {
    this.showReplyBox[questionId] = !this.showReplyBox[questionId];
  }

  postReply(questionId: string) {
    if (!this.replyText[questionId]?.trim()) return;

    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userId = localStorage.getItem('userEmail') || 'anonymous';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    this.supabaseService.addReply(questionId, {
      userId,
      userName,
      userAvatar: userInitials,
      reply: this.replyText[questionId]
    }).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.replyText[questionId] = '';
        this.showReplyBox[questionId] = false;
        this.loadDiscussions();
      });
  }

  deleteQuestion(questionId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.supabaseService.deleteQuestion(questionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadDiscussions();
        });
    }
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return 'hier';
    return `il y a ${diffDays} jours`;
  }
}
