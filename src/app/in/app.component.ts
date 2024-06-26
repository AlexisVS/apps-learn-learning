import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Course, Module, UserStatement } from '../_types/learn';
import { AppInfo, EnvironmentInfo } from '../_types/equal';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { LearnService } from '../_services/Learn.service';
import { CompletionDialogComponent } from '../_components/completion-dialog/completion-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export enum MessageEventEnum {
    EQ_ACTION_LEARN_NEXT = 'eq_action_learn_next',
    QU_CHAPTER_ADDED = 'qu_chapter_added',
    QU_CHAPTER_REMOVED = 'qu_chapter_removed',
    QU_PAGE_REMOVED = 'qu_page_removed',
    QU_CHAPTER_PROGRESSION_FINISHED = 'qu_chapter_progression_finished',
    QU_MODULE_PROGRESSION_FINISHED = 'qu_module_progression_finished',
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
    public appInfo: AppInfo;

    public course: Course;
    public module: Module;
    public has_access_to_course: boolean = false;
    public is_loading: boolean = true;

    public mode: 'view' | 'edit' = 'view';
    public current_module_progression_index: number;
    public current_chapter_progression_index: number;
    public current_page_progression_index: number;

    public device: 'small' | 'large';

    constructor(
        private api: ApiService,
        private route: ActivatedRoute,
        private router: Router,
        private learnService: LearnService,
        private completionDialog: MatDialog,
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

        this.learnService.course_id = this.route.snapshot.params.id.toString();
        await this.learnService.getUserInfos();

        if (
            this.route.snapshot.queryParamMap.has('mode') &&
            await this.learnService.userHasAccessToCourseEditMode()
        ) {
            this.mode = this.route.snapshot.queryParams.mode;
        }

        await this.learnService.loadRessources(this.mode);

        if (this.route.snapshot.queryParamMap.has('module')) {

            const moduleIndex: number = this.learnService.course.modules.findIndex(module => module.id === +this.route.snapshot.queryParams.module);

            this.learnService.currentProgressionIndex = {
                module: moduleIndex,
                chapter: 0,
                page: 0,
            };

            if (this.route.snapshot.queryParamMap.has('chapter')) {
                this.learnService.currentProgressionIndex.chapter = +this.route.snapshot.queryParams.chapter;

                if (this.route.snapshot.queryParamMap.has('page')) {
                    this.learnService.currentProgressionIndex.page = +this.route.snapshot.queryParams.page;
                }
            }

            await this.learnService.loadCourseModule(this.route.snapshot.queryParams.module);
        }

        this.course = this.learnService.course;

        this.userStatement = this.learnService.getUserStatement();

        if (this.course) {
            this.module = this.course.modules[this.learnService.currentProgressionIndex.module];

            this.current_module_progression_index = this.learnService.currentProgressionIndex.module;
            this.current_chapter_progression_index = this.learnService.currentProgressionIndex.chapter;
            this.current_page_progression_index = this.learnService.currentProgressionIndex.page;

            this.has_access_to_course = true;
            this.is_loading = false;
        } else {
            await this.router.navigate(['**']);
        }

        window.addEventListener('message', (event: MessageEvent): void => {
            const navigatorUrl: URL = new URL(window.location.href);

            if (event.origin !== navigatorUrl.origin) {
                return;
            }

            try {
                event.data.hasOwnProperty('data') && event.data.hasOwnProperty('type')
                    ? console.table({ eventName: event.data.type, ...event.data.data })
                    : console.table({ eventName: event.data });

                this.handleQursusIframeEvent(event.data);
            } catch (error) {
                console.error('AppComponent.handleQursusIframeEvent =>', error);
                console.table({ eventName: event.data.type, ...event.data.data });
            }
        });
    }

    /**
     * Handle the Qursus iframe
     */
    private async handleQursusIframeEvent(event: QursusMessageEvent): Promise<void> {
        await this.learnService.loadUserStatus();
        this.userStatement = this.learnService.getUserStatement();

        switch (event.type) {
            case MessageEventEnum.QU_CHAPTER_REMOVED:
                this.learnService.removeChapter(
                    event.data.module_id,
                    event.data.chapter_id,
                );
                this.course = {... this.learnService.course };
                this.module = this.course.modules[this.current_module_progression_index];
                if (this.current_chapter_progression_index > this.module.chapters.length - 1) {
                    this.current_chapter_progression_index = this.module.chapters.length - 1;
                    this.learnService.currentProgressionIndex.chapter = this.current_chapter_progression_index;
                }
                break;

            case MessageEventEnum.QU_CHAPTER_ADDED:
                await this.learnService.loadChapter(
                    event.data.module_id,
                    event.data.chapter_id,
                );

                this.course = this.learnService.course;
                this.module = this.learnService.course.modules[this.current_module_progression_index];

                this.learnService.currentProgressionIndex.chapter = this.module.chapters.length - 1;
                this.current_chapter_progression_index = this.module.chapters.length - 1;
                this.learnService.currentProgressionIndex.page = 0;
                this.current_page_progression_index = 0;
                break;

            case MessageEventEnum.QU_PAGE_REMOVED:
                await this.learnService.loadChapter(
                    event.data.module_id,
                    event.data.chapter_id,
                );
                this.course = this.learnService.course;
                break;

            case MessageEventEnum.EQ_ACTION_LEARN_NEXT:
                this.learnService.currentProgressionIndex.chapter = event.data.chapter_index;
                this.current_chapter_progression_index = event.data.chapter_index;

                break;

            case MessageEventEnum.QU_CHAPTER_PROGRESSION_FINISHED:
                let chapter_index: number = event.data.chapter_index;

                if (this.course.modules[this.current_module_progression_index].chapters[chapter_index + 1]) {
                    ++chapter_index;
                }

                this.learnService.currentProgressionIndex = {
                    ...this.learnService.currentProgressionIndex,
                    chapter: chapter_index,
                    page: 0,
                };

                this.current_chapter_progression_index = chapter_index;
                break;

            case MessageEventEnum.QU_MODULE_PROGRESSION_FINISHED:
                const module_index: number = this.course.modules.findIndex(module => module.id === event.data.module_id);
                const next_module: Module = this.course.modules[module_index + 1];

                if (next_module && !this.userStatement.userStatus.find(userStatus => userStatus.module_id === next_module.id) !== undefined) {
                    this.learnService.userStatus = this.userStatement.userStatus.map(userStatus => {
                        if (userStatus.module_id !== event.data.module_id) {
                            return userStatus;
                        }

                        return {
                            ...userStatus,
                            is_complete: true,
                        };
                    });

                    this.userStatement = this.learnService.getUserStatement();

                    if (!next_module) {
                        return;
                    }

                    this.course = await this.learnService.loadCourseModule(next_module.id);

                    this.openModuleCompletionDialog();
                }
                break;
        }
    }

    /**
     * @see LearnService.loadCourseModule
     * @param data
     */
    public async onModuleClick(data: { module_id: number, chapter_id: number }): Promise<void> {
        this.course = await this.learnService.loadCourseModule(data.module_id);
    }

    /**
     * Used when the user has finished a module.
     * @private
     */
    private openModuleCompletionDialog(): void {
        this.completionDialog.closeAll();

        const dialogRef: MatDialogRef<CompletionDialogComponent> = this.completionDialog.open(CompletionDialogComponent, {
            data: { next: false },
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (result) {
                const next_module_index: number = this.current_module_progression_index + 1;

                this.learnService.currentProgressionIndex = {
                    module: next_module_index,
                    chapter: 0,
                    page: 0,
                };

                await this.learnService.loadUserStatus();
                this.userStatement = this.learnService.getUserStatement();

                this.module = this.course.modules[next_module_index];

                this.current_module_progression_index = next_module_index;
                this.current_chapter_progression_index = 0;
                this.current_page_progression_index = 0;

                this.completionDialog.closeAll();
            }
        });
    }

    public async setCurrentNavigation($event: { module_index: number; chapter_index: number }): Promise<void> {
        this.current_module_progression_index = $event.module_index;
        this.current_chapter_progression_index = $event.chapter_index;
        this.current_page_progression_index = 0;

        this.learnService.currentProgressionIndex = {
            module: this.current_module_progression_index,
            chapter: this.current_chapter_progression_index,
            page: this.current_page_progression_index,
        };

        if (this.module.id !== this.course.modules[this.current_module_progression_index].id) {
            await this.learnService.loadCourseModule(this.course.modules[this.current_module_progression_index].id);

            this.module = this.course.modules[this.current_module_progression_index];
        }
    }
}
