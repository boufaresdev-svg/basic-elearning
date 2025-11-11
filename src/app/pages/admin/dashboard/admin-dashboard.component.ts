import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Course as SupabaseCourse, CourseContent as SupabaseCourseContent } from '../../../services/supabase.service';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

export interface CourseContent {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  videoFile?: File;
  pdfUrl?: string;
  pdfFile?: File;
  duration?: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'thermo' | 'automatisme' | 'process';
  description: string;
  objectives?: string;
  level?: string;
  image?: string;
  contents: CourseContent[];
  accessKey?: string;
  access_key?: string;
  createdAt?: Date | string;
  created_at?: string;
  updatedAt?: Date | string;
  updated_at?: string;
  totalDuration?: number;
  total_duration?: number;
}

export interface UploadProgress {
  [key: string]: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  activeTab: 'courses' | 'create' | 'manage' | 'user' = 'user';
  userCategoryFilter: 'thermo' | 'automatisme' | 'process' | 'all' = 'all';

  // Bibliotheque improvements
  bibliothequeSearchTerm: string = '';
  bibliothequeSort: 'date' | 'title' | 'category' | 'access' = 'date';
  selectedCourseIds: Set<string> = new Set();
  showCoursePreview: boolean = false;
  previewCourse: Course | null = null;

  // Editor improvements
  editorTab: 'add' | 'view' = 'add';
  Object = Object;

