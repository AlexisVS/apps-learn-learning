import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Course } from '../../../../_types/learn';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, AfterViewInit {
    @Input() public appInfo: Record<string, any>;
    @Input() public course: Course;
    @Input() public currentModuleProgressionIndex: number;
    @Input() public currentChapterProgressionIndex: number;

    public qursusUrl: SafeResourceUrl;

    constructor(
        private sanitizer: DomSanitizer,
    ) {
    }

    ngOnInit(): void {
        this.qursusUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.appInfo.backend_url +
            '/qursus/?module=' +
            this.course.modules[this.currentModuleProgressionIndex].id);
        // '&chapter=' +
        // this.course.modules[this.currentModuleProgressionIndex].chapters[this.currentChapterProgressionIndex].id;

        console.log(
            'ContentComponent::ngOnInit',
            this.appInfo,
            this.course,
            this.currentModuleProgressionIndex,
            this.currentChapterProgressionIndex,
            this.qursusUrl,
        );
    }

    ngAfterViewInit() {
        console.log(document.querySelector('#matTabContent'));
    }
}
