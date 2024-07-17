import { Component, OnInit } from '@angular/core';
// @ts-ignore
import { ApiService } from 'sb-shared-lib';

@Component({
    selector: 'app-root',
    templateUrl: './app.root.component.html',
    styleUrls: ['./app.root.component.scss'],
})
// , OnDestroy
export class AppRootComponent implements OnInit {
    public userInfo: any;

    constructor(private api: ApiService) {}

    public async ngOnInit(): Promise<void> {
        try {
            this.userInfo = await this.api.get('/userinfo');
        } catch (err) {
            if (!this.userInfo) {
                window.location.href = '/auth';
            }
            console.error('Error in appRoot: \n', err);
        }
    }
}
