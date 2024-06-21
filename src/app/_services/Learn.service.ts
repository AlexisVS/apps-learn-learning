import { Injectable } from '@angular/core';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';
import { User, UserInfo } from '../_types/equal';
import { Chapter, Course, ProgressionIndex, UserAccess, UserStatement, UserStatus } from '../_types/learn';

@Injectable({
    providedIn: 'root',
})
export class LearnService {
    public user: User;
    public userInfo: UserInfo;
    public userAccess: UserAccess | null = null;
    public userStatus: UserStatus[];

    public course_id: string;
    public course: Course;
    private moduleIdLoaded: Set<number> = new Set<number>();

    public currentProgressionIndex: ProgressionIndex = {
        module: 0,
        chapter: 0,
        page: 0,
    }

    constructor(
        private api: ApiService,
    ) {
    }

    public async loadRessources(course_id: number): Promise<void> {
        try {
            this.course_id = course_id.toString();
            await this.getUserInfos();
            await this.loadCourse();
            this.setDocumentTitle();
            this.setCurrentRessourceIndex();

            // if the last user status is complete, we create a new one for the next module
            // if (this.userStatus.length > 0 && this.userStatus[0].is_complete) {
            //     await this.api.create('learn\\UserStatus', {
            //         course_id: this.course_id,
            //         module_id: this.course.modules[this.currentModuleProgressionIndex + 1].id,
            //         user_id: this.userInfo.id,
            //         chapter_index: 0,
            //         page_index: 0,
            //         is_complete: false,
            //     });
            //
            //     await this.loadUserStatus();
            // }
        } catch (error) {
            console.error('LearnService.loadRessources =>', error);
        }
    }

    /**
     * Load the user status and sort it by module_id descending.
     */
    public async loadUserStatus(): Promise<void> {
        this.userStatus = (await this.api.collect(
            'learn\\UserStatus',
            [
                ['user_id', '=', this.userInfo.id],
                ['course_id', '=', this.course_id],
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

    /**
     * Get the user statement.
     */
    public getUserStatement(): UserStatement {
        return {
            user: this.user,
            userInfo: this.userInfo,
            userAccess: this.userAccess,
            userStatus: this.userStatus,
        } as UserStatement;
    }

    /**
     * Load a course module by its id.
     *
     * @param module_id
     */
    public async loadCourseModule(module_id: number): Promise<Course> {
        if (!this.moduleIdLoaded.has(module_id)) {
            try {
                const module = await this.api.get('?get=learn_module', { id: module_id });

                const course_module_index: number = this.course.modules.findIndex(
                    courseModule => courseModule.id === module.id,
                );

                this.course.modules[course_module_index] = module;

                this.moduleIdLoaded.add(module_id);

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
        let is_course_creator: boolean = false,
            is_admin: boolean = false;

        // Check if the user is the course creator
        if (this.course && this.course?.creator === this.userInfo.id) {
            is_course_creator = true;
        }

        // Check if the user is an admin
        if (this.userInfo.groups.includes('admins')) {
            is_admin = true;
        }

        return is_course_creator || is_admin;
    }

    /**
     * Reload the chapter from the course.
     *
     * @param module_id
     * @param chapter_id
     */
    public async reloadChapter(module_id: number, chapter_id: number): Promise<void> {
        try {
            const chapter: Chapter = (await this.api.collect(
                'learn\\Chapter',
                [
                    ['module_id', '=', module_id],
                    ['id', '=', chapter_id],
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

            const module_index : number= this.course.modules.findIndex(module => module.id === module_id);
            const chapter_index: number = this.course.modules[module_index].chapters.findIndex(chapter => chapter.id === chapter_id);

            this.course.modules[module_index].chapters[chapter_index] = chapter;

        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Remove a chapter from the course.
     *
     * @param module_id
     * @param chapter_id
     */
    public removeChapter(module_id: number, chapter_id: number): void {
        const module_index : number= this.course.modules.findIndex(module => module.id === module_id);
        const chapter_index: number = this.course.modules[module_index].chapters.findIndex(chapter => chapter.id === chapter_id);

        this.course.modules[module_index].chapters.splice(chapter_index, 1);
    }

    private async loadCourse(): Promise<Course> {
        try {
            this.course = (await this.api.get('?get=learn_course', { course_id: this.course_id }));

            // sort order ascending
            this.course.modules = [...this.course.modules.sort((a, b) => a.order - b.order)];
        } catch (error) {
            console.error('Error: LearnService.loadCourse =>', error);
        }

        return this.course;
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
                        ['course_id', '=', this.course_id],
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

    private setDocumentTitle(): void {
        document.title = 'Learning | ' + this.course.title;
    }

    /**
     * Set the current ressource index.
     *
     * @private
     */
    private setCurrentRessourceIndex(): void {
        let module_index: number = 0;
        let chapter_index: number = 0;
        let page_index: number = 0;

        if (this.userStatus.length > 0) {
            const currentStatus: UserStatus = this.userStatus.sort((a, b) => b.module_id - a.module_id)[0];
            const current_module_id: number = currentStatus.module_id;
            module_index = this.course.modules.findIndex(module => module.id === current_module_id);

            chapter_index = currentStatus.chapter_index;
            page_index = currentStatus.page_index;

            console.log(
                'setCurrentRessourceIndex',
                this.course,
                current_module_id,
                module_index,
                chapter_index,
                page_index,
                currentStatus,
            );
        }
        // this.currentModuleProgressionIndex = module_index;
        // this.currentChapterProgressionIndex = chapter_index;
        // this.currentPageProgressionIndex = page_index;

        this.currentProgressionIndex = {
            module: module_index,
            chapter: chapter_index,
            page: page_index,
        };
    }
}
