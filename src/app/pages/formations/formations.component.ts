import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Course } from '../../services/supabase.service';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

interface SidebarCategory {
  id: string;
  label: string;
  icon?: string;
  subcategories: { id: string; label: string }[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  selectedCategory: string = '';
  selectedSubCategory: string = '';
  searchTerm: string = '';
  searchInstructor: string = '';
  private destroy$ = new Subject<void>();

  sidebarCategories: SidebarCategory[] = [
    {
      id: 'all',
      label: 'Toutes les formations',
      icon: 'all',
      subcategories: [], // 'all' usually doesn't need subcategories or can be just a reset
      isOpen: false
    },
    {
      id: 'thermo',
      label: 'Thermo Fromage',
      icon: 'thermo',
      isOpen: true,
      subcategories: [
        { id: 'pasteurisation', label: 'Pasteurisation' },
        { id: 'sterilisation', label: 'Stérilisation' },
        { id: 'echangeurs', label: 'Échangeurs Thermiques' }
      ]
    },
    {
      id: 'automatisme',
      label: 'Automatisme',
      icon: 'automatisme',
      isOpen: true,
      subcategories: [
        { id: 'plc', label: 'Automates PLC' },
        { id: 'hmi', label: 'Interfaces IHM' },
        { id: 'variateurs', label: 'Variateurs de Vitesse' },
        { id: 'reseaux', label: 'Réseaux Industriels' }
      ]
    },
    {
      id: 'process',
      label: 'Process',
      icon: 'process',
      isOpen: true,
      subcategories: [
        { id: 'nettoyage', label: 'Nettoyage en Place (NEP)' },
        { id: 'pompes', label: 'Pompes & Cubage' },
        { id: 'instrumentation', label: 'Instrumentation de mesure' }
      ]
    }
  ];

  fakeCourses: any[] = [
    {
      id: 'fake-1',
      title: 'Maîtrise de la Pasteurisation',
      category: 'thermo',
      subcategory: 'pasteurisation',
      description: 'Comprendre les principes fondamentaux de la pasteurisation et son application industrielle.',
      level: 'Intermédiaire',
      total_duration: 120, // 2h
      image: 'https://images.unsplash.com/photo-1577935749442-8356391d8487?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Jean Dupont'
    },
    {
      id: 'fake-2',
      title: 'Les Échangeurs à Plaques',
      category: 'thermo',
      subcategory: 'echangeurs',
      description: 'Maintenance et dimensionnement des échangeurs thermiques à plaques.',
      level: 'Avancé',
      total_duration: 180, // 3h
      image: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Marie Currie'
    },
    {
      id: 'fake-3',
      title: 'Programmation Siemens S7-1200',
      category: 'automatisme',
      subcategory: 'plc',
      description: 'Initiation à la programmation des automates Siemens série S7-1200 avec TIA Portal.',
      level: 'Débutant',
      total_duration: 360, // 6h
      image: 'https://images.unsplash.com/photo-1531297461136-82lw8e4a9075?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Ahmed Benali'
    },
    {
      id: 'fake-4',
      title: 'Supervision WinCC Unified',
      category: 'automatisme',
      subcategory: 'hmi',
      description: 'Création d\'interfaces homme-machine modernes avec WinCC Unified.',
      level: 'Intermédiaire',
      total_duration: 240, // 4h
      image: 'https://images.unsplash.com/photo-1610465299993-e6675c9f9efa?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      instructor: 'Ahmed Benali'
    },
    {
      id: 'fake-5',
      title: 'Pompes Centrifuges : Principes',
      category: 'process',
      subcategory: 'pompes',
      description: 'Fonctionnement, choix et maintenance des pompes centrifuges en industrie agroalimentaire.',
      level: 'Débutant',
      total_duration: 90, // 1h30
      image: 'https://images.unsplash.com/photo-1581092497914-874936d52d9a?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Sophie Martin'
    },
    {
      id: 'fake-6',
      title: 'Techniques de NEP Avancées',
      category: 'process',
      subcategory: 'nettoyage',
      description: 'Optimisation des cycles de Nettoyage En Place pour réduire la consommation d\'eau et d\'énergie.',
      level: 'Expert',
      total_duration: 300, // 5h
      image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      instructor: 'Sophie Martin'
    },
     {
      id: 'fake-7',
      title: 'Les Capteurs de Température',
      category: 'process',
      subcategory: 'instrumentation',
      description: 'PT100, Thermocouples : choisir et installer le bon capteur.',
      level: 'Intermédiaire',
      total_duration: 60,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Jean Dupont'
    },
    {
      id: 'fake-8',
      title: 'Variateurs de Vitesse ATV320',
      category: 'automatisme',
      subcategory: 'variateurs',
      description: 'Paramétrage et mise en service des variateurs Schneider ATV320.',
      level: 'Avancé',
      total_duration: 150,
      image: 'https://images.unsplash.com/photo-1563770095-39d468f95c83?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      instructor: 'Ahmed Benali'
    },
     {
      id: 'fake-9',
      title: 'Stérilisation UHT',
      category: 'thermo',
      subcategory: 'sterilisation',
      description: 'Procédés de stérilisation Ultra Haute Température.',
      level: 'Expert',
      total_duration: 200,
      image: 'https://images.unsplash.com/photo-1565514020176-13d8a1c90069?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      instructor: 'Marie Currie'
    }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.supabaseService.courses$
      .pipe(takeUntil(this.destroy$))
      .subscribe((courses) => {
        const validCourses = courses.filter((c): c is Course & { id: string } => c.id !== undefined) as Course[];
        // Merge fake courses with real courses
        this.courses = [...this.fakeCourses, ...validCourses];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCategory(category: SidebarCategory) {
    if (category.id === 'all') {
      this.selectedCategory = '';
      this.selectedSubCategory = '';
      // Reset expanded state for others if needed, or keep them
    } else {
      category.isOpen = !category.isOpen;
    }
  }

  selectCategory(category: string) {
    if (category === 'all') {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = category;
    }
    this.selectedSubCategory = '';
  }

  selectSubCategory(category: string, subCategory: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.selectedSubCategory = subCategory;
  }

  getFilteredCourses() {
    return this.courses.filter(course => {
      // Filter by Category
      if (this.selectedCategory && course.category !== this.selectedCategory) {
        return false;
      }
      
      // Filter by SubCategory (if property exists on course)
      if (this.selectedSubCategory) {
        const c = course as any;
        if (c.subcategory !== this.selectedSubCategory) {
          return false;
        }
      }

      // Filter by Search Term (Title)
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        if (!course.title.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Filter by Instructor
      if (this.searchInstructor) {
        const instructor = (course as any).instructor;
        if (!instructor || !instructor.toLowerCase().includes(this.searchInstructor.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'thermo': return 'thermo';
      case 'automatisme': return 'automation';
      case 'process': return 'process';
      default: return 'course';
    }
  }

  getCategoryLabel(category: string): string {
    if (category === 'all' || category === '') return 'Toutes les formations';
    const cat = this.sidebarCategories.find(c => c.id === category);
    return cat ? cat.label : category;
  }

  formatDuration(totalDuration?: number): string {
    if (!totalDuration) return 'Non spécifié';
    if (totalDuration < 60) return `${totalDuration}m`;
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;

    // Calculate days (6 hours per day)
    const days = Math.ceil(hours / 6);
    const dayStr = days === 1 ? '1 jour' : `${days} jours`;

    return `${timeStr} (${dayStr})`;
  }

  getLevel(course: Course): string {
    return course.level || 'Tous niveaux';
  }

  getDurationInDays(totalDuration?: number): string {
    if (!totalDuration) return 'Non spécifié';
    const hours = Math.floor(totalDuration / 60);
    const days = Math.ceil(hours / 6);
    return days === 1 ? '1 jour' : `${days} jours`;
  }
}
