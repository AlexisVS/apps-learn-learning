import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Course } from '../../../../_types/learn';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { LearnService } from '../../../../_services/Learn.service';
import { AppInfo } from '../../../../_types/equal';

@Component({
    selector: 'app-content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, OnChanges {
    @Input() public appInfo: AppInfo;
    @Input() public course: Course;
    @Input() public currentModuleProgressionIndex: number;
    @Input() public currentChapterProgressionIndex: number;
    @Input() public currentPageProgressionIndex: number;

    /** Used for navigation between modules and chapters */
    @Input() public currentNavigation: { module_id: number; chapter_index: number } | null;

    public qursusUrl: SafeResourceUrl;

    constructor(
        private route: ActivatedRoute,
        private learnService: LearnService,
        private sanitizer: DomSanitizer,
    ) {
    }

    public ngOnInit(): void {
        let mode: 'view' | 'edit' = 'view';

        if (
            this.route.snapshot.queryParamMap.has('mode') &&
            this.route.snapshot.queryParamMap.get('mode') === 'edit'
        ) {
            mode = 'edit';
        }
        this.setQursusIframeUrl(
            this.course.modules[this.currentModuleProgressionIndex].id,
            this.currentChapterProgressionIndex,
            this.currentPageProgressionIndex,
            mode,
        );
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (
            changes.hasOwnProperty('currentNavigation') &&
            changes.currentNavigation.currentValue !== null &&
            changes.currentNavigation.currentValue !== changes.currentNavigation.previousValue
        ) {
            let mode: 'view' | 'edit' = 'view';

            if (
                this.route.snapshot.queryParamMap.has('mode') &&
                this.route.snapshot.queryParamMap.get('mode') === 'edit'
            ) {
                mode = 'edit';
            }
            this.setQursusIframeUrl(
                this.currentNavigation?.module_id!,
                this.currentNavigation?.chapter_index!,
                0,
                mode,
            );
        }

        if (
            changes.hasOwnProperty('currentModuleProgressionIndex') &&
            changes.currentModuleProgressionIndex.currentValue !== changes.currentModuleProgressionIndex.previousValue
        ) {
            this.setQursusIframeUrl(
                this.course.modules[this.currentModuleProgressionIndex].id,
                0,
                0,
                'view',
            );
        }
    }

    private setQursusIframeUrl(moduleId: number, chapterIndex: number, pageIndex: number = 0, mode: 'view' | 'edit'): void {
        const base_url: string = this.appInfo.backend_url + '/qursus';
        let query_string: string = '?module=' + moduleId;
        query_string += '&chapter=' + chapterIndex;
        query_string += '&page=' + pageIndex;

        if (
            mode === 'edit' &&
            this.learnService.userHasAccessToCourseEditMode()
        ) {
            query_string += '&mode=edit';
        } else {
            query_string += '&mode=view';
        }

        console.log('ContentTabComponent::ngOnInit ( qursus )', query_string);

        this.qursusUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base_url + query_string);
    }
}
