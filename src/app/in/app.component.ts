import { Component, OnInit } from '@angular/core';
import { Chapter, Course, Module, UserStatement } from '../_types/learn';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { ActivatedRoute } from '@angular/router';
import { LearnService } from '../_services/Learn.service';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'app',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
    public userStatement: UserStatement;
    public environnementInfo: Record<string, any>;
    public appInfo: Record<string, any>;

    public course: Course;
    public hasAccessToCourse: boolean = false;
    public isLoading: boolean = true;

    public currentModuleProgressionIndex: number;
    public currentChapterProgressionIndex: number;

    public device: 'small' | 'large';

    constructor(
        private api: ApiService,
        private route: ActivatedRoute,
        private learnService: LearnService,
    ) {
    }

    public ngOnInit(): void {
        if (window.innerWidth < 1024) {
            this.device = 'small';
        } else {
            this.device = 'large';
        }

        this.load();
    }

    private async load(): Promise<void> {
        this.environnementInfo = await this.api.get('appinfo/learn/learning');
        this.appInfo = await this.api.get('envinfo');

        await this.learnService.loadRessources();
        this.userStatement = this.learnService.getUserStatement();
        this.course = this.learnService.course;

        if (this.course) {
            this.isLoading = false;
            this.currentModuleProgressionIndex = this.learnService.currentModuleProgressionIndex;
            this.currentChapterProgressionIndex = this.learnService.currentChapterProgressionIndex;
            this.hasAccessToCourse = true;
        }
    }

    public async onModuleClick(moduleId: number): Promise<void> {
        this.course = await this.learnService.loadCourseModule(moduleId);
    }

    public onStarredLessonClick(event: MouseEvent, lesson: Chapter, module: Module): void {
        // if (lesson.hasOwnProperty('starred')) {
        //     lesson.starred = !lesson.starred;
        // } else {
        //     lesson.starred = true;
        // }
    }
}
