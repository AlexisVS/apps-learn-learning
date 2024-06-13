import { NgModule } from '@angular/core';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AppComponent } from './in/app.component';
import { CourseNotFoundComponent } from './in/course-not-found/course-not-found.component';

const routes: Route[] = [
    {
        path: 'course/:id/:slug',
        component: AppComponent,
    },
    {
        path: '',
        redirectTo: '**',
    },
    {
        path: '**',
        component: CourseNotFoundComponent,
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            preloadingStrategy: PreloadAllModules,
            onSameUrlNavigation: 'reload',
            useHash: true,
        }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
