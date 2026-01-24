import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { Shell } from './layout/shell/shell';
import { AdminLogin } from './pages/admin-login/admin-login';
import { AdminRuns } from './pages/admin-runs/admin-runs';
import { AdminTexts } from './pages/admin-texts/admin-texts';
import { Dashboard } from './pages/dashboard/dashboard';
import { Documentation } from './pages/documentation/documentation';
import { Input } from './pages/input/input';
import { Plagiatchecker } from './pages/plagiatchecker/plagiatchecker';
import { Textanalyse } from './pages/textanalyse/textanalyse';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: 'input', component: Input },
      { path: 'dashboard', component: Dashboard },
      { path: 'textanalyse', component: Textanalyse },
      { path: 'documentation', component: Documentation },
      { path: 'plagiatchecker', component: Plagiatchecker },
      {
        path: 'admin',
        component: AdminShell,
        canActivateChild: [adminAuthGuard],
        children: [
          { path: 'login', component: AdminLogin },
          { path: 'texts', component: AdminTexts },
          { path: 'runs', component: AdminRuns },
          { path: '', redirectTo: 'texts', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
