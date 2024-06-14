import { Component, OnInit } from '@angular/core';
import { Chapter, Course, Module, UserStatement } from '../_types/learn';
import { EnvironmentInfo } from '../_types/equal';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { ActivatedRoute } from '@angular/router';
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
            this.isLoading = false;
            this.currentModuleProgressionIndex = this.learnService.currentModuleProgressionIndex;
            this.currentChapterProgressionIndex = this.learnService.currentChapterProgressionIndex;
            this.currentPageProgressionIndex = this.learnService.currentPageProgressionIndex;
            this.hasAccessToCourse = true;
            await this.SetQursusIframeListener();
        }
    }

    /**
     * Add a listener for the Qursus iframe
     * Receive the message from the Qursus iframe and handle it
     *
     */
    private async SetQursusIframeListener(): Promise<void> {
        window.addEventListener('message', async (event: MessageEvent): Promise<void> => {
            const qursusMessageEvent: QursusMessageEvent = event.data;
            const navigatorUrl: URL = new URL(window.location.href);
            console.log('AppComponent.SetQursusIframeListener => ' + qursusMessageEvent.type, qursusMessageEvent.data);

            if (event.origin === navigatorUrl.origin) {
                switch (qursusMessageEvent.type) {
                    case MessageEventEnum.EQ_ACTION_LEARN_NEXT:
                        await this.learnService.loadUserStatus();
                        this.userStatement = this.learnService.getUserStatement();
                        this.currentChapterProgressionIndex = qursusMessageEvent.data.chapter_index;
                        if (qursusMessageEvent.data.module_index !== this.currentModuleProgressionIndex) {
                            console.log('AppComponent.SetQursusIframeListener => EQ_ACTION_LEARN_NEXT');
                        }
                        break;
                    case MessageEventEnum.CHAPTER_REMOVED:
                        this.learnService.removeChapter(
                            qursusMessageEvent.data.module_id,
                            qursusMessageEvent.data.chapter_id,
                        );
                        if (this.course !== this.learnService.course) {
                            console.log('AppComponent.SetQursusIframeListener => CHAPTER_REMOVED');
                        }
                        this.course = this.learnService.course;

                        break;
                    case MessageEventEnum.PAGE_REMOVED:
                        await this.learnService.reloadChapter(
                            qursusMessageEvent.data.module_id,
                            qursusMessageEvent.data.chapter_id,
                        );

                        if (this.course !== this.learnService.course) {
                            console.log('AppComponent.SetQursusIframeListener => PAGE_REMOVED');
                        }

                        this.course = this.learnService.course;
                        break;
                    case MessageEventEnum.CHAPTER_PROGRESSION_FINISHED:
                        break;

                    case MessageEventEnum.MODULE_PROGRESSION_FINISHED:
                        this.currentModuleProgressionIndex = this.course.modules.findIndex(module => module.id === qursusMessageEvent.data.module_id) + 1;
                        this.currentChapterProgressionIndex = 0;
                        await this.learnService.loadUserStatus();
                        break;
                }
            }
        });
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
