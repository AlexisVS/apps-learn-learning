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
    @Input() public appInfo: AppInfo;
    @Input() public currentChapterProgressionIndex: number;
    @Input() public currentPageProgressionIndex: number;

    /* Used for trigger de completion dialog */
    @Output() public moduleFinished: EventEmitter<void> = new EventEmitter<void>();

    public currentModule: Module;
    public currentLesson: Chapter;

    /* Used to display the current module progression */
    public currentModuleProgress: string;

    /* Used to display the current lesson progression */
    public currentLessonProgress: string;

    /* Used to display the current total course progression */
    public currentTotalCourseProgress: TotalCourseProgress = {} as TotalCourseProgress;


    ngOnInit(): void {

        if (this.course.modules && this.course.modules.length > 0) {
            this.currentModule = this.getCurrentModule();

            if (this.currentModule && this.currentModule.chapters && this.currentModule.chapters.length > 0) {
                this.currentLesson = this.getCurrentLesson();
                this.computeCurrentModuleProgress();
                this.computeCurrentLessonProgress();
                this.computeProgressTotalStats();
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {

        if (
            (changes.hasOwnProperty('userStatement') && changes.userStatement.currentValue !== changes.userStatement.previousValue) ||
            (changes.hasOwnProperty('course') && changes.course.currentValue !== changes.course.previousValue)
        ) {
            this.ngOnInit();
            console.table(changes.userStatement.currentValue);
        }

        if (changes.hasOwnProperty('currentChapterProgressionIndex') && changes.currentChapterProgressionIndex.currentValue !== changes.currentChapterProgressionIndex.previousValue) {
            this.computeCurrentLessonProgress();
        }

        if (changes.hasOwnProperty('currentPageProgressionIndex') && changes.currentPageProgressionIndex.currentValue !== changes.currentPageProgressionIndex.previousValue) {
            this.computeCurrentLessonProgress();
        }
    }

    public getCurrentModule(): Module {
        let moduleIndex: number = 0;

        if (this.userStatement.userStatus.length > 0) {
            const currentModuleId: number = this.userStatement.userStatus[0].module_id;

            moduleIndex = this.course.modules.findIndex(module => module.id === currentModuleId);
        }

        return this.course.modules[moduleIndex];
    }

    public getCurrentLesson(): Chapter {
        return this.currentModule.chapters[this.currentChapterProgressionIndex];
    }

    public computeCurrentModuleProgress(): void {
        let moduleProgress: number = 0;

        if (this.userStatement.userStatus.length > 0) {
            moduleProgress = this.userStatement.userStatus.length - 1;

            if (this.userStatement.userStatus[0].is_complete) {
                moduleProgress += 1;
            }
        }

        this.currentModuleProgress = `${moduleProgress} / ${this.course.modules.length} - ${this.computeDuration(this.currentModule.duration)}`;
    }

    public computeCurrentLessonProgress(): void {
        const moduleComplete: boolean = this.userStatement.userStatus.find(userStatus => userStatus.module_id === this.currentModule.id)?.is_complete == true;
        let currentChapterIndex: number = this.currentChapterProgressionIndex;
        if (moduleComplete) {
            currentChapterIndex = this.currentModule.chapters.length;
            this.moduleFinished.emit();
        }

        const chapter_count: number = this.currentModule.chapters.length;
        const page_count: number = this.currentLesson.page_count;

        this.currentLessonProgress = `${currentChapterIndex} / ${chapter_count} - ${this.computeDuration(this.currentLesson.duration)} - ${page_count + 'p'}`;
    }

    public computeProgressTotalStats(): void {
        // current
        let activeModuleLessonsDuration: number = 0;

        const userStatus: UserStatus | undefined = this.userStatement.userStatus.find(userStatus => userStatus.module_id === this.currentModule.id);

        if (this.userStatement.userStatus.length > 1) {
            let moduleIdCompleted: Set<number> = new Set<number>();
            let totalProgressDuration: number = 0;

            // Get all completed modules
            this.userStatement.userStatus.forEach(userStatus => {
                if (userStatus.is_complete) {
                    moduleIdCompleted.add(userStatus.module_id);
                }
            });

            // Get the total chapters duration of all completed modules
            moduleIdCompleted.forEach(moduleId => {
                totalProgressDuration += this.course.modules
                    ?.find(module => module.id === moduleId)?.chapters
                    ?.reduce((acc, chapter) => acc + chapter.duration, 0) || 0;
            });

            // Get the current module duration
            if (!userStatus?.is_complete) {
                totalProgressDuration += this.currentModule.chapters
                    .filter(chapter => chapter.order < this.currentLesson.order)
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            }

            activeModuleLessonsDuration = totalProgressDuration;
        } else {
            if (userStatus?.is_complete) {
                activeModuleLessonsDuration += this.currentModule.chapters
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            } else {
                activeModuleLessonsDuration = this.currentModule.chapters
                    .filter(chapter => chapter.order < this.currentLesson.order)
                    .reduce((acc, chapter) => acc + chapter.duration, 0);
            }
        }

        const currentTotalProgression: number = activeModuleLessonsDuration;

        // total
        const totalCourseDuration: number = this.course.modules.reduce((acc, module) => acc + module.duration, 0);

        // currentPercentage
        const currentPourcentage: number = (currentTotalProgression / totalCourseDuration) * 100;

        this.currentTotalCourseProgress = {
            current: this.computeDuration(currentTotalProgression),
            total: this.computeDuration(totalCourseDuration),
            currentPourcentage: `${currentPourcentage.toFixed()}`,
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

    public openNextModuleDialog(): void {
    }
}
