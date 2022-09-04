import { insert, sort, initDictionary, generateId } from "./helpers";
/**
 * TREEBASE
 */
class TreeBase {
    /**
     * Key value dictionary
     */
    dictionary;
    /**
     * Options object
     */
    options;
    constructor(props) {
        this.options = {
            pid: "pid",
            children: "children",
            isDir: null,
            defaultRoot: "root",
            ...(props.options || {}),
        };
        this.dictionary = initDictionary({
            dictionary: props.dictionary,
            tree: props.tree,
        }, this.options);
    }
    /**
     * Update dictionary object from array of items
     * @param list - list items
     */
    updateDictionaryWith(list) {
        for (const [index, item] of list.entries()) {
            this.dictionary[item.id] = { ...item, index };
        }
    }
    /**
     * Return sanitized dictionary object in safe way
     * @param dictionary
     * @returns
     */
    getDictionary(dictionary) {
        let result = {};
        Object.keys(dictionary).map((id) => {
            result[id] = {
                ...dictionary?.[id],
                pid: dictionary?.[id]?.pid || this.options.defaultRoot,
            };
        });
        return result;
    }
    /**
     * Converts dictionary object to array of items
     * @param dictionary - dictionary object
     * @returns array - ItemListType
     */
    dictionaryToList(dictionary) {
        return Object.keys(dictionary).map((id) => ({
            ...dictionary[id],
            pid: dictionary[id].pid || this.options.defaultRoot,
            id: id,
        }));
    }
    treeToList(list, result = []) {
        for (let item of list) {
            let children = item[this.options.children];
            let pid = item[this.options.pid];
            delete item[this.options.children];
            delete item[this.options.pid];
            item.pid = pid;
            result.push(item);
            if (children)
                this.treeToList(children, result);
        }
        return result;
    }
    /**
     * GET DIRECT CHILDS OF ITEM
     * @param id - parent id
     * @returns
     */
    getDirectChildrens(id) {
        return this.dictionaryToList(this.dictionary).filter((item) => String(item.pid) === String(id));
    }
    /**
     * GET DEEP CHILDRENS
     * @param pid - id of parent
     * @returns - flat list of child items
     */
    getDeepChildren(pid) {
        const that = this;
        let result = [];
        if (this.options.isDir) {
            // If isDir is exist
            function recurFind(idList) {
                for (const id of idList) {
                    let direct = that.getDirectChildrens(id);
                    result = [...result, ...direct];
                    // Find all folders of direct childs
                    let innerFolders = direct.filter((item) => that.options.isDir(item));
                    let innerIds = innerFolders.map((item) => item.id);
                    if (innerIds?.length)
                        return recurFind(innerIds);
                }
            }
            recurFind([pid]);
        }
        else {
            // If isDir func not exist check manualy
            for (const id in this.dictionary) {
                if (this.isDeepParent(id, pid)) {
                    if (!result.includes(id)) {
                        result.push(id);
                    }
                }
            }
            result = result.map((id) => this.dictionary[id]);
        }
        return result;
    }
    /**
     * BULLD TREE
     * @param rootId - root of tree ()
     * @param keepIndex - put items in their index(can leave empty fields)
     * @returns
     */
    getTree(rootId = this.options.defaultRoot, keepIndex = true) {
        let o = {};
        for (const id in this.dictionary) {
            const item = this.dictionary[id];
            const { pid } = item;
            // Fill current
            o[id] = o[id]
                ? { ...o[id], ...item }
                : {
                    ...item,
                    id,
                    pid: pid === undefined ? this.options.defaultRoot : pid,
                };
            // Fill parent
            o[pid] =
                o[pid] !== undefined
                    ? o[pid]
                    : {
                        ...(o[pid] && o[pid]),
                        ...(pid && { id: pid }),
                        ...(o[pid]?.pid
                            ? { pid: o[pid]?.pid }
                            : { pid: this.options.defaultRoot }),
                    };
            if (o[pid]) {
                o[pid].children = o[pid].children || [];
                if (keepIndex && o[id].index !== undefined) {
                    o[pid].children[o[id].index] = o[id];
                }
                else {
                    o[pid].children.push(o[id]);
                }
            }
        }
        if (o?.[rootId]?.children)
            return o[rootId].children;
        return [];
    }
    /**
     * If item have any childrens
     * @param id - target item
     * @returns
     */
    haveChildren(id) {
        if (this.getDirectChildrens(id)?.length > 0)
            return true;
        return false;
    }
    /**
     * Get all parents of child until root item
     * @param id - target child
     * @param rootId - root item id
     * @returns - array of parent ids
     */
    getParents(id, rootId = this.options.defaultRoot) {
        let item = this.dictionary[id];
        let result = [];
        let maxLength = 0;
        while (item && item.pid && maxLength < 10) {
            if (item.pid === rootId)
                break;
            result.push(item.pid);
            item = this.dictionary[item.pid];
            maxLength += 1;
        }
        return result;
    }
    /**
     * Is deep parent of item
     * @param id - item
     * @param pid - parent
     * @returns
     */
    isDeepParent(id, pid) {
        const parents = this.getParents(id);
        return parents.includes(pid);
    }
    /**
     * UPDATE INDEXES OF ITEMS
     * @param pid - id of root item
     * @params {add, remove} - remove or add item item while reindexing
     * @returns
     */
    reindexDirectChildrens(pid = this.options.defaultRoot, { add, remove } = {}) {
        // Get items
        let childrens = this.getDirectChildrens(pid);
        // Remove
        if (remove)
            childrens = childrens.filter((item) => item.id !== remove);
        // Sort
        childrens = sort(childrens, "index");
        // Insert
        if (add) {
            let newIndex = add.index !== undefined ? add.index : childrens.length || 0;
            childrens = insert(childrens, newIndex, {
                ...add,
                index: newIndex,
            });
        }
        // Re-index
        this.updateDictionaryWith(childrens);
        return this.dictionary;
    }
    /**
     * ADD ITEM
     * @param item - Child object
     * @param check - Check if already exists
     * @returns
     */
    add(item, check) {
        const { pid = this.options.defaultRoot, index, id } = item;
        if (check) {
            let duplicate = this.checkKeyPropertyExists(pid, check.key, check.value);
            if (duplicate)
                return this.dictionary[duplicate.id]; // Already exisits in pid
        }
        const childId = id || generateId(this.dictionary);
        // Build child
        const childData = {
            ...item,
            pid,
            id: childId,
            index,
        };
        this.reindexDirectChildrens(pid, { add: childData });
        return { id, pid, ...childData };
    }
    /**
     * REMOVE ITEM
     * @param id - target item id
     * @param childrenBehavior - what to do with target childrens
     * @returns
     */
    remove(id, childrenBehavior) {
        const { pid } = this.dictionary[id];
        // Delete item childrens
        if (!childrenBehavior) {
            for (const item of this.getDeepChildren(id)) {
                delete this.dictionary[item.id];
            }
        }
        else if (childrenBehavior === "orphan") {
            // Make orphaned
            const deletedChildrens = this.getDirectChildrens(id);
            // Move children to orphaned pid
            // Get orphaned items
            if (deletedChildrens.length > 0 && !this.dictionary.orphaned) {
                this.add({ pid: this.options.defaultRoot, id: "orphaned" });
            }
            // Set deleted children to orphaned
            for (const item of deletedChildrens) {
                this.dictionary[item.id].pid = "orphaned";
            }
            this.reindexDirectChildrens("orphaned");
        }
        delete this.dictionary[id];
        // Reindex siblings
        this.reindexDirectChildrens(pid);
        return this.dictionary;
    }
    /**
     * EDIT ITEM
     * @param id - child id
     * @param payload - new child dictionary
     * @returns
     */
    edit(id, payload) {
        const item = this.dictionary[id];
        if (!item)
            this.dictionary;
        this.dictionary[id] = { ...item, ...payload, id };
        return this.dictionary;
    }
    /**
     * Move child to new parent
     * @param id - child id
     * @param newIndex - index in new parent
     * @param pid - new parent id
     * @returns
     */
    move(id, newIndex, pid) {
        const child = { ...this.dictionary[id], id: id };
        if (pid && pid === id)
            return this.dictionary;
        if (pid && this.isDeepParent(pid, id))
            return this.dictionary;
        // New pid
        if (pid && pid !== child.pid) {
            this.remove(id, "save"); // if parent is moving dont delete children
            this.add({
                ...child,
                pid: pid,
                index: newIndex !== undefined ? newIndex : child.index,
            });
        }
        else {
            // Reindex siblings
            this.reindexDirectChildrens(child.pid, {
                remove: id,
                add: { ...child, index: newIndex },
            });
        }
        return this.dictionary;
    }
    // Check if item with specific key and property exists
    checkKeyPropertyExists(pid, key, value) {
        const childrens = this.getDirectChildrens(pid);
        return childrens.find((item) => item[key] === value);
    }
}
export default TreeBase;