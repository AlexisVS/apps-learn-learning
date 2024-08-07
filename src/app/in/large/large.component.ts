import {
    Component,
    ElementRef,
    EventEmitter,
    Input, OnChanges, OnInit,
    Output, SimpleChanges,
    ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Chapter, Course, Module, UserStatement, UserStatus } from '../../_types/learn';
import { AppInfo, EnvironmentInfo } from '../../_types/equal';

type DrawerState = 'inactive' | 'active' | 'pinned';

@Component({
    selector: 'app-large',
    templateUrl: './large.component.html',
    styleUrls: ['./large.component.scss'],
})
export class LargeComponent implements OnInit, OnChanges {
    @ViewChild('drawer', { static: true }) drawer: ElementRef<HTMLDivElement>;
    @ViewChild('sideBarMenuButton') sideBarMenuButton: MatButton;

    @Input() public userStatement: UserStatement;
    @Input() public environnementInfo: EnvironmentInfo;
    @Input() public appInfo: AppInfo;
    @Input() public course: Course;
    @Input() public module: Module;
    @Input() public chapter: Chapter;
    @Input() public has_access_to_course: boolean;
    @Input() public is_loading: boolean;
    @Input() public mode: 'view' | 'edit';
    @Input() public current_module_progression_index: number;
    @Input() public current_chapter_progression_index: number;
    @Input() public current_page_progression_index: number;

    @Output() public moduleAndChapterToLoad = new EventEmitter<{
        module_id: number,
        chapter_id: number
    }>();

    @Output() public setCurrentNavigation = new EventEmitter<{
        module_index: number,
        chapter_index: number
    }>();

    public modules: Module[];

    public drawer_state: DrawerState = 'inactive';
    public menu_icon: string = 'menu';

    /** Used for drawer open/close state and drawer chapter selection */
    public selected_module_index: number = 0;

    /** Used for drawer chapter selection */
    public currentNavigation: { module_id: number, chapter_index: number } | null = null;

    constructor() {
        this.onClickOutsideActiveStateDrawer();
        this.qursusIframeClickedInside();
    }

    public ngOnInit(): void {
        if (this.course) {
            this.modules = this.course.modules;
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (
            changes.hasOwnProperty('course') &&
            changes.course.previousValue !== changes.course.currentValue
        ) {
            this.modules = [...this.course.modules];
        }
    }

    private qursusIframeClickedInside(): void {
        window.addEventListener('message', (event: MessageEvent): void => {

            // get the scheme + domain of the navigator
            const url: URL = new URL(window.location.href);

            if (event.origin === url.origin && this.drawer_state === 'active') {
                this.drawer_state = 'inactive';
                this.menu_icon = 'menu';
            }
        });
    }

    private onClickOutsideActiveStateDrawer(): void {
        window.addEventListener('click', (event: MouseEvent): void => {
            if (
                this.drawer_state === 'active' &&
                !this.sideBarMenuButton._elementRef.nativeElement.contains(event.target as Node)
            ) {
                if (!this.drawer.nativeElement.contains(event.target as Node)) {
                    this.drawer_state = 'inactive';
                    this.menu_icon = 'menu';
                }
            }
        });
    }

    public trackByModuleId(index: number, module: Module): number {
        return module.id;
    }

    public trackByChapterId(index: number, chapter: any): number {
        return chapter.id;
    }

    public onDrawerButtonClick(): void {
        switch (this.drawer_state) {
            case 'inactive':
                this.drawer_state = 'active';
                this.menu_icon = 'push_pin';
                break;
            case 'active':
                this.drawer_state = 'pinned';
                this.menu_icon = 'close';
                break;
            case 'pinned':
                this.drawer_state = 'inactive';
                this.menu_icon = 'menu';
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

    public getUserStatusChapterIndex(module_id: number): number {
        let chapter_index: number = 0;

        if (this.mode === 'edit') {
            return chapter_index;
        }

        const chapterStatus: UserStatus | undefined = this.userStatement.userStatus.find(userStatus => userStatus.module_id === module_id);

        if (chapterStatus) {
            chapter_index = chapterStatus.chapter_index;

            if (chapterStatus?.is_complete) {
                const module_index: number = this.modules.findIndex(module => module.id === module_id);
                chapter_index = this.modules[module_index].chapters.length;
            }
        }

        return chapter_index;
    }

    public async onClickChapter(module_id: number, chapter_id: number): Promise<void> {
        this.moduleAndChapterToLoad.emit({ module_id: module_id, chapter_id: chapter_id });
        const module_index: number = this.modules.findIndex(module => module.id === module_id);
        const chapter_index: number = this.modules[module_index].chapters.findIndex(chapter => chapter.id === chapter_id);

        if (this.mode === 'edit') {
            this.setCurrentNavigation.emit({
                module_index: module_index,
                chapter_index: chapter_index,
            });
        }

        if (
            module_index === this.current_module_progression_index &&
            chapter_index === this.current_chapter_progression_index
        ) {
            this.currentNavigation = null;
        } else {
            this.currentNavigation = { module_id: module_id, chapter_index: chapter_index };
        }
    }
}
