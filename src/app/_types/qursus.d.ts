export enum MessageEventEnum {
    EQ_ACTION_LEARN_NEXT = 'eq_action_learn_next',
    CHAPTER_REMOVED = 'chapter_removed',
    PAGE_REMOVED = 'page_removed',
}

export type QursusMessageEvent = {
    type: MessageEventEnum;
    data: any;
};
