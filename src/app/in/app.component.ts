import { Component, OnInit } from '@angular/core';
import { Chapter, Course, Module, UserStatement } from '../_types/learn';
import { EnvironmentInfo } from '../_types/equal';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { LearnService } from '../_services/Learn.service';

export enum MessageEventEnum {
    EQ_ACTION_LEARN_NEXT = 'eq_action_learn_next',
    CHAPTER_REMOVED = 'chapter_removed',
    PAGE_REMOVED = 'page_removed',
    CHAPTER_PROGRESSION_FINISHED = 'chapter_progression_finished',
    MODULE_PROGRESSION_FINISHED = 'module_progression_finished',
}

export type QursusMessageEvent = {
    type: MessageEventEnum;
    data: any;
};


@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'app',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
    public userStatement: UserStatement;
    public environnementInfo: EnvironmentInfo;
    public appInfo: Record<string, any>;

    public course: Course;
    public hasAccessToCourse: boolean = false;
    public isLoading: boolean = true;

    public currentModuleProgressionIndex: number;
    public currentChapterProgressionIndex: number;
    public currentPageProgressionIndex: number;

    public device: 'small' | 'large';

    constructor(
        private api: ApiService,
        private route: ActivatedRoute,
        private router: Router,
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

        await this.learnService.loadRessources(+this.route.snapshot.params.id);
        this.userStatement = this.learnService.getUserStatement();
        this.course = this.learnService.course;

        if (this.course) {
            this.currentModuleProgressionIndex = this.learnService.currentModuleProgressionIndex;
            this.currentChapterProgressionIndex = this.learnService.currentChapterProgressionIndex;
            this.currentPageProgressionIndex = this.learnService.currentPageProgressionIndex;
            this.hasAccessToCourse = true;
            this.isLoading = false;
        } else {
            await this.router.navigate(['**']);
        }

        window.addEventListener('message', (event: MessageEvent): void => {
            const navigatorUrl: URL = new URL(window.location.href);
            if (event.origin !== navigatorUrl.origin) {
                return;
            }
            this.handleQursusIframeEvent(event);
        });
    }

    /**
     * Handle the Qursus iframe
     */
    private async handleQursusIframeEvent(event: MessageEvent): Promise<void> {
        const qursusMessageEvent: QursusMessageEvent = event.data;

        event.data.hasOwnProperty('type') && event.data.hasOwnProperty('data')
            ? console.table({ name: qursusMessageEvent.type, ...qursusMessageEvent.data })
            : console.table({ name: event.data });

        switch (qursusMessageEvent.type) {
            case MessageEventEnum.EQ_ACTION_LEARN_NEXT:
                this.learnService.currentChapterProgressionIndex = qursusMessageEvent.data.chapter_index;
                await this.learnService.loadUserStatus();
                this.userStatement = this.learnService.getUserStatement();
                this.currentChapterProgressionIndex = qursusMessageEvent.data.chapter_index;
                break;

            case MessageEventEnum.CHAPTER_REMOVED:
                this.learnService.removeChapter(
                    qursusMessageEvent.data.module_id,
                    qursusMessageEvent.data.chapter_id,
                );
                this.course = this.learnService.course;
                break;

            case MessageEventEnum.PAGE_REMOVED:
                await this.learnService.reloadChapter(
                    qursusMessageEvent.data.module_id,
                    qursusMessageEvent.data.chapter_id,
                );
                this.course = this.learnService.course;
                break;

            case MessageEventEnum.CHAPTER_PROGRESSION_FINISHED:
                await this.learnService.loadUserStatus();
                this.userStatement.userStatus = this.learnService.userStatus;
                this.currentChapterProgressionIndex = qursusMessageEvent.data.chapter_index;
                break;

            case MessageEventEnum.MODULE_PROGRESSION_FINISHED:
                this.currentModuleProgressionIndex = this.course.modules.findIndex(module => module.id === qursusMessageEvent.data.module_id);

                const next_course_id: number = this.course.modules[this.currentModuleProgressionIndex + 1].id;
                this.course = await this.learnService.loadCourseModule(next_course_id);

                await this.learnService.loadUserStatus();
                this.userStatement.userStatus = this.learnService.userStatus;

                this.currentChapterProgressionIndex = 0;
                this.currentPageProgressionIndex = 0;
                break;
        }
    }

    public async onModuleClick(data: { moduleId: number, chapterId: number }): Promise<void> {
        this.course = await this.learnService.loadCourseModule(data.moduleId);
    }

    public onStarredLessonClick(event: MouseEvent, lesson: Chapter, module: Module): void {
        // if (lesson.hasOwnProperty('starred')) {
        //     lesson.starred = !lesson.starred;
        // } else {
        //     lesson.starred = true;
        // }
    }
}
