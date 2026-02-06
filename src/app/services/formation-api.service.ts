import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// API Base URL
const API_BASE_URL = environment.apiUrl;

// Response Interfaces based on API documentation
export interface FormationResponse {
  idFormation: number;
  titreFormation?: string;
  theme?: string; // Alternative field name
  dureeFormation?: number;
  duree?: number; // Alternative field name
  descriptionFormation?: string;
  descriptionTheme?: string; // Alternative field name
  objectifsFormation?: string;
  prerequisFormation?: string;
  publicCibleFormation?: string;
  prixFormation?: number;
  niveauFormation?: string;
  niveau?: string; // Alternative field name
  idDomaine?: number;
  idFormateur?: number;
  idType?: number;
  idCategorie?: number;
  idSousCategorie?: number;
  nomDomaine?: string;
  nomFormateur?: string;
  prenomFormateur?: string;
  photoFormateur?: string;
  nomType?: string;
  nomCategorie?: string;
  nomSousCategorie?: string;
}

export interface PagedFormationResponse {
  content: FormationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FormationStatistics {
  totalFormations: number;
  totalApprenants: number;
  totalCertificats: number;
  averageRating?: number;
}

export interface DomaineResponse {
  idDomaine: number;
  nomDomaine: string;
  descriptionDomaine?: string;
}

export interface TypeResponse {
  idType: number;
  nomType: string;
  descriptionType?: string;
}

export interface CategorieResponse {
  idCategorie: number;
  nomCategorie: string;
  descriptionCategorie?: string;
  idType?: number;
}

export interface SousCategorieResponse {
  idSousCategorie: number;
  nomSousCategorie: string;
  descriptionSousCategorie?: string;
  idCategorie?: number;
}

export interface FormateurResponse {
  idFormateur: number;
  nomFormateur: string;
  prenomFormateur: string;
  emailFormateur?: string;
  telephoneFormateur?: string;
  specialiteFormateur?: string;
  bioFormateur?: string;
  photoFormateur?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormationApiService {
  private formationsSubject = new BehaviorSubject<FormationResponse[]>([]);
  public formations$ = this.formationsSubject.asObservable();

  private domainesSubject = new BehaviorSubject<DomaineResponse[]>([]);
  public domaines$ = this.domainesSubject.asObservable();

  private typesSubject = new BehaviorSubject<TypeResponse[]>([]);
  public types$ = this.typesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategorieResponse[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private sousCategoriesSubject = new BehaviorSubject<SousCategorieResponse[]>([]);
  public sousCategories$ = this.sousCategoriesSubject.asObservable();

  private formateursSubject = new BehaviorSubject<FormateurResponse[]>([]);
  public formateurs$ = this.formateursSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load all formations
    this.getAllFormations().subscribe();

    // Load metadata
    this.getAllDomaines().subscribe();
    this.getAllTypes().subscribe();
    this.getAllFormateurs().subscribe();
  }

  // Formations endpoints
  getAllFormations(): Observable<FormationResponse[]> {
    return this.http.get<FormationResponse[]>(`${API_BASE_URL}/formations`).pipe(
      tap(formations => this.formationsSubject.next(formations)),
      catchError(error => {
        console.error('Error fetching formations:', error);
        return of([]);
      })
    );
  }

  getFormationsPaginated(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'idFormation',
    sortDirection: string = 'ASC'
  ): Observable<PagedFormationResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<PagedFormationResponse>(`${API_BASE_URL}/formations/paginated`, { params });
  }

