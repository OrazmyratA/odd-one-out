import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherComponent } from './components/teacher/teacher';
import { StudentComponent } from './pages/student/student';

const routes: Routes = [
  { path: '', component: TeacherComponent },
  { path: 'student', component: StudentComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true, 
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }