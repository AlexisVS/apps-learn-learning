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
    @Input() public current_module_progression_index: number;
    @Input() public current_chapter_progression_index: number;
    @Input() public current_page_progression_index: number;

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
            this.course.modules[this.current_module_progression_index].id,
            this.current_chapter_progression_index,
            this.current_page_progression_index,
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
            changes.hasOwnProperty('current_module_progression_index') &&
            changes.current_module_progression_index.currentValue !== changes.current_module_progression_index.previousValue
        ) {
            this.setQursusIframeUrl(
                this.course.modules[this.current_module_progression_index].id,
                0,
                0,
                'view',
            );
        }
    }

    private setQursusIframeUrl(module_id: number, chapter_index: number, page_index: number = 0, mode: 'view' | 'edit'): void {
        const base_url: string = this.appInfo.backend_url + '/qursus';
        let query_string: string = '?module=' + module_id;
        query_string += '&chapter=' + chapter_index;
        query_string += '&page=' + page_index;

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
