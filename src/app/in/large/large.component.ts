import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Course, Module, UserStatement } from '../../_types/learn';
import { AppInfo, EnvironmentInfo } from '../../_types/equal';
import { MatDialog } from '@angular/material/dialog';
import { CompletionDialogComponent } from '../../_components/completion-dialog/completion-dialog.component';

type DrawerState = 'inactive' | 'active' | 'pinned';

@Component({
    selector: 'app-large',
    templateUrl: './large.component.html',
    styleUrls: ['./large.component.scss'],
})
export class LargeComponent {
    @ViewChild('drawer', { static: true }) drawer: ElementRef<HTMLDivElement>;
    @ViewChild('sideBarMenuButton') sideBarMenuButton: MatButton;

    @Input() public userStatement: UserStatement;
    @Input() public environnementInfo: EnvironmentInfo;
    @Input() public appInfo: AppInfo;
    @Input() public course: Course;
    @Input() public hasAccessToCourse: boolean;
    @Input() public isLoading: boolean;
    @Input() public currentModuleProgressionIndex: number;
    @Input() public currentChapterProgressionIndex: number;
    @Input() public currentPageProgressionIndex: number;

    @Output() public moduleAndChapterToLoad: EventEmitter<{ moduleId: number, chapterId: number }> = new EventEmitter<{
        moduleId: number,
        chapterId: number
    }>();

    @Output() public nextModuleEvent: EventEmitter<{ module_id: number }> = new EventEmitter<{ module_id: number }>();

    public drawerState: DrawerState = 'inactive';
    public menuIcon: string = 'menu';

    /** Used for drawer open/close state and drawer chapter selection */
    public selectedModuleIndex: number = 0;

    /** Used for drawer chapter selection */
    public currentNavigation: { module_id: number, chapter_index: number } | null = null;

    constructor(
        public completionDialog: MatDialog,
    ) {
        this.onClickOutsideActiveStateDrawer();
        this.qursusIframeClickedInside();
    }

    private qursusIframeClickedInside(): void {
        window.addEventListener('message', (event: MessageEvent): void => {

            // get the scheme + domain of the navigator
            const url: URL = new URL(window.location.href);

            if (event.origin === url.origin && this.drawerState === 'active') {
                this.drawerState = 'inactive';
                this.menuIcon = 'menu';
            }
        });
    }

    private onClickOutsideActiveStateDrawer(): void {
        window.addEventListener('click', (event: MouseEvent): void => {
            if (
                this.drawerState === 'active' &&
                !this.sideBarMenuButton._elementRef.nativeElement.contains(event.target as Node)
            ) {
                if (!this.drawer.nativeElement.contains(event.target as Node)) {
                    this.drawerState = 'inactive';
                    this.menuIcon = 'menu';
                }
            }
        });
    }

    public onDrawerButtonClick(): void {
        switch (this.drawerState) {
            case 'inactive':
                this.drawerState = 'active';
                this.menuIcon = 'push_pin';
                break;
            case 'active':
                this.drawerState = 'pinned';
                this.menuIcon = 'close';
                break;
            case 'pinned':
                this.drawerState = 'inactive';
                this.menuIcon = 'menu';
                break;
        }
    }

    public computeDuration(duration: number): string {
        const hours: number = Math.floor(duration / 60);
        const minutes: number = duration % 60;

        if (hours === 0) {
            return `${minutes}min`;
        } else {
            return `${hours}h ${minutes}min`;
        }
    }

    public getUserStatusChapterIndex(moduleId: number): number {
        const chapterStatus = this.userStatement.userStatus.find(userStatus => userStatus.module_id === moduleId);

        let chapterIndex = 0;

        if (chapterStatus) {
            chapterIndex = chapterStatus.chapter_index;

            if (chapterStatus?.is_complete) {
                const moduleIndex: number = this.course.modules.findIndex(module => module.id === moduleId);
                chapterIndex = this.course.modules[moduleIndex].chapters.length;
            }
        }

        return chapterIndex;
    }

    public async onClickChapter(moduleId: number, chapterId: number): Promise<void> {
        this.moduleAndChapterToLoad.emit({ moduleId, chapterId });
        const moduleIndex: number = this.course.modules.findIndex(module => module.id === moduleId);
        const chapterIndex: number = this.course.modules[moduleIndex].chapters.findIndex(chapter => chapter.id === chapterId);

        if (moduleIndex === this.currentModuleProgressionIndex && chapterIndex === this.currentChapterProgressionIndex) {
            this.currentNavigation = null;
        }

        this.currentNavigation = { module_id: moduleId, chapter_index: chapterIndex };
    }

    public openModuleCompletionDialog(): void {
        this.completionDialog.closeAll();
        const dialogRef = this.completionDialog.open(CompletionDialogComponent, {
            data: { next: false },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const currentModuleId: number = this.course.modules[this.currentModuleProgressionIndex].id;
                const nextModule: Module = this.course.modules[this.currentModuleProgressionIndex + 1];
                const nextModuleId: number = nextModule.id;
                const nextChapterId: number = nextModule.chapters.sort((a, b) => a.order - b.order)[0].id;
                this.moduleAndChapterToLoad.emit({ moduleId: nextModuleId, chapterId: nextChapterId });
                this.nextModuleEvent.emit({ module_id: currentModuleId });

                this.currentModuleProgressionIndex = this.currentModuleProgressionIndex + 1;

                this.completionDialog.closeAll();
            }
            console.log('openModuleCompletionDialog => ', result);
        });

    }
}
