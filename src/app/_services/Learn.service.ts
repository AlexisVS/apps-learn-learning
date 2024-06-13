import { Injectable } from '@angular/core';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { User, UserInfo } from '../_types/equal';
import { Course, UserAccess, UserStatement, UserStatus } from '../_types/learn';

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

            this.userStatus = await this.api.collect(
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
                ],
                'module_id',
                'desc',
            );
        } catch (error) {
            console.error(error);
        }
    }

    private async loadCourse(): Promise<Course> {
        try {
            this.course = await this.api.get('?get=learn_course', { course_id: this.courseId });
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

        if (this.userStatus.length > 0 && this.course.modules && this.course.modules.length > 0) {
            const currentStatus: UserStatus = this.userStatus.sort((a, b) => b.module_id - a.module_id)[0];
            const currentModuleId: number = currentStatus.module_id;
            chapterIndex = currentStatus.chapter_index;

            moduleIndex = this.course.modules.findIndex(module => module.id === currentModuleId);

            if (moduleIndex === -1) {
                moduleIndex = 0;
            }
        }

        this.currentModuleProgressionIndex = moduleIndex;
        this.currentChapterProgressionIndex = chapterIndex;
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
}
