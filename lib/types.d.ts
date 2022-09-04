interface DictionaryType {
    [P: itemId]: ItemType;
}
declare type itemId = string;
declare type ItemType = {
    id: itemId;
    pid: itemId;
    index?: number;
    data?: object;
};
declare type TreeItemType = {
    id: itemId;
    pid: itemId;
    index?: number;
    children?: ItemType[];
    data?: object;
};
declare type ItemListType = ItemType[];
declare type ItemTreeType = TreeItemType[];
declare type optionsType = {
    pid: string;
    children: string;
    defaultRoot: string;
    isDir: Function;
};
declare type initDictionaryType = {
    tree: [];
    dictionary: object;
};
export { DictionaryType, itemId, ItemType, TreeItemType, ItemListType, ItemTreeType, optionsType, initDictionaryType, };
