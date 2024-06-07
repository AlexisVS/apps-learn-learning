import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { Course } from '../../../../_types/learn';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit {
    @Input() public appInfo: Record<string, any>;
    @Input() public course: Course;
    @Input() public currentModuleProgressionIndex: number;
    @Input() public currentChapterProgressionIndex: number;

    public qursusUrl: string;
    public qursusUrlSafe: SafeResourceUrl;
    public loading: boolean = true;

    constructor(private sanitizer: DomSanitizer) {}

    ngOnInit(): void {
        this.qursusUrl =
            this.appInfo.backend_url +
            '/qursus/?module=' +
            this.course.modules[this.currentModuleProgressionIndex].id +
            '&chapter=' +
            this.course.modules[this.currentModuleProgressionIndex].chapters[this.currentChapterProgressionIndex].id;

        console.log(
            'ContentComponent::ngOnInit',
            this.appInfo,
            this.course,
            this.currentModuleProgressionIndex,
            this.currentChapterProgressionIndex,
            this.qursusUrl
        );
    }

    ngAfterViewInit(): void {
        this.qursusUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.qursusUrl);
        this.loading = false;
    }
}
