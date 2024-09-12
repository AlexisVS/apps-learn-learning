import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Chapter, Course, Module, UserStatement, UserStatus } from '../../_types/learn';
import { AppInfo } from '../../_types/equal';

type TotalCourseProgress = {
    current: string;
    total: string;
    currentPourcentage: string;
};

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
})
export class TopBarComponent implements OnInit, OnChanges {
    @Input() public userStatement: UserStatement;
    @Input() public course: Course;
    @Input() public module: Module;
    @Input() public chapter: Chapter;
    @Input() public appInfo: AppInfo;
    @Input() public mode: 'view' | 'edit';
    @Input() public current_chapter_progression_index: number;
    @Input() public current_page_progression_index: number;

    /* Used to display the current module progression */
    public current_module_progress: string;

    /* Used to display the current lesson progression */
    public current_lesson_progress: string;

    /* Used to display the current total course progression */
    public currentTotalCourseProgress: TotalCourseProgress = {} as TotalCourseProgress;

    ngOnInit(): void {
        this.loadStats();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            (
                changes.hasOwnProperty('userStatement') &&
                !changes.userStatement.isFirstChange() &&
                changes.userStatement.currentValue !== changes.userStatement.previousValue
            ) || (
                changes.hasOwnProperty('course') &&
                !changes.course.isFirstChange() &&
                changes.course.currentValue !== changes.course.previousValue
            ) || (
                changes.hasOwnProperty('module') &&
                !changes.module.isFirstChange() &&
                changes.module.currentValue !== changes.module.previousValue
            ) || (
                changes.hasOwnProperty('chapter') &&
                !changes.chapter.isFirstChange() &&
                changes.chapter.currentValue !== changes.chapter.previousValue
            ) || (
                changes.hasOwnProperty('current_chapter_progression_index') &&
                !changes.current_chapter_progression_index.isFirstChange() &&
                changes.current_chapter_progression_index.currentValue !== changes.current_chapter_progression_index.previousValue
            ) || (
                changes.hasOwnProperty('current_page_progression_index') &&
                !changes.current_page_progression_index.isFirstChange() &&
                changes.current_page_progression_index.currentValue !== changes.current_page_progression_index.previousValue
            )
        ) {
            this.loadStats();
        }
    }

    private loadStats(): void {
        if (
            this.course.modules && this.course.modules.length > 0 &&
            this.module && this.module.chapters && this.module.chapters.length > 0
        ) {
            this.computeCurrentModuleProgress();
            this.computeCurrentLessonProgress();
            this.computeProgressTotalStats();
        }
    }

    public computeCurrentModuleProgress(): void {
        let module_progress: number = 0;

        if (this.mode === 'edit') {
            module_progress = this.course.modules.findIndex(module => module.id === this.module.id) + 1;
        }

        if (this.mode === 'view' && this.userStatement.userStatus.length > 0) {
            module_progress = this.userStatement.userStatus.length - 1;

            if (this.userStatement.userStatus[0].is_complete) {
                module_progress += 1;
            }
        }

        this.current_module_progress = `${module_progress} / ${this.course.modules.length} - ${this.computeDuration(this.module.duration)}`;
    }

    public computeCurrentLessonProgress(): void {
        let current_chapter_index: number = 0;

        if (this.mode === 'view') {
            const module_complete: boolean = this.userStatement.userStatus.find(userStatus => userStatus.module_id === this.module.id)?.is_complete == true;
            current_chapter_index = this.current_chapter_progression_index;
            if (module_complete) {
                current_chapter_index = this.module.chapters.length;
            }
        }

        if (this.mode === 'edit') {
            current_chapter_index = this.current_chapter_progression_index + 1;
        }

        const chapter_count: number = this.module.chapters.length;

        if (this.chapter === undefined) {
            this.chapter = this.module.chapters[this.current_chapter_progression_index - 1];
        }

        const page_count: number = this.chapter.page_count;

        this.current_lesson_progress = `${current_chapter_index} / ${chapter_count} - ${this.computeDuration(this.chapter.duration)} - ${page_count + 'p'}`;
    }

    public computeProgressTotalStats(): void {
        // current
        let active_module_lessons_duration: number = 0;

        const userStatus: UserStatus | undefined = this.userStatement.userStatus.find(userStatus => userStatus.module_id === this.module.id);

        if (userStatus === undefined && this.currentTotalCourseProgress.currentPourcentage !== undefined) {
            return;
        }

        if (this.userStatement.userStatus.length > 1) {
            let moduleIdCompleted: Set<number> = new Set<number>();
            let total_progress_duration: number = 0;

            // Get all completed modules
            this.userStatement.userStatus.forEach(userStatus => {
                if (userStatus.is_complete) {
                    moduleIdCompleted.add(userStatus.module_id);
                }
            });

            // Get the total chapters duration of all completed modules
            moduleIdCompleted.forEach(module_id => {
                total_progress_duration += this.course.modules
                    ?.find(module => module.id === module_id)?.chapters
                    ?.reduce((acc, chapter) => acc + chapter.duration, 0) || 0;
            });

            // Get the current module duration
            if (!userStatus?.is_complete) {
                total_progress_duration += this.module.chapters
                    .filter(chapter => chapter.order < this.chapter.order)
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            }

            active_module_lessons_duration = total_progress_duration;
        } else {
            if (userStatus?.is_complete) {
                active_module_lessons_duration += this.module.chapters
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            } else {
                active_module_lessons_duration = this.module.chapters
                    .filter(chapter => chapter.order < this.chapter.order)
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            }
        }

        const current_total_progression: number = active_module_lessons_duration;

        // total
        const total_course_duration: number = this.course.modules.reduce((acc, module) => acc + module.duration, 0);

        // currentPercentage
        const current_pourcentage: number = (current_total_progression / total_course_duration) * 100;

        this.currentTotalCourseProgress = {
            current: this.computeDuration(current_total_progression),
            total: this.computeDuration(total_course_duration),
            currentPourcentage: `${current_pourcentage.toFixed()}`,
        };
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
}
