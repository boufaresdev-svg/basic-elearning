import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Course } from '../../services/supabase.service';
import { FormationApiService } from '../../services/formation-api.service';

interface HomeStat {
  id: number;
  valueKey: string;
  labelKey: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoadingCourses = signal(true);
  coursesError = signal<string | null>(null);

  stats: HomeStat[] = [
    { id: 1, valueKey: 'HOME.STATS.ITEM_1.VALUE', labelKey: 'HOME.STATS.ITEM_1.LABEL' },
    { id: 2, valueKey: 'HOME.STATS.ITEM_2.VALUE', labelKey: 'HOME.STATS.ITEM_2.LABEL' },
    { id: 3, valueKey: 'HOME.STATS.ITEM_3.VALUE', labelKey: 'HOME.STATS.ITEM_3.LABEL' },
    { id: 4, valueKey: 'HOME.STATS.ITEM_4.VALUE', labelKey: 'HOME.STATS.ITEM_4.LABEL' }
  ];

  featuredCourses: Course[] = [];

  constructor(
    private formationApiService: FormationApiService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFeaturedCourses(): void {
    this.isLoadingCourses.set(true);
    this.coursesError.set(null);

    this.formationApiService
      .getAllFormations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (formations) => {
          const mappedCourses = (formations || []).map((formation) => this.formationApiService.mapFormationToCourse(formation));
          this.featuredCourses = mappedCourses.slice(0, 4);
          this.isLoadingCourses.set(false);
        },
        error: () => {
          this.featuredCourses = [];
          this.coursesError.set('HOME.COURSES.ERROR');
          this.isLoadingCourses.set(false);
        }
      });
  }

  formatDuration(totalDuration?: number): string {
    if (!totalDuration) {
      return this.translateService.instant('HOME.COURSES.NOT_SPECIFIED');
    }
    if (totalDuration < 60) {
      return `${totalDuration}m`;
    }
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  getLevelLabel(course: Course): string {
    return course.level || this.translateService.instant('HOME.COURSES.ALL_LEVELS');
  }
}
