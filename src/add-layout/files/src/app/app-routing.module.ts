import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginFormComponent } from './shared/components';
import { AuthGuardService } from './shared/services';
import { DxDataGridModule, DxFormModule } from 'devextreme-angular';

const routes: Routes = [
    {
        path: 'login-form',
        component: LoginFormComponent,
        canActivate: [ AuthGuardService ]
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
        canActivate: [ AuthGuardService ]
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), DxDataGridModule, DxFormModule],
  providers: [AuthGuardService],
  exports: [RouterModule]
})
export class AppRoutingModule { }
