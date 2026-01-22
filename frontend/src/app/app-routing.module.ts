import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ItemShopComponent } from './pages/item-shop/item-shop.component';
import { AuthGuard } from './face-login/auth.guard';

const routes: Routes = [
  // { path: 'socket-events', loadChildren: () => import('./pages/socket-events/socket-events.module').then(m => m.SocketEventsModule) },
  // Unprotected routes
  { path: 'face-login', loadChildren: () => import('./face-login/face-login.module').then(m => m.FaceLoginModule) },
  { path: 'locked', loadChildren: () => import('./pages/locked/locked.module').then(m => m.LockedModule) },
  // Protected routes (require authentication)
  { path: 'tasks', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/tasks/tasks.module').then(m => m.TasksModule) },
  { path: 'dashboard', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'medications', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/medications/medications.module').then(m => m.MedicationsModule) },
  { path: 'history', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/history/history.module').then(m => m.HistoryModule) },
  { path: 'schedule', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/schedule/schedule.module').then(m => m.ScheduleModule) },
  { path: 'emergency', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/emergency/emergency.module').then(m => m.EmergencyModule) },
  { path: 'assistive-controls', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/assistive-controls/assistive-controls.module').then(m => m.AssistiveControlsModule) },
  //{ path: 'smartwatch', loadChildren: () => import('./pages/smartwatch/smartwatch.module').then(m => m.SmartwatchModule) },
  { path: 'home', canActivate: [AuthGuard], canLoad: [AuthGuard], canMatch: [AuthGuard], loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
  { path: 'item-shop', component: ItemShopComponent, canActivate: [AuthGuard], canMatch: [AuthGuard] },
  // Default routes (must be last)
  { path: '', redirectTo: 'face-login', pathMatch: 'full' },
  { path: '**', redirectTo: 'face-login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
