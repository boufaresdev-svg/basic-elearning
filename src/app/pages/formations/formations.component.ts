import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService, Course } from '../../services/supabase.service';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  selectedCategory: 'thermo' | 'automatisme' | 'process' | '' = '';
  private destroy$ = new Subject<void>();

  categoryOptions = [
    { value: '', label: 'Toutes les formations', icon: 'all' },
    { value: 'thermo', label: 'Formations Thermo Fromage', icon: 'thermo' },
    { value: 'automatisme', label: 'Formations Automatisme', icon: 'automatisme' },
    { value: 'process', label: 'Formations Process', icon: 'process' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    // Subscribe to courses from Supabase
    this.supabaseService.courses$
      .pipe(takeUntil(this.destroy$))
      .subscribe((courses) => {
        this.courses = courses.filter((c): c is Course & { id: string } => c.id !== undefined) as Course[];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterByCategory(category: string) {
    const validCategory = category as 'thermo' | 'automatisme' | 'process' | '';
    this.selectedCategory = this.selectedCategory === validCategory ? '' : validCategory;
  }

  getFilteredCourses() {
    if (!this.selectedCategory) {
      return this.courses;
    }
    return this.courses.filter(course => course.category === this.selectedCategory);
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
    const cat = this.categoryOptions.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  formatDuration(totalDuration?: number): string {
    if (!totalDuration) return 'Non spécifié';
    if (totalDuration < 60) return `${totalDuration}m`;
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  getLevel(course: Course): string {
    return course.level || 'Tous niveaux';
  }
}
