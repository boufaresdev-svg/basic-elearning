import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Formation {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: string;
  modalities: string[];
  price: string;
  icon: string;
}

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent {
  formations: Formation[] = [
    {
      id: 1,
      title: 'Fondamentaux de l\'Automatisme',
      description: 'Maîtrisez les concepts fondamentaux de l\'automatisme industriel, des automates programmables aux systèmes de contrôle.',
      duration: '5 jours',
      level: 'Débutant',
      modalities: ['Sur site', 'Inter-entreprises', 'En ligne'],
      price: 'Nous consulter',
      icon: 'automation'
    },
    {
      id: 2,
      title: 'SIEMENS S7-1200/1500 Avancé',
      description: 'Formation complète sur les automates SIEMENS S7-1200 et S7-1500, la programmation STEP 7 et les techniques avancées.',
      duration: '7 jours',
      level: 'Intermédiaire',
      modalities: ['Sur site', 'Intra-entreprise'],
      price: 'Nous consulter',
      icon: 'siemens'
    },
    {
      id: 3,
      title: 'Supervision Industrielle avec SCADA',
      description: 'Apprenez à concevoir et configurer des systèmes SCADA pour la supervision des processus industriels.',
      duration: '5 jours',
      level: 'Intermédiaire',
      modalities: ['Sur site', 'Inter-entreprises', 'En ligne'],
      price: 'Nous consulter',
      icon: 'scada'
    },
    {
      id: 4,
      title: 'HMI et Interfaces Homme-Machine',
      description: 'Développez des interfaces HMI efficaces pour la supervision et le contrôle des systèmes industriels.',
      duration: '4 jours',
      level: 'Intermédiaire',
      modalities: ['Sur site', 'En ligne'],
      price: 'Nous consulter',
      icon: 'hmi'
    },
    {
      id: 5,
      title: 'Réseaux Industriels et Protocoles',
      description: 'Maîtrisez les protocoles industriels PROFIBUS, PROFINET, Modbus et les réseaux Ethernet industriels.',
      duration: '4 jours',
      level: 'Avancé',
      modalities: ['Sur site', 'Intra-entreprise'],
      price: 'Nous consulter',
      icon: 'network'
    },
    {
      id: 6,
      title: 'Sécurité Industrielle et Cybersécurité',
      description: 'Protégez vos installations industrielles contre les menaces de cybersécurité et mettez en place les bonnes pratiques.',
      duration: '3 jours',
      level: 'Avancé',
      modalities: ['Sur site', 'En ligne'],
      price: 'Nous consulter',
      icon: 'security'
    }
  ];

  selectedModality: string = '';

  filterByModality(modality: string) {
    this.selectedModality = this.selectedModality === modality ? '' : modality;
  }

  getFilteredFormations() {
    if (!this.selectedModality) {
      return this.formations;
    }
    return this.formations.filter(f => f.modalities.includes(this.selectedModality));
  }
}