  getFormationById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/formations/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching formation by ID:', error);
        return of(null);
      })
    );
  }

  getFormationStatistics(): Observable<FormationStatistics> {
    return this.http.get<FormationStatistics>(`${API_BASE_URL}/formations/statistics`);
  }

  // Domaines endpoints
  getAllDomaines(): Observable<DomaineResponse[]> {
    return this.http.get<DomaineResponse[]>(`${API_BASE_URL}/domaines`).pipe(
      tap(domaines => this.domainesSubject.next(domaines)),
      catchError(error => {
        console.error('Error fetching domaines:', error);
        return of([]);
      })
    );
  }

  getDomaineById(id: number): Observable<DomaineResponse> {
    return this.http.get<DomaineResponse>(`${API_BASE_URL}/domaines/${id}`);
  }

  // Types endpoints
  getAllTypes(): Observable<TypeResponse[]> {
    return this.http.get<TypeResponse[]>(`${API_BASE_URL}/types`).pipe(
      tap(types => this.typesSubject.next(types)),
      catchError(error => {
        console.error('Error fetching types:', error);
        return of([]);
      })
    );
  }

  getTypeById(id: number): Observable<TypeResponse> {
    return this.http.get<TypeResponse>(`${API_BASE_URL}/types/${id}`);
  }

  // Categories endpoints
  getAllCategories(): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(`${API_BASE_URL}/categories`).pipe(
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }

  getCategorieById(id: number): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${API_BASE_URL}/categories/${id}`);
  }

  getCategoriesByType(idType: number): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(`${API_BASE_URL}/categories/by-type/${idType}`);
  }

  // Sous-Categories endpoints
  getAllSousCategories(): Observable<SousCategorieResponse[]> {
    return this.http.get<SousCategorieResponse[]>(`${API_BASE_URL}/souscategories`).pipe(
      tap(sousCategories => this.sousCategoriesSubject.next(sousCategories)),
      catchError(error => {
        console.error('Error fetching sous-categories:', error);
        return of([]);
      })
    );
  }

  getSousCategorieById(id: number): Observable<SousCategorieResponse> {
    return this.http.get<SousCategorieResponse>(`${API_BASE_URL}/souscategories/${id}`);
  }

  getSousCategoriesByCategorie(idCategorie: number): Observable<SousCategorieResponse[]> {
    return this.http.get<SousCategorieResponse[]>(`${API_BASE_URL}/souscategories/by-categorie/${idCategorie}`);
  }

  // Formateurs endpoints
  getAllFormateurs(): Observable<FormateurResponse[]> {
    return this.http.get<FormateurResponse[]>(`${API_BASE_URL}/formateurs`).pipe(
      tap(formateurs => this.formateursSubject.next(formateurs)),
      catchError(error => {
        console.error('Error fetching formateurs:', error);
        return of([]);
      })
    );
  }

  getFormateurById(id: number): Observable<FormateurResponse> {
    return this.http.get<FormateurResponse>(`${API_BASE_URL}/formateurs/${id}`);
  }

  // Helper method to get formateur photo URL
  getFormateurPhotoUrl(photoPath: string | undefined): string {
    if (!photoPath) {
      return 'assets/images/default-instructor.jpg';
    }
    // If the photo path is relative, prepend the base URL
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    return `${API_BASE_URL}/files/${photoPath}`;
  }

  // Helper method to map API formation to local Course interface
  mapFormationToCourse(formation: any): any {
    // Handle both possible field name variations and nested objects
    const title = formation.titreFormation || formation.theme || 'Formation sans titre';
    const description = formation.descriptionFormation || formation.descriptionTheme || 'Description non disponible';
    const duration = formation.dureeFormation || formation.duree || formation.nombreHeures || 0;
    const level = formation.niveauFormation || formation.niveau || 'Tous niveaux';

    // Extract type name from nested object or direct field
    const typeName = formation.nomType || formation.type?.nom || null;
    const categorieName = formation.nomCategorie || formation.categorie?.nom || null;
    const sousCategorieName = formation.nomSousCategorie || formation.sousCategorie?.nom || null;

    return {
      id: formation.idFormation.toString(),
      title: title,
      category: this.mapCategoryToLocal(typeName),
      subcategory: sousCategorieName?.toLowerCase(),
      description: description,
      objectives: formation.objectifsFormation || formation.objectifsGlobaux?.join(', '),
      level: level,
      total_duration: duration,
      image: this.getDefaultImageByCategory(typeName),
      access_key: 'open',
      instructor: formation.nomFormateur && formation.prenomFormateur
        ? `${formation.prenomFormateur} ${formation.nomFormateur}`
        : undefined,
      instructorPhoto: this.getFormateurPhotoUrl(formation.photoFormateur),
      domaine: formation.nomDomaine || formation.domaine?.nom,
      type: typeName,
      categorie: categorieName,
      sousCategorie: sousCategorieName,
      prix: formation.prixFormation || formation.prix
    };
  }

  private mapCategoryToLocal(nomType: string | undefined): string {
    if (!nomType) return 'process';

    const typeMap: { [key: string]: string } = {
      'thermo': 'thermo',
      'automatisme': 'automatisme',
      'process': 'process'
    };

    const normalizedType = nomType.toLowerCase();
    return typeMap[normalizedType] || 'process';
  }

  private getDefaultImageByCategory(nomType: string | undefined): string {
    const typeMap: { [key: string]: string } = {
      'thermo': 'https://images.unsplash.com/photo-1577935749442-8356391d8487?q=80&w=2000&auto=format&fit=crop',
      'automatisme': 'https://images.unsplash.com/photo-1531297461136-82lw8e4a9075?q=80&w=2000&auto=format&fit=crop',
      'process': 'https://images.unsplash.com/photo-1581092497914-874936d52d9a?q=80&w=2000&auto=format&fit=crop'
    };

    return typeMap[nomType?.toLowerCase() || 'process'] || typeMap['process'];
  }
}
