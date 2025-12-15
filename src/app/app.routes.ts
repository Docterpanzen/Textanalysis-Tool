import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
