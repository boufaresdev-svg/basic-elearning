import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface Service {
  icon: string;
  translationKey: string;
}

interface Partner {
  name: string;
  logo?: string;
}

interface Feature {
  icon: string;
  translationKey: string;
}

interface FormationType {
  icon: string;
  translationKey: string;
  highlight: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  services: Service[] = [
    {
      icon: 'integration',
      translationKey: 'INTEGRATION'
    },
    {
      icon: 'automation',
      translationKey: 'AUTOMATION'
    },
    {
      icon: 'mechanical',
      translationKey: 'MECHANICAL'
    },
    {
      icon: 'instrumentation',
      translationKey: 'INSTRUMENTATION'
    },
    {
      icon: 'training',
      translationKey: 'TRAINING'
    },
    {
      icon: 'support',
      translationKey: 'SUPPORT'
    }
  ];

  partners: Partner[] = [
    { name: 'Delice' },
    { name: 'Vitalait' },
    { name: 'Copag' },
    { name: 'Gipa' },
    { name: 'Natilaït' },
    { name: 'Aveva' },
    { name: 'Tetrapak' },
    { name: 'Stip' },
    { name: 'Lepidor' },
    { name: 'GSM GIAS' },
    { name: 'Pierre' },
    { name: 'Sonede' },
    { name: 'Warda' }
  ];

  features: Feature[] = [
    {
      icon: 'siemens',
      translationKey: 'SIEMENS'
    },
    {
      icon: 'team',
      translationKey: 'TEAM'
    },
    {
      icon: 'global',
      translationKey: 'GLOBAL'
    },
    {
      icon: 'quality',
      translationKey: 'QUALITY'
    },
    {
      icon: 'innovation',
      translationKey: 'INNOVATION'
    },
    {
      icon: '24-7',
      translationKey: 'SUPPORT'
    }
  ];

  formationTypes: FormationType[] = [
    {
      icon: 'on-site',
      translationKey: 'ON_SITE',
      highlight: true
    },
    {
      icon: 'inter',
      translationKey: 'INTER',
      highlight: true
    },
    {
      icon: 'intra',
      translationKey: 'INTRA',
      highlight: true
    },
    {
      icon: 'online',
      translationKey: 'ONLINE',
      highlight: true
    }
  ];
}
