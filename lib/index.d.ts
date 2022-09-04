import { DictionaryType, itemId, ItemType, ItemListType, ItemTreeType, optionsType } from "./types";
/**
 * TREEBASE
 */
declare class TreeBase {
    /**
     * Key value dictionary
     */
    dictionary: DictionaryType;
    /**
     * Options object
     */
    options: optionsType;
    constructor(props: any);
    /**
     * Update dictionary object from array of items
     * @param list - list items
     */
    updateDictionaryWith(list: ItemListType): void;
    /**
     * Return sanitized dictionary object in safe way
     * @param dictionary
     * @returns
     */
    getDictionary(dictionary: object): {};
    /**
     * Converts dictionary object to array of items
     * @param dictionary - dictionary object
     * @returns array - ItemListType
     */
    private dictionaryToList;
    private treeToList;
    /**
     * GET DIRECT CHILDS OF ITEM
     * @param id - parent id
     * @returns
     */
    getDirectChildrens(id: itemId): ItemListType;
    /**
     * GET DEEP CHILDRENS
     * @param pid - id of parent
     * @returns - flat list of child items
     */
    getDeepChildren(pid: itemId): ItemType[];
    /**
     * BULLD TREE
     * @param rootId - root of tree ()
     * @param keepIndex - put items in their index(can leave empty fields)
     * @returns
     */
    getTree(rootId?: itemId, keepIndex?: boolean): ItemTreeType;
    /**
     * If item have any childrens
     * @param id - target item
     * @returns
     */
    haveChildren(id: itemId): boolean;
    /**
     * Get all parents of child until root item
     * @param id - target child
     * @param rootId - root item id
     * @returns - array of parent ids
     */
    getParents(id: itemId, rootId?: itemId): itemId[];
    /**
     * Is deep parent of item
     * @param id - item
     * @param pid - parent
     * @returns
     */
    isDeepParent(id: itemId, pid: itemId): boolean;
    /**
     * UPDATE INDEXES OF ITEMS
     * @param pid - id of root item
     * @params {add, remove} - remove or add item item while reindexing
     * @returns
     */
    reindexDirectChildrens(pid?: itemId, { add, remove }?: {
        add?: ItemType;
        remove?: itemId;
    }): DictionaryType;
    /**
     * ADD ITEM
     * @param item - Child object
     * @param check - Check if already exists
     * @returns
     */
    add(item: {
        pid?: itemId;
        id?: itemId;
        index?: number;
    }, check?: {
        key: string;
        value: any;
    }): ItemType;
    /**
     * REMOVE ITEM
     * @param id - target item id
     * @param childrenBehavior - what to do with target childrens
     * @returns
     */
    remove(id: itemId, childrenBehavior?: "save" | "orphan" | undefined): DictionaryType;
    /**
     * EDIT ITEM
     * @param id - child id
     * @param payload - new child dictionary
     * @returns
     */
    edit(id: itemId, payload: object): DictionaryType;
    /**
     * Move child to new parent
     * @param id - child id
     * @param newIndex - index in new parent
     * @param pid - new parent id
     * @returns
     */
    move(id: string, newIndex: number, pid?: itemId): DictionaryType;
    checkKeyPropertyExists(pid: itemId, key: string, value: any): ItemType;
}
export default TreeBase;
