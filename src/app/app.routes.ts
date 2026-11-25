import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'reports' },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    title: 'Sprawozdania · AskData',
  },
  {
    path: 'reports/:id',
    loadComponent: () => import('./pages/report-detail/report-detail').then((m) => m.ReportDetail),
    title: 'Sprawozdanie · AskData',
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat').then((m) => m.Chat),
    title: 'Czat · AskData',
  },
  {
    path: 'similar',
    loadComponent: () => import('./pages/similar/similar').then((m) => m.Similar),
    title: 'Podobne sprawozdania · AskData',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Nie znaleziono · AskData',
  },
];
