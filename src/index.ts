import {
  CollectionType,
  itemId,
  ItemType,
  TreeItemType,
  ItemListType,
  ItemTreeType,
  optionsType,
} from "./types";

import { makeId, insert, sort, initCollection, generateId } from "./helpers";

/**
 * TREEBASE
 */
class TreeBase {
  /**
   * Key value dictionary
   */
  collection: CollectionType;
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
    this.collection = initCollection(
      {
        collection: props.collection,
        tree: props.tree,
      },
      this.options
    );
  }

  /**
   * Update collection object from array of items
   * @param list - list items
   */
  updateCollectionWith(list: ItemListType) {
    for (const [index, item] of list.entries()) {
      this.collection[item.id] = { ...item, index };
    }
  }

  /**
   * Return sanitized collection object in safe way
   * @param collection
   * @returns
   */
  getCollection(collection: object) {
    let result = {};
    Object.keys(collection).map((id) => {
      result[id] = {
        ...collection?.[id],
        pid: collection?.[id]?.pid || this.options.defaultRoot,
      };
    });
    return result;
  }

  /**
   * Converts collection object to array of items
   * @param collection - collection object
   * @returns array - ItemListType
   */
  private collectionToList(collection: CollectionType): ItemListType {
    return Object.keys(collection).map((id) => ({
      ...collection[id],
      pid: collection[id].pid || this.options.defaultRoot,
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
   * Get only direct children of parent
   * @param id - parent id
   * @returns
   */
  getDirectChildrens(id: itemId): ItemListType {
    return this.collectionToList(this.collection).filter(
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
      for (const id in this.collection) {
        if (this.isDeepParent(id, pid)) {
          if (!result.includes(id)) {
            result.push(id);
          }
        }
      }
      result = result.map((id) => this.collection[id]);
    }
    return result;
  }

  /**
   * Get tree of items
   * @param options - Parameters
   * @returns tree
   */
  getTree(options: { rootId: string; keepIndex: boolean }): ItemTreeType {
    const { rootId = this.options.defaultRoot, keepIndex = true } = options;
    let o = {};
    for (const id in this.collection) {
      const item = this.collection[id];

      const { pid } = item;

      o[id] = o[id] ? { ...o[id], ...item } : { ...item, id, pid };

      o[pid] = o[pid] || {
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
    let item = this.collection[id];

    let result: itemId[] = [];
    let maxLength = 0;

    while (item && item.pid && maxLength < 10) {
      if (item.pid === rootId) break;
      result.push(item.pid);
      item = this.collection[item.pid];
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
   * Updates child indexes
   * @param pid - id of root item
   * @params {add, remove} - remove item while reindex or add item
   * @returns
   */
  reindexDirectChildrens(
    pid: itemId = this.options.defaultRoot,
    { remove, add }: { add?: ItemType; remove?: itemId } = {}
  ) {
    // Get items
    let childrens = this.getDirectChildrens(pid);

    // Remove
    if (remove) childrens = childrens.filter((item) => item.id !== remove);

    // Insert
    if (add) {
      let newIndex =
        add.index !== undefined ? add.index : childrens.length || 0;

      childrens = insert(childrens, newIndex, {
        ...add,
        index: newIndex,
      });
    }

    // Sort
    childrens = sort(childrens, "index");

    // Re-index
    this.updateCollectionWith(childrens);

    return this.collection;
  }

  /**
   * Add child item
   * @param payload - Child object with required (pid,id,index)
   * @param check - Check if already exists
   * @returns
   */
  add(
    payload: { pid: itemId; id: itemId; index?: number },
    check?: { key: string; value: any }
  ) {
    const { pid = this.options.defaultRoot, index, id } = payload;

    if (check) {
      if (this.checkDuplicates(pid, check.key, check.value))
        return this.collection; // Already exisits in pid
    }

    // Build child
    const child = {
      ...payload,
      pid,
      id: id || generateId(),
      index,
    };

    this.reindexDirectChildrens(pid, { add: child });

    return this.collection;
  }

  /**
   * Remove child
   * @param id - target item id
   * @param childrenBehavior - what to do with target childrens
   * @returns
   */
  remove(id: itemId, childrenBehavior?: "save" | "orphan" | undefined) {
    const { pid } = this.collection[id];

    // Delete item childrens
    if (!childrenBehavior) {
      for (const item of this.getDeepChildren(id)) {
        delete this.collection[item.id];
      }
    } else if (childrenBehavior === "orphan") {
      // Make orphaned
      const deletedChildrens = this.getDirectChildrens(id);
      // Move children to orphaned pid
      // Get orphaned items
      if (deletedChildrens.length > 0 && !this.collection.orphaned) {
        this.add({ pid: this.options.defaultRoot, id: "orphaned" });
      }
      // Set deleted children to orphaned
      for (const item of deletedChildrens) {
        this.collection[item.id].pid = "orphaned";
      }

      this.reindexDirectChildrens("orphaned");
    }

    delete this.collection[id];

    // Reindex siblings
    this.reindexDirectChildrens(pid);

    return this.collection;
  }

  /**
   * Edit child object
   * @param id - child id
   * @param payload - new child collection
   * @returns
   */
  edit(id: itemId, payload: object) {
    const item = this.collection[id];
    if (!item) this.collection;
    this.collection[id] = { ...item, ...payload, id };
    return this.collection;
  }

  /**
   * Move child to new parent
   * @param id - child id
   * @param newIndex - index in new parent
   * @param pid - new parent id
   * @returns
   */
  move(id: string, newIndex: number, pid?: itemId) {
    const child = { ...this.collection[id], id: id };

    if (pid && pid === id) return this.collection;

    if (pid && this.isDeepParent(pid, id)) return this.collection;

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
    return this.collection;
  }

  checkDuplicates(pid: itemId, key: string, value: any) {
    const childrens = this.getDirectChildrens(pid);
    return childrens.findIndex((item) => item[key] === value) !== -1;
  }
}

export default TreeBase;
