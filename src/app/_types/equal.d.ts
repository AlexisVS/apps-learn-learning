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

export interface EnvironmentInfo {
    env_mode: string;
    production: boolean;
    parent_domain: string;
    backend_url: string;
    rest_api_url: string;
    lang: string;
    locale: string;
    version: string;
    company_name: string;
    company_url: string;
    app_name: string;
    app_logo_url: string;
}

/**
 * The apps info retrieved from the backend at the /appinfo/:package/:apps
 */
export interface AppInfo {
    [key: string]: any;

    name?: string;
    description?: string;
    version?: string;
    authors?: string | string[];
    license?: string;
    repository?: string;
    url?: string;
    icon?: string;
    color?: string;
    access?: {
        groups?: string | string[];
    };
    show_in_apps?: boolean;
}
