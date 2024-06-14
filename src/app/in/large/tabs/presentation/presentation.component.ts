import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-presentation',
    templateUrl: './presentation.component.html',
    styleUrls: ['./presentation.component.scss'],
})
export class PresentationComponent {
    @Input() courseDescription!: string;

    public htmlContent: SafeHtml;

    constructor(private sanitizer: DomSanitizer) {
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(this.courseDescription);
    }
}
