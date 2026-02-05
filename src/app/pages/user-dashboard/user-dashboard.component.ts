import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Course {
  id: number;
  title: string;
  image: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
  category: string;
}

interface Certificate {
  id: number;
  courseName: string;
  issueDate: string;
  certificateId: string;
  status: 'completed' | 'in-progress';
  downloadUrl?: string;
}

interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
  completedCourses: number;
  certificatesEarned: number;
  totalHours: number;
  avatar: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  activeTab: string = 'courses';
  userProfile: UserProfile = {
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    memberSince: 'Janvier 2024',
    completedCourses: 5,
    certificatesEarned: 3,
    totalHours: 87,
    avatar: 'https://ui-avatars.com/api/?name=Jean+Dupont&background=0066cc&color=fff&size=200'
  };

  myCourses: Course[] = [
    {
      id: 1,
      title: 'Introduction à la Pasteurisation',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
      progress: 75,
      totalLessons: 12,
      completedLessons: 9,
      lastAccessed: '2024-02-03',
      category: 'Technologie Alimentaire'
    },
    {
      id: 2,
      title: 'Automatisme Industriel Avancé',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
      progress: 45,
      totalLessons: 20,
      completedLessons: 9,
      lastAccessed: '2024-02-01',
      category: 'Automatisme'
    },
    {
      id: 3,
      title: 'Supervision et SCADA',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
      progress: 100,
      totalLessons: 15,
      completedLessons: 15,
      lastAccessed: '2024-01-28',
      category: 'Supervision'
    },
    {
      id: 4,
      title: 'Maintenance Préventive',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop',
      progress: 20,
      totalLessons: 18,
      completedLessons: 4,
      lastAccessed: '2024-01-25',
      category: 'Maintenance'
    }
  ];

  favoriteCourses: Course[] = [
    {
      id: 1,
      title: 'Introduction à la Pasteurisation',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
      progress: 75,
      totalLessons: 12,
      completedLessons: 9,
      lastAccessed: '2024-02-03',
      category: 'Technologie Alimentaire'
    },
    {
      id: 5,
      title: 'IoT et Industrie 4.0',
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=400&fit=crop',
      progress: 0,
      totalLessons: 16,
      completedLessons: 0,
      lastAccessed: '',
      category: 'Nouvelles Technologies'
    },
    {
      id: 3,
      title: 'Supervision et SCADA',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
      progress: 100,
      totalLessons: 15,
      completedLessons: 15,
      lastAccessed: '2024-01-28',
      category: 'Supervision'
    }
  ];

  certificates: Certificate[] = [
    {
      id: 1,
      courseName: 'Supervision et SCADA',
      issueDate: '2024-01-28',
      certificateId: 'SMS2I-CERT-2024-001',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 2,
      courseName: 'Programmation PLC Siemens S7',
      issueDate: '2023-12-15',
      certificateId: 'SMS2I-CERT-2023-089',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 3,
      courseName: 'Sécurité Machine',
      issueDate: '2023-11-10',
      certificateId: 'SMS2I-CERT-2023-067',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 4,
      courseName: 'Introduction à la Pasteurisation',
      issueDate: '',
      certificateId: 'En cours',
      status: 'in-progress'
    }
  ];

  ngOnInit() {
    // Load user data from localStorage
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (userEmail) {
      this.userProfile.email = userEmail;
    }
    if (userName) {
      this.userProfile.name = userName;
      this.userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0066cc&color=fff&size=200`;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  continueCourse(courseId: number) {
    // Navigate to course
    window.location.href = `/course/${courseId}`;
  }

  downloadCertificate(certificate: Certificate) {
    if (certificate.downloadUrl) {
      console.log('Downloading certificate:', certificate.certificateId);
      // In a real app, this would trigger a download
      alert(`Téléchargement du certificat ${certificate.certificateId}`);
    }
  }

  removeFavorite(courseId: number) {
    this.favoriteCourses = this.favoriteCourses.filter(c => c.id !== courseId);
  }
}
