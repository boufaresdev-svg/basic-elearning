import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

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
    path: '**',
    redirectTo: ''
  }
];
