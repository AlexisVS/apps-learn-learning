import { Injectable } from '@angular/core';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { User, UserInfo } from '../_types/equal';
import { Chapter, Course, UserAccess, UserStatement, UserStatus } from '../_types/learn';

@Injectable({
    providedIn: 'root',
})
export class LearnService {
    public user: User;
    public userInfo: UserInfo;
    public userAccess: UserAccess | null = null;
    public userStatus: UserStatus[];

    public courseId: string;
    public course: Course;
    private moduleIdLoaded: Set<number> = new Set<number>();

    public currentModuleProgressionIndex: number = 0;
    public currentChapterProgressionIndex: number = 0;
    public currentPageProgressionIndex: number = 0;

    constructor(
        private api: ApiService,
    ) {
    }

    public async loadRessources(courseId: number): Promise<void> {
        try {
            this.courseId = courseId.toString();
            await this.getUserInfos();
            await this.loadCourse();
            this.setDocumentTitle();
            this.setCurrentModuleAndChapterIndex();

            // if the last user status is complete, we create a new one for the next module
            if (this.userStatus.length > 0 && this.userStatus[0].is_complete) {
                await this.api.create('learn\\UserStatus', {
                    course_id: this.courseId,
                    module_id: this.course.modules[this.currentModuleProgressionIndex + 1].id,
                    user_id: this.userInfo.id,
                    chapter_index: 0,
                    page_index: 0,
                    is_complete: false,
                });

                await this.loadUserStatus();
            }
        } catch (error) {
            console.error('LearnService.loadRessources =>', error);
        }
    }

    private async getUserInfos(): Promise<void> {
        try {
            this.userInfo = await this.api.get('userinfo');

            this.user = (
                await this.api.collect(
                    'core\\User',
                    [['id', '=', this.userInfo.id]],
                    [
                        'name',
                        'organisation_id',
                        'validated',
                        'lastname',
                        'login',
                        'language',
                        'identity_id',
                        'firstname',
                        'status',
                        'username',
                    ],
                )
            )[0] as User;

            this.userAccess = (
                await this.api.collect(
                    'learn\\UserAccess',
                    [
                        ['user_id', '=', this.userInfo.id],
                        ['course_id', '=', this.courseId],
                    ],
                    ['id', 'name', 'code', 'code_alpha', 'course_id', 'master_user_id', 'user_id', 'is_complete'],
                    'module_id',
                )
            )[0];

            await this.loadUserStatus();
        } catch (error) {
            console.error(error);
        }
    }

    public async loadUserStatus(): Promise<void> {
        this.userStatus = (await this.api.collect(
            'learn\\UserStatus',
            [
                ['user_id', '=', this.userInfo.id],
                ['course_id', '=', this.courseId],
            ],
            [
                'code',
                'code_alpha',
                'course_id',
                'master_user_id',
                'user_id',
                'is_complete',
                'module_id',
                'chapter_index',
                'page_index',
            ],
            'module_id',
            'desc',
        )).sort((a: UserStatus, b: UserStatus) => b.module_id - a.module_id);
    }

    private async loadCourse(): Promise<Course> {
        try {
            this.course = (await this.api.get('?get=learn_course', { course_id: this.courseId }));
            // sort order ascending
            this.course.modules = [...this.course.modules.sort((a, b) => a.order - b.order)];
        } catch (error) {
            console.error('Error: LearnService.loadCourse =>', error);
        }

        return this.course;
    }

    private setDocumentTitle(): void {
        document.title = 'Learning | ' + this.course.title;
    }

    private setCurrentModuleAndChapterIndex(): void {
        let moduleIndex: number = 0;
        let chapterIndex: number = 0;
        let pageIndex: number = 0;

        if (this.userStatus.length > 0) {
            const currentStatus: UserStatus = this.userStatus.sort((a, b) => b.module_id - a.module_id)[0];
            const currentModuleId: number = currentStatus.module_id;
            moduleIndex = this.course.modules.findIndex(module => module.id === currentModuleId);

            chapterIndex = currentStatus.chapter_index;
            pageIndex = currentStatus.page_index;

            console.log(
                'setCurrentModuleAndChapterIndex',
                this.course,
                currentModuleId,
                moduleIndex,
                chapterIndex,
                pageIndex,
                currentStatus,
            );
        }
        this.currentModuleProgressionIndex = moduleIndex;
        this.currentChapterProgressionIndex = chapterIndex;
        this.currentPageProgressionIndex = pageIndex;
    }

    public getUserStatement(): UserStatement {
        return {
            user: this.user,
            userInfo: this.userInfo,
            userAccess: this.userAccess,
            userStatus: this.userStatus,
        } as UserStatement;
    }

    public async loadCourseModule(moduleId: number): Promise<Course> {
        if (!this.moduleIdLoaded.has(moduleId)) {
            try {
                const module = await this.api.get('?get=learn_module', { id: moduleId });

                const courseModuleIndex: number = this.course.modules.findIndex(
                    courseModule => courseModule.id === module.id,
                );

                this.course.modules[courseModuleIndex] = module;

                this.moduleIdLoaded.add(moduleId);

                this.course.modules = this.course.modules.sort((a, b) => a.order - b.order);
            } catch (error) {
                console.error(error);
            }
        }

        return this.course;
    }

    /**
     * Check if the user has access to the course edit mode by tree conditions:
     * - The user is in the admins group
     * - The user is in the authors of the course
     */
    public async userHasAccessToCourseEditMode(): Promise<boolean> {
        let isCourseCreator: boolean = false,
            isAdmin: boolean = false;

        // Check if the user is the course creator
        if (this.course && this.course?.creator === this.userInfo.id) {
            isCourseCreator = true;
        }

        // Check if the user is an admin
        if (this.userInfo.groups.includes('admins')) {
            isAdmin = true;
        }

        return isCourseCreator || isAdmin;
    }

    /**
     * Reload the chapter from the course.
     *
     * @param moduleId
     * @param chapterId
     */
    public async reloadChapter(moduleId: number, chapterId: number): Promise<void> {
        try {
            const chapter: Chapter = (await this.api.collect(
                'learn\\Chapter',
                [
                    ['module_id', '=', moduleId],
                    ['id', '=', chapterId],
                ],
                [
                    'id',
                    'identifier',
                    'order',
                    'title',
                    'duration',
                    'description',
                    'page_count',
                ],
            ))[0];

            const moduleIndex = this.course.modules.findIndex(module => module.id === moduleId);
            const chapterIndex = this.course.modules[moduleIndex].chapters.findIndex(chapter => chapter.id === chapterId);

            this.course.modules[moduleIndex].chapters[chapterIndex] = chapter;

        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Remove a chapter from the course.
     *
     * @param moduleId
     * @param chapterId
     */
    public removeChapter(moduleId: number, chapterId: number): void {
        const moduleIndex = this.course.modules.findIndex(module => module.id === moduleId);
        const chapterIndex = this.course.modules[moduleIndex].chapters.findIndex(chapter => chapter.id === chapterId);

        this.course.modules[moduleIndex].chapters.splice(chapterIndex, 1);
    }
}
