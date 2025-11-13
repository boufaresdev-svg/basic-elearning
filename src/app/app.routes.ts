import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Accueil - SMS2I'
  },
  {
    path: 'formations',
    loadComponent: () => import('./pages/formations/formations.component').then(m => m.FormationsComponent),
    title: 'Formations - SMS2I'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Connexion - SMS2I'
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'Admin - SMS2I',
    canActivate: [authGuard]
  },
  {
    path: 'course/:id',
    loadComponent: () => import('./pages/course/course.component').then(m => m.CourseComponent),
    title: 'Cours - SMS2I'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact - SMS2I'
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Introuvable - SMS2I'
  }
];
