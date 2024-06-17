import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Chapter, Course, Module, UserStatement } from '../../_types/learn';
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
    }

    public getCurrentModule(): Module {
        let moduleIndex: number = 0;

        if (this.userStatement.userStatus.length > 0) {
            const currentModuleId: number | undefined = this.userStatement.userStatus[0].module_id;

            moduleIndex = this.course.modules.findIndex(module => module.id === currentModuleId);
        }

        return this.course.modules[moduleIndex];
    }

    public getCurrentLesson(): Chapter {
        return this.currentModule.chapters[this.currentChapterProgressionIndex];
    }

    public computeCurrentModuleProgress(): void {
        this.currentModuleProgress = `${this.userStatement.userStatus.length === 0 ? 1 : this.userStatement.userStatus.length} / ${this.course.modules.length} - ${this.computeDuration(this.currentModule.duration)}`;
    }

    public computeCurrentLessonProgress(): void {
        const chapter_count: number = this.currentModule.chapters.length;
        const page_count: number = this.currentLesson.page_count;

        this.currentLessonProgress = `${this.currentChapterProgressionIndex} / ${chapter_count} - ${this.computeDuration(this.currentLesson.duration)} - ${page_count + 'p'}`;
    }

    public computeProgressTotalStats(): void {
        // current
        let activeModuleLessonsDurations: number = 0;

        if (this.userStatement.userStatus
            .filter(userStatus => userStatus.module_id === this.currentModule.id && userStatus.chapter_index > 0).length) {
            activeModuleLessonsDurations = this.currentModule.chapters
                .filter(chapter => chapter.order <= this.currentLesson.order)
                .reduce((acc, chapter) => acc + chapter.duration, 0);
        }

        const previousCourseModulesDurations: number = this.course.modules
            .filter(module => module.order < this.currentModule.order)
            .reduce((acc, module) => acc + module.duration, 0);

        const currentTotalProgression: number = activeModuleLessonsDurations + previousCourseModulesDurations;

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
}
