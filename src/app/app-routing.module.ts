import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  {
    path: 'visitor',
    loadChildren: () => import('./visitor/visitor.module').then(m => m.VisitorModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    //canActivate: [ClientGuard], AQUI TENGO QUE APRENDER A APLICAR LOS GUARDS PARA PROTEGER LAS RUTAS DEL LOGIN.
    //canLoad: [ClientGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    //canActivate : [AdminGuard],
    //canLoad : [AdminGuard]
  },
  {
    path: '**',
    redirectTo: 'visitor'
  }


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
