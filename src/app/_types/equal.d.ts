export type ModelState = string;

export interface User {
    id: number;
    identifier: number;
    firstname: string;
    lastname: string;
    email: string;
    state: ModelState;
}

export interface UserInfo {
    id: number;
    name: string;
    login: string;
    validated: boolean;
    language: string;
    groups_ids: Group[];
    state: ModelState;
    modified: string | Date;
    groups: string[];
}

export interface Group {
    id: number;
    name: string;
    display_name: string;
    state: ModelState;
    modified: string | Date;
}
