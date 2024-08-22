import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';

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
    path: 'notfound-404',
    component: Error404PageComponent,
  },
  //cuando los usuarios entran al path vacio '' exactamente vacio con el patMatch
  {
    path: '',
    redirectTo: 'visitor',
    pathMatch:'full'
  },
  //cualquier otra ruta que sea diferente a las mencionadas mostrara el componente notfound-404.
  {
    path: '**',
    redirectTo: 'notfound-404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
