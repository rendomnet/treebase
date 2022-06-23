import {
  DictionaryType,
  itemId,
  ItemType,
  TreeItemType,
  ItemListType,
  ItemTreeType,
  optionsType,
} from "./types";

import { insert, sort, initDictionary, generateId } from "./helpers";

/**
 * TREEBASE
 */
class TreeBase {
  /**
   * Key value dictionary
   */
  dictionary: DictionaryType;
  /**
   * Options object
   */
  options: optionsType;

  constructor(props: any) {
    this.options = {
      pid: "pid",
      children: "children",
      isDir: null,
      defaultRoot: "root",
      ...(props.options || {}),
    };
    this.dictionary = initDictionary(
      {
        dictionary: props.dictionary,
        tree: props.tree,
      },
      this.options
    );
  }

  /**
   * Update dictionary object from array of items
   * @param list - list items
   */
  updateDictionaryWith(list: ItemListType) {
    for (const [index, item] of list.entries()) {
      this.dictionary[item.id] = { ...item, index };
    }
  }

  /**
   * Return sanitized dictionary object in safe way
   * @param dictionary
   * @returns
   */
  getDictionary(dictionary: object) {
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
  private dictionaryToList(dictionary: DictionaryType): ItemListType {
    return Object.keys(dictionary).map((id) => ({
      ...dictionary[id],
      pid: dictionary[id].pid || this.options.defaultRoot,
      id: id,
    }));
  }

  private treeToList(
    list: ItemTreeType,
    result: ItemListType = []
  ): ItemListType {
    for (let item of list) {
      let children = item[this.options.children];
      let pid = item[this.options.pid];

      delete item[this.options.children];
      delete item[this.options.pid];

      item.pid = pid;

      result.push(item);
      if (children) this.treeToList(children, result);
    }
    return result;
  }

  /**
   * GET DIRECT CHILDS OF ITEM
   * @param id - parent id
   * @returns
   */
  getDirectChildrens(id: itemId): ItemListType {
    return this.dictionaryToList(this.dictionary).filter(
      (item) => String(item.pid) === String(id)
    );
  }

  /**
   * GET DEEP CHILDRENS
   * @param pid - id of parent
   * @returns - flat list of child items
   */
  getDeepChildren(pid: itemId): ItemType[] {
    const that = this;
    let result = [];

    if (this.options.isDir) {
      // If isDir is exist
      function recurFind(idList: itemId[]) {
        for (const id of idList) {
          let direct = that.getDirectChildrens(id);
          result = [...result, ...direct];
          // Find all folders of direct childs
          let innerFolders: ItemType[] = direct.filter((item: ItemType) =>
            that.options.isDir(item)
          );
          let innerIds = innerFolders.map((item) => item.id);
          if (innerIds?.length) return recurFind(innerIds);
        }
      }
      recurFind([pid]);
    } else {
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
  getTree(
    rootId: itemId = this.options.defaultRoot,
    keepIndex: boolean = true
  ): ItemTreeType {
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
        } else {
          o[pid].children.push(o[id]);
        }
      }
    }

    if (o?.[rootId]?.children) return o[rootId].children;
    return [];
  }

  /**
   * If item have any childrens
   * @param id - target item
   * @returns
   */
  haveChildren(id: itemId): boolean {
    if (this.getDirectChildrens(id)?.length > 0) return true;
    return false;
  }

  /**
   * Get all parents of child until root item
   * @param id - target child
   * @param rootId - root item id
   * @returns - array of parent ids
   */
  getParents(id: itemId, rootId: itemId = this.options.defaultRoot): itemId[] {
    let item = this.dictionary[id];

    let result: itemId[] = [];
    let maxLength = 0;

    while (item && item.pid && maxLength < 10) {
      if (item.pid === rootId) break;
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
  isDeepParent(id: itemId, pid: itemId) {
    const parents = this.getParents(id);
    return parents.includes(pid);
  }

  /**
   * UPDATE INDEXES OF ITEMS
   * @param pid - id of root item
   * @params {add, remove} - remove or add item item while reindexing
   * @returns
   */
  reindexDirectChildrens(
    pid: itemId = this.options.defaultRoot,
    { add, remove }: { add?: ItemType; remove?: itemId } = {}
  ) {
    // Get items
    let childrens = this.getDirectChildrens(pid);

    // Remove
    if (remove) childrens = childrens.filter((item) => item.id !== remove);

    // Sort
    childrens = sort(childrens, "index");

    // Insert
    if (add) {
      let newIndex =
        add.index !== undefined ? add.index : childrens.length || 0;

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
  add(
    item: { pid?: itemId; id?: itemId; index?: number },
    check?: { key: string; value: any }
  ) {
    const { pid = this.options.defaultRoot, index, id } = item;

    if (check) {
      if (this.checkDuplicates(pid, check.key, check.value))
        return this.dictionary; // Already exisits in pid
    }

    // Build child
    const child = {
      ...item,
      pid,
      id: id || generateId(this.dictionary),
      index,
    };

    this.reindexDirectChildrens(pid, { add: child });

    return this.dictionary;
  }

  /**
   * REMOVE ITEM
   * @param id - target item id
   * @param childrenBehavior - what to do with target childrens
   * @returns
   */
  remove(id: itemId, childrenBehavior?: "save" | "orphan" | undefined) {
    const { pid } = this.dictionary[id];

    // Delete item childrens
    if (!childrenBehavior) {
      for (const item of this.getDeepChildren(id)) {
        delete this.dictionary[item.id];
      }
    } else if (childrenBehavior === "orphan") {
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
  edit(id: itemId, payload: object) {
    const item = this.dictionary[id];
    if (!item) this.dictionary;
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
  move(id: string, newIndex: number, pid?: itemId) {
    const child = { ...this.dictionary[id], id: id };

    if (pid && pid === id) return this.dictionary;

    if (pid && this.isDeepParent(pid, id)) return this.dictionary;

    // New pid
    if (pid && pid !== child.pid) {
      this.remove(id, "save"); // if parent is moving dont delete children
      this.add({
        ...child,
        pid: pid,
        index: newIndex !== undefined ? newIndex : child.index,
      });
    } else {
      // Reindex siblings
      this.reindexDirectChildrens(child.pid, {
        remove: id,
        add: { ...child, index: newIndex },
      });
    }
    return this.dictionary;
  }

  checkDuplicates(pid: itemId, key: string, value: any) {
    const childrens = this.getDirectChildrens(pid);
    return childrens.findIndex((item) => item[key] === value) !== -1;
  }
}

export default TreeBase;
