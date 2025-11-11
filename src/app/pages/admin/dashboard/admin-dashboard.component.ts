import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  contents: CourseContent[];
  accessKey?: string;
  createdAt: Date;
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

  courses: Course[] = [
    {
      id: '1',
      title: 'Thermodynamique Basique',
      category: 'thermo',
      description: 'Formation de base en thermodynamique et système de refroidissement',
      contents: [
        {
          id: 'c1',
          title: 'Introduction',
          description: 'Introduction aux concepts fondamentaux',
          duration: '45 min'
        }
      ],
      accessKey: 'THERMO2024BASIC',
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Automatisme Avancé',
      category: 'automatisme',
      description: 'Techniques avancées en automatisation industrielle',
      contents: [],
      createdAt: new Date()
    },
    {
      id: '3',
      title: 'Processus Production',
      category: 'process',
      description: 'Optimisation des processus de production',
      contents: [],
      createdAt: new Date()
    }
  ];

  categoryOptions = [
    { value: 'thermo', label: 'Formations Thermo Fromage' },
    { value: 'automatisme', label: 'Formations Automatisme' },
    { value: 'process', label: 'Formations Process' }
  ];

  newCourse = {
    title: '',
    category: 'automatisme' as 'thermo' | 'automatisme' | 'process',
    description: ''
  };

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

    const course: Course = {
      id: Date.now().toString(),
      title: this.newCourse.title,
      category: this.newCourse.category,
      description: this.newCourse.description,
      contents: [],
      createdAt: new Date()
    };

    this.courses.push(course);
    this.resetCourseForm();
    alert('Cours créé avec succès!');
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

    const content: CourseContent = {
      id: Date.now().toString(),
      title: this.newContent.title,
      description: this.newContent.description,
      duration: this.newContent.duration,
      videoUrl: this.newContent.videoFile ? URL.createObjectURL(this.newContent.videoFile) : undefined,
      pdfUrl: this.newContent.pdfFile ? URL.createObjectURL(this.newContent.pdfFile) : undefined
    };

    this.selectedCourse.contents.push(content);
    this.resetContentForm();
    alert('Contenu ajouté au cours!');
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
    course.accessKey = key;
    this.generatedKey = key;
    alert(`Clé d'accès générée: ${key}`);
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
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      course.contents = course.contents.filter(c => c.id !== contentId);
      alert('Contenu supprimé');
    }
  }

  deleteCourse(courseId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours?')) {
      this.courses = this.courses.filter(c => c.id !== courseId);
      this.selectedCourse = null;
      alert('Cours supprimé');
    }
  }

  resetCourseForm() {
    this.newCourse = {
      title: '',
      category: 'automatisme',
      description: ''
    };
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
    return course.accessKey ? 'active' : 'inactive';
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

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
