import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';
import { AdminGuard } from './core/guards/admin.guard';
import { ClientGuard } from './core/guards/client.guard';

const routes: Routes = [

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    //TODO: crear PublicGuard para que el usuario cuando este registrado no pueda volver al login.
    //canActivate: [],
    //canMatch: []
  },

  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    //canActivate: [ClientGuard],
    //canMatch: [ClientGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    //canActivate : [AdminGuard],
    //canMatch : [AdminGuard]
  },
  {
    path: 'notfound-404',
    component: Error404PageComponent,
  },
  //cuando los usuarios entran al path vacio '' exactamente vacio con el patMatch
  {
    path: '',
    redirectTo: 'auth',
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
