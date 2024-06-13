import { Component, OnInit } from '@angular/core';
import { Chapter, Course, Module, UserStatement } from '../_types/learn';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { ActivatedRoute } from '@angular/router';
import { LearnService } from '../_services/Learn.service';
import { MessageEventEnum, QursusMessageEvent } from '../_types/qursus';

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

        await this.learnService.loadRessources(+this.route.snapshot.params.id);
        this.userStatement = this.learnService.getUserStatement();
        this.course = this.learnService.course;

        if (this.course) {
            this.isLoading = false;
            this.currentModuleProgressionIndex = this.learnService.currentModuleProgressionIndex;
            this.currentChapterProgressionIndex = this.learnService.currentChapterProgressionIndex;
            this.hasAccessToCourse = true;
            this.SetQursusIframeListener();
        }
    }

    // TODO: Finish this method
    /**
     * Add a listener for the Qursus iframe
     * Receive the message from the Qursus iframe and handle it
     *
     */
    private SetQursusIframeListener(): void {
        window.addEventListener('message', (event: MessageEvent) => {
            const qursusMessageEvent: QursusMessageEvent = event.data;

            // get the scheme + domain of the navigator
            const url: URL = new URL(window.location.href);

            if (event.origin === url.origin) {
                switch (qursusMessageEvent.type) {
                    case MessageEventEnum.EQ_ACTION_LEARN_NEXT:
                        break;
                    case MessageEventEnum.CHAPTER_REMOVED:
                        break;
                    case MessageEventEnum.PAGE_REMOVED:
                        break;
                }
            }
        });
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
