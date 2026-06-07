import { Routes } from '@angular/router';
import { ApiTesterComponent } from './pages/api-tester/api-tester.component';

export const routes: Routes = [
  { path: '', component: ApiTesterComponent },
  { path: '**', redirectTo: '' },
];
