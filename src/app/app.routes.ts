import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    // Painel atual, intacto, enquanto cada tela migra — ver
    // `plan/reconstrucao-painel-plan.md`. Faz seu próprio login (sessão
    // isolada do painel novo) e não depende do AuthGuard.
    path: 'legado',
    loadComponent: () => import('./legacy/app').then((m) => m.LegacyPanel),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/shell/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
        data: { titulo: 'dashboard.titulo' },
      },
      {
        path: 'administradores',
        loadComponent: () => import('./features/administradores/administradores-page/administradores-page').then((m) => m.AdministradoresPage),
        data: { titulo: 'admin.titulo' },
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios-page/usuarios-page').then((m) => m.UsuariosPage),
        data: { titulo: 'usuarios.titulo' },
      },
      {
        path: 'geografia/paises',
        loadComponent: () => import('./features/geografia/paises-list-page/paises-list-page').then((m) => m.PaisesListPage),
        data: { titulo: 'geo.paisesTitulo' },
      },
      {
        path: 'geografia/paises/:id',
        loadComponent: () => import('./features/geografia/pais-detail-page/pais-detail-page').then((m) => m.PaisDetailPage),
        data: { titulo: 'geo.paisesTitulo' },
      },
      {
        path: 'geografia/cidades',
        loadComponent: () => import('./features/geografia/cidades-list-page/cidades-list-page').then((m) => m.CidadesListPage),
        data: { titulo: 'geo.cidadesTitulo' },
      },
      {
        path: 'geografia/cidades/:id',
        loadComponent: () => import('./features/geografia/cidade-detail-page/cidade-detail-page').then((m) => m.CidadeDetailPage),
        data: { titulo: 'geo.cidadesTitulo' },
      },
      {
        path: 'lugares',
        loadComponent: () => import('./features/lugares/lugares-list-page/lugares-list-page').then((m) => m.LugaresListPage),
        data: { titulo: 'lugares.titulo' },
      },
      {
        path: 'lugares/:id',
        loadComponent: () => import('./features/lugares/lugar-detail-page/lugar-detail-page').then((m) => m.LugarDetailPage),
        data: { titulo: 'lugares.titulo' },
      },
      {
        path: 'lugares-relevantes',
        loadComponent: () => import('./features/lugares-relevantes/lugares-relevantes-page/lugares-relevantes-page').then((m) => m.LugaresRelevantesPage),
        data: { titulo: 'relevantes.titulo' },
      },
      {
        path: 'viagens',
        loadComponent: () => import('./features/viagens/viagens-page/viagens-page').then((m) => m.ViagensPage),
        data: { titulo: 'viagens.titulo' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