  courses: Course[] = [];
  private destroy$ = new Subject<void>();

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.supabaseService.courses$
      .pipe(takeUntil(this.destroy$))
      .subscribe((courses) => {
        // Filter courses to ensure they have an id (type narrowing)
        this.courses = courses.filter((c): c is Course & { id: string } => c.id !== undefined) as Course[];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  categoryOptions = [
    { value: 'thermo', label: 'Formations Thermo Fromage' },
    { value: 'automatisme', label: 'Formations Automatisme' },
    { value: 'process', label: 'Formations Process' }
  ];

  newCourse = {
    title: '',
    category: 'automatisme' as 'thermo' | 'automatisme' | 'process',
    description: '',
    objectives: '',
    duration: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    image: null as File | null,
    imagePreview: null as string | null
  };

  courseFormErrors: { [key: string]: string } = {};
  showCourseFormPreview: boolean = false;

  newContent = {
    title: '',
    description: '',
    videoFile: null as File | null,
    pdfFile: null as File | null,
    duration: '',
    videoPreview: null as string | null,
    pdfPreview: null as string | null
  };

  selectedCourse: Course | null = null;
  generatedKey: string = '';
  uploadProgress: UploadProgress = {};
  sidebarCollapsed: boolean = false;

  createCourse() {
    if (!this.newCourse.title || !this.newCourse.description) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Show uploading message if there's an image
    if (this.newCourse.image) {
      alert('Upload de l\'image en cours...');
    }

    // Upload image to Supabase Storage if present
    const uploadImage = this.newCourse.image
      ? this.supabaseService.uploadFile(
          'formations',
          `images/${Date.now()}_${this.newCourse.image.name}`,
          this.newCourse.image
        ).toPromise()
      : Promise.resolve(undefined);

    uploadImage
      .then((imageUrl) => {
        const course: Omit<Course, 'id'> = {
          title: this.newCourse.title,
          category: this.newCourse.category,
          description: this.newCourse.description,
          objectives: this.newCourse.objectives,
          level: this.newCourse.level,
          image: imageUrl,
          contents: [],
          total_duration: this.newCourse.duration ? parseInt(this.newCourse.duration) * 60 : undefined
        };

        this.supabaseService.addCourse(course).subscribe({
          next: (newCourse) => {
            this.resetCourseForm();
            alert('Cours créé avec succès!');
          },
          error: (err) => {
            console.error('Error creating course:', err);
            alert('Erreur lors de la création du cours');
          }
        });
      })
      .catch((err) => {
        console.error('Image upload error:', err);
        alert('Erreur lors de l\'upload de l\'image');
      });
  }

  selectCourse(course: Course) {
    this.selectedCourse = course;
  }

  addContentToCourse() {
    if (!this.selectedCourse) {
      alert('Veuillez sélectionner un cours');
      return;
    }

    if (!this.newContent.title || !this.newContent.description) {
      alert('Veuillez remplir les champs requis');
      return;
    }

    const contentId = Date.now().toString();

    // Show uploading message
    alert('Upload en cours...');

    // Upload files to Supabase Storage if present
    const uploadTasks: any[] = [];

    if (this.newContent.videoFile) {
      const videoPath = `videos/${contentId}_${this.newContent.videoFile.name}`;
      uploadTasks.push(
        this.supabaseService.uploadFile('formations', videoPath, this.newContent.videoFile).toPromise()
      );
    }

    if (this.newContent.pdfFile) {
      const pdfPath = `pdfs/${contentId}_${this.newContent.pdfFile.name}`;
      uploadTasks.push(
        this.supabaseService.uploadFile('formations', pdfPath, this.newContent.pdfFile).toPromise()
      );
    }

    // Wait for all uploads to complete
    Promise.all(uploadTasks)
      .then((uploadedUrls) => {
        let videoUrl: string | undefined;
        let pdfUrl: string | undefined;

        if (this.newContent.videoFile) {
          videoUrl = uploadedUrls.shift();
        }
        if (this.newContent.pdfFile) {
          pdfUrl = uploadedUrls.shift();
        }

        const content: CourseContent = {
          id: contentId,
          title: this.newContent.title,
          description: this.newContent.description,
          duration: this.newContent.duration,
          videoUrl: videoUrl,
          pdfUrl: pdfUrl
        };

        // Add content to course via Supabase
        this.supabaseService.addContentToCourse(this.selectedCourse!.id, content).subscribe({
          next: (updatedCourse) => {
            // Update local reference (cast to local Course type)
            if (updatedCourse.id) {
              this.selectedCourse = updatedCourse as Course;
            }
            this.resetContentForm();
            alert('Contenu ajouté au cours avec succès!');
          },
          error: (err) => {
            console.error('Error adding content:', err);
            alert('Erreur lors de l\'ajout du contenu');
          }
        });
      })
      .catch((err) => {
        console.error('Upload error:', err);
        alert('Erreur lors de l\'upload des fichiers');
      });
  }

  onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Veuillez sélectionner un fichier vidéo valide');
        return;
      }
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        alert('Le fichier vidéo ne doit pas dépasser 500MB');
        return;
      }
      this.newContent.videoFile = file;
      this.newContent.videoPreview = this.getFilePreview(file);
      this.simulateUploadProgress('video', file);
    }
  }

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Veuillez sélectionner un fichier PDF valide');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('Le fichier PDF ne doit pas dépasser 50MB');
        return;
      }
      this.newContent.pdfFile = file;
      this.newContent.pdfPreview = this.getFilePreview(file);
      this.simulateUploadProgress('pdf', file);
    }
  }

  private getFilePreview(file: File): string {
    return `${file.name} (${this.formatFileSize(file.size)})`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private simulateUploadProgress(type: string, file: File) {
    const key = `${type}-${Date.now()}`;
    this.uploadProgress[key] = 0;

    const interval = setInterval(() => {
      if (this.uploadProgress[key] < 100) {
        this.uploadProgress[key] += Math.random() * 30;
      } else {
        this.uploadProgress[key] = 100;
        clearInterval(interval);
      }
    }, 300);
  }

  generateAccessKey(course: Course) {
    const key = this.generateRandomKey();

    // Update in database
    this.supabaseService.updateCourse(course.id, { access_key: key }).subscribe({
      next: (updatedCourse) => {
        if (updatedCourse.id) {
          // Update local reference
          const localCourse = this.courses.find(c => c.id === course.id);
          if (localCourse) {
            localCourse.accessKey = key;
            localCourse.access_key = key;
          }
          this.generatedKey = key;
          alert(`Clé d'accès générée: ${key}`);
        }
      },
      error: (err) => {
        console.error('Error generating access key:', err);
        alert('Erreur lors de la génération de la clé');
      }
    });
  }

  private generateRandomKey(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copié dans le presse-papiers!');
    });
  }

  deleteContent(courseId: string, contentId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce module?')) {
      this.supabaseService.deleteContent(courseId, contentId).subscribe({
        next: (updatedCourse) => {
          if (this.selectedCourse && this.selectedCourse.id === courseId && updatedCourse.id) {
            this.selectedCourse = updatedCourse as Course;
          }
          alert('Contenu supprimé avec succès');
        },
        error: (err) => {
          console.error('Error deleting content:', err);
          alert('Erreur lors de la suppression du contenu');
        }
      });
    }
  }

  deleteCourse(courseId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours?')) {
      this.supabaseService.deleteCourse(courseId).subscribe({
        next: (success) => {
          if (success) {
            if (this.selectedCourse?.id === courseId) {
              this.selectedCourse = null;
            }
            alert('Cours supprimé avec succès');
          }
        },
        error: (err) => {
          console.error('Error deleting course:', err);
          alert('Erreur lors de la suppression du cours');
        }
      });
    }
  }

  resetCourseForm() {
    this.newCourse = {
      title: '',
      category: 'automatisme',
      description: '',
      objectives: '',
      duration: '',
      level: 'beginner',
      image: null,
      imagePreview: null
    };
    this.courseFormErrors = {};
    this.showCourseFormPreview = false;
  }

  resetContentForm() {
    this.newContent = {
      title: '',
      description: '',
      videoFile: null,
      pdfFile: null,
      duration: '',
      videoPreview: null,
      pdfPreview: null
    };
  }

  getCoursesByCategory(category: string): Course[] {
    return this.courses.filter(c => c.category === category);
  }

  getAccessKeyClass(course: Course): string {
    const hasKey = course.accessKey || course.access_key;
    return hasKey ? 'active' : 'inactive';
  }

  getFilteredCoursesForUser(): Course[] {
    if (this.userCategoryFilter === 'all') {
      return this.courses;
    }
    return this.courses.filter(c => c.category === this.userCategoryFilter);
  }

  getCategoryLabel(category: string): string {
    const cat = this.categoryOptions.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  removeVideoFile() {
    this.newContent.videoFile = null;
    this.newContent.videoPreview = null;
  }

  removePdfFile() {
    this.newContent.pdfFile = null;
    this.newContent.pdfPreview = null;
  }

  changeUserFilter(category: string) {
    this.userCategoryFilter = category as 'thermo' | 'automatisme' | 'process' | 'all';
  }

  // Bibliotheque improvement methods
  searchCourses(term: string): Course[] {
    if (!term.trim()) {
      return this.getFilteredAndSortedCourses();
    }
    const lowerTerm = term.toLowerCase();
    return this.getFilteredAndSortedCourses().filter(course =>
      course.title.toLowerCase().includes(lowerTerm) ||
      course.description.toLowerCase().includes(lowerTerm)
    );
  }

  getFilteredAndSortedCourses(): Course[] {
    let filtered = this.courses;

    // Sort by selected option
    if (this.bibliothequeSort === 'date') {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date((b.updatedAt || b.createdAt) || '').getTime();
        const dateB = new Date((a.updatedAt || a.createdAt) || '').getTime();
        return dateA - dateB;
      });
    } else if (this.bibliothequeSort === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.bibliothequeSort === 'category') {
      filtered = filtered.sort((a, b) => a.category.localeCompare(b.category));
    } else if (this.bibliothequeSort === 'access') {
      filtered = filtered.sort((a, b) => {
        const aHasKey = a.accessKey ? 1 : 0;
        const bHasKey = b.accessKey ? 1 : 0;
        return bHasKey - aHasKey;
      });
    }

    return filtered;
  }

  toggleCourseSelection(courseId: string) {
    if (this.selectedCourseIds.has(courseId)) {
      this.selectedCourseIds.delete(courseId);
    } else {
      this.selectedCourseIds.add(courseId);
    }
  }

  selectAllCourses(checked: boolean) {
    if (checked) {
      this.courses.forEach(course => {
        if (course.id) this.selectedCourseIds.add(course.id);
      });
    } else {
      this.selectedCourseIds.clear();
    }
  }

  deleteSelectedCourses() {
    if (this.selectedCourseIds.size === 0) {
      alert('Aucun cours sélectionné');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedCourseIds.size} cours?`)) {
      const idsToDelete = Array.from(this.selectedCourseIds);
      this.supabaseService.deleteMultipleCourses(idsToDelete).subscribe({
        next: () => {
          this.selectedCourseIds.clear();
          alert(`${idsToDelete.length} cours supprimés`);
        },
        error: (err) => {
          console.error('Error deleting courses:', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  generateAccessKeysForSelected() {
    if (this.selectedCourseIds.size === 0) {
      alert('Aucun cours sélectionné');
      return;
    }

    let count = 0;
    const updatePromises: Promise<any>[] = [];

    this.selectedCourseIds.forEach(courseId => {
      const course = this.courses.find(c => c.id === courseId);
      if (course && (!course.accessKey && !course.access_key)) {
        const key = this.generateRandomKey();

        // Update in database
        const updatePromise = this.supabaseService.updateCourse(courseId, { access_key: key }).toPromise()
          .then((updatedCourse) => {
            if (updatedCourse?.id) {
              course.accessKey = key;
              course.access_key = key;
              count++;
            }
          })
          .catch((err) => {
            console.error(`Error updating course ${courseId}:`, err);
          });

        updatePromises.push(updatePromise);
      }
    });

    // Wait for all updates to complete
    Promise.all(updatePromises).then(() => {
      if (count > 0) {
        alert(`${count} clé(s) d'accès générée(s) et enregistrée(s)`);
      } else {
        alert('Tous les cours sélectionnés ont déjà des clés d\'accès');
      }
    }).catch(() => {
      alert('Certaines clés n\'ont pas pu être générées');
    });
  }

  duplicateCourse(course: Course) {
    const duplicated: Course = {
      id: Date.now().toString(),
      title: `${course.title} (Copie)`,
      category: course.category,
      description: course.description,
      contents: course.contents.map(content => ({ ...content, id: Date.now().toString() })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.courses.push(duplicated);
    alert('Cours dupliqué avec succès!');
  }

  previewCourseDetails(course: Course) {
    this.previewCourse = course;
    this.showCoursePreview = true;
  }

  closePreview() {
    this.showCoursePreview = false;
    this.previewCourse = null;
  }

  getCourseStats(course: Course): { modules: number; totalDuration: string; accessStatus: string } {
    const modules = course.contents.length;
    const totalDuration = this.calculateTotalDuration(course);
    const accessStatus = course.accessKey ? 'Actif' : 'Inactif';

    return { modules, totalDuration, accessStatus };
  }

  private calculateTotalDuration(course: Course): string {
    let totalMinutes = 0;

    course.contents.forEach(content => {
      if (content.duration) {
        const match = content.duration.match(/\d+/);
        if (match) {
          totalMinutes += parseInt(match[0]);
        }
      }
    });

    if (totalMinutes === 0) return 'N/A';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  exportCoursesAsJson() {
    const dataStr = JSON.stringify(this.courses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courses-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('Courses exported successfully!');
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Nouveau Cours improvements
  validateCourseForm(): boolean {
    this.courseFormErrors = {};

    if (!this.newCourse.title.trim()) {
      this.courseFormErrors['title'] = 'Le titre du cours est requis';
    } else if (this.newCourse.title.length < 5) {
      this.courseFormErrors['title'] = 'Le titre doit contenir au moins 5 caractères';
    } else if (this.newCourse.title.length > 100) {
      this.courseFormErrors['title'] = 'Le titre ne doit pas dépasser 100 caractères';
    }

    if (!this.newCourse.description.trim()) {
      this.courseFormErrors['description'] = 'La description est requise';
    } else if (this.newCourse.description.length < 10) {
      this.courseFormErrors['description'] = 'La description doit contenir au moins 10 caractères';
    } else if (this.newCourse.description.length > 1000) {
      this.courseFormErrors['description'] = 'La description ne doit pas dépasser 1000 caractères';
    }

    if (this.newCourse.objectives && this.newCourse.objectives.length > 500) {
      this.courseFormErrors['objectives'] = 'Les objectifs ne doivent pas dépasser 500 caractères';
    }

    if (this.newCourse.duration && isNaN(Number(this.newCourse.duration))) {
      this.courseFormErrors['duration'] = 'La durée doit être un nombre valide';
    }

    return Object.keys(this.courseFormErrors).length === 0;
  }

  onCourseImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.courseFormErrors['image'] = 'Veuillez sélectionner une image valide';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.courseFormErrors['image'] = 'L\'image ne doit pas dépasser 5MB';
        return;
      }
      this.newCourse.image = file;
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newCourse.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      this.courseFormErrors['image'] = '';
    }
  }

  removeCourseImage() {
    this.newCourse.image = null;
    this.newCourse.imagePreview = null;
  }

  toggleCoursePreview() {
    if (this.validateCourseForm()) {
      this.showCourseFormPreview = !this.showCourseFormPreview;
    }
  }

  submitCourseForm() {
    if (this.validateCourseForm()) {
      this.createCourse();
    }
  }

  getCourseFormProgress(): number {
    let filled = 0;
    if (this.newCourse.title.trim()) filled++;
    if (this.newCourse.category) filled++;
    if (this.newCourse.description.trim()) filled++;
    if (this.newCourse.objectives?.trim()) filled++;
    if (this.newCourse.duration) filled++;
    if (this.newCourse.image) filled++;

    return Math.round((filled / 6) * 100);
  }
}
