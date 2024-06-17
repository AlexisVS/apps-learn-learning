import { Component, Input, OnInit } from '@angular/core';
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
export class ContentComponent implements OnInit {
    @Input() public appInfo: AppInfo;
    @Input() public course: Course;
    @Input() public currentModuleProgressionIndex: number;
    @Input() public currentChapterProgressionIndex: number;
    @Input() public currentPageProgressionIndex: number;

    public qursusUrl: SafeResourceUrl;

    constructor(
        private route: ActivatedRoute,
        private learnService: LearnService,
        private sanitizer: DomSanitizer,
    ) {
    }

    ngOnInit(): void {
        const base_url = this.appInfo.backend_url + '/qursus';
        let query_string = '?module=' + this.course.modules[this.currentModuleProgressionIndex].id;
        query_string += '&chapter=' + this.currentChapterProgressionIndex;
        query_string += '&page=' + this.currentPageProgressionIndex;

        if (
            this.route.snapshot.queryParamMap.has('mode') &&
            this.route.snapshot.queryParamMap.get('mode') === 'edit' &&
            this.learnService.userHasAccessToCourseEditMode()
        ) {
            query_string += '&mode=edit';
        }

        console.log('ContentTabComponent::ngOnInit ( qursus )', query_string);

        this.qursusUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base_url + query_string);
    }
}
