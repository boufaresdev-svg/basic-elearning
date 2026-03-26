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
  private readonly maxHomeCourses = 6;

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
          let formationsArray = formations || [];
          if (Array.isArray(formationsArray) && formationsArray.length > 0 && Array.isArray(formationsArray[0])) {
            formationsArray = formationsArray[0];
          }

          const mappedCourses = formationsArray
            .map((formation) => this.formationApiService.mapFormationToCourse(formation))
            .filter((course) => !!course?.id && !!course?.title);

          const uniqueCourses = mappedCourses.filter(
            (course, index, courses) => courses.findIndex((item) => item.id === course.id) === index
          );

          this.featuredCourses = uniqueCourses.slice(0, this.maxHomeCourses);
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

  getCourseDescription(course: Course): string {
    return course.description?.trim() || this.translateService.instant('FORMATIONS_PAGE.NOT_SPECIFIED');
  }

  getFormationTypeLabelKey(course: Course): string {
    const rawType = this.getCourseTypeRawValue(course);

    if (rawType.includes('intra')) {
      return 'FORMATION_TYPE.INTRA.TITLE';
    }

    if (rawType.includes('inter')) {
      return 'FORMATION_TYPE.INTER.TITLE';
    }

    return 'HOME.COURSES.TYPE_STANDARD';
  }

  private getCourseTypeRawValue(course: Course): string {
    const extendedCourse = course as Course & {
      type?: string;
      categorie?: string;
      category?: string;
      sousCategorie?: string;
    };

    return [
      extendedCourse.type,
      extendedCourse.categorie,
      extendedCourse.category,
      extendedCourse.sousCategorie,
      course.title,
      course.description
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
}
