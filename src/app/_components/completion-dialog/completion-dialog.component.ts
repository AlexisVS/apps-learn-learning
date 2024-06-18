import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
    next: boolean;
}

@Component({
    selector: 'app-completion-dialog',
    templateUrl: './completion-dialog.component.html',
    styleUrls: ['./completion-dialog.component.scss'],
})
export class CompletionDialogComponent {

    public next: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<CompletionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) {
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }
}
