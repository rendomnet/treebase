import {
  Dictionary,
  ItemId,
  Item,
  TreeItem,
  ItemList,
  ItemTree,
  Options,
  TreeBaseProps,
} from "./types";

import { insert, sort, initDictionary, generateId } from "./helpers";

/**
 * Represents a tree structure with CRUD operations and utilities for
 * tree manipulation.
 */
class TreeBase {
  // A flat key-value representation of the tree.
  private dictionary: Dictionary;

  // Configuration settings for tree manipulation.
  private options: Options;

  constructor(props: TreeBaseProps) {
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
   * Update dictionary object from an array of items
   * @param list - list items
   */
  updateDictionaryWith(list: ItemList): void {
    for (const [index, item] of list.entries()) {
      if (item.id != null) {
        this.dictionary[item.id] = item;
        this.dictionary[item.id].index = index;
      }
    }
  }

  /**
   * Return sanitized dictionary object in a safe way
   * @param dictionary
   * @returns A sanitized dictionary object
   */
  getDictionary(dictionary: Dictionary): Dictionary {
    const result = Object.keys(dictionary).reduce((acc, id) => {
      acc[id] = {
        ...dictionary[id],
        pid: dictionary[id]?.pid || this.options.defaultRoot,
      };
      return acc;
    }, {} as Dictionary);

    return result;
  }

  /**
   * Converts dictionary object to an array of items
   * @param dictionary - dictionary object
   * @returns ItemList - An array of items
   */
  private _dictionaryToList(dictionary: Dictionary): ItemList {
    return Object.keys(dictionary).map((id) => ({
      ...dictionary[id],
      pid: dictionary[id].pid || this.options.defaultRoot,
      id: id,
    }));
  }

  private _treeToList(list: ItemTree, result: ItemList = []): ItemList {
    for (const item of list) {
      const children = item[this.options.children];
      const pid = item[this.options.pid];

      const newItem: Item = {
        ...item,
        pid: pid,
      };

      // Remove unwanted properties
      delete newItem[this.options.children];
      delete newItem[this.options.pid];

      result.push(newItem);
      if (children) this._treeToList(children as ItemTree, result);
    }
    return result;
  }

  /**
   * GET DIRECT CHILDS OF ITEM
   * @param id - parent id
   * @returns
   */
  getDirectChildrens(id: ItemId): ItemList {
    return this._dictionaryToList(this.dictionary).filter(
      (item) => String(item.pid) === String(id)
    );
  }

  /**
   * GET DEEP CHILDRENS
   * @param pid - id of parent
   * @returns - flat list of child items
   */
  getDeepChildren(pid: ItemId): ItemList {
    const result: ItemList = [];

    if (this.options.isDir) {
      // If isDir is exist
      const recurFind = (idList: ItemId[]) => {
        for (const id of idList) {
          let direct = this.getDirectChildrens(id);
          result.push(...direct);
          // Find all folders of direct children
          let innerFolders = direct.filter((item: Item) =>
            this.options.isDir!(item)
          );
          let innerIds = innerFolders.map((item) => item.id);
          if (innerIds.length) recurFind(innerIds);
        }
      };
      recurFind([pid]);
    } else {
      // If isDir func not exist, check manually
      for (const id in this.dictionary) {
        if (this.isDeepParent(id, pid)) {
          result.push(this.dictionary[id]);
        }
      }
    }
    return result;
  }

  /**
   * BUILD TREE
   * @param rootId - root of tree (default is from options)
   * @param keepIndex - put items in their index (can leave empty fields); default is true
   * @returns ItemTree - A tree structure of items
   */
  getTree(
    rootId: ItemId = this.options.defaultRoot,
    keepIndex: boolean = true
  ): ItemTree {
    const tree: Record<ItemId, TreeItem> = {};

    // Populate tree
    for (const id in this.dictionary) {
      const item = this.dictionary[id];
      const pid = item.pid === undefined ? this.options.defaultRoot : item.pid;

      // Ensure current item exists in tree
      tree[id] = tree[id] || { ...item, id, pid, children: [] };

      // Ensure parent item exists in tree
      tree[pid] = tree[pid] || {
        id: pid,
        pid: this.options.defaultRoot,
        children: [],
      };

      // Add current item to parent's children
      if (keepIndex && item.index !== undefined) {
        tree[pid].children[item.index] = tree[id];
      } else {
        tree[pid].children.push(tree[id]);
      }
    }

    return tree[rootId]?.children || [];
  }

  /**
   * Checks if an item has any children.
   * @param id - target item
   * @returns boolean - true if the item has children, false otherwise
   */
  haveChildren(id: ItemId): boolean {
    return this.getDirectChildrens(id)?.length > 0;
  }

  /**
   * Get all parents of a child until the root item.
   * @param id - target child
   * @param rootId - root item id (default is from options)
   * @returns ItemId[] - array of parent ids
   */
  getParents(id: ItemId, rootId: ItemId = this.options.defaultRoot): ItemId[] {
    const result: ItemId[] = [];
    let currentId = id;
    const visitedIds = new Set<ItemId>();

    while (currentId && currentId !== rootId) {
      const parentItem = this.dictionary[currentId];
      if (
        !parentItem ||
        parentItem.pid === undefined ||
        visitedIds.has(parentItem.pid)
      )
        break;

      visitedIds.add(parentItem.pid);
      result.push(parentItem.pid);
      currentId = parentItem.pid;
    }

    return result;
  }

  /**
   * Checks if an item is a deep parent of another item.
   * @param id - child item ID
   * @param pid - potential parent item ID
   * @returns boolean - true if pid is a parent of id, false otherwise
   */
  isDeepParent(id: ItemId, pid: ItemId): boolean {
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
    pid: ItemId = this.options.defaultRoot,
    { add, remove }: { add?: Item; remove?: ItemId } = {}
  ): Dictionary {
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
  add(item: Item, check?: { key: string; value: any }): Item {
    const { pid = this.options.defaultRoot, index, id } = item;

    if (check) {
      let duplicate = this.checkKeyPropertyExists(pid, check.key, check.value);
      if (duplicate) return this.dictionary[duplicate.id]; // Already exisits in pid
    }

    const childId = id || generateId(this.dictionary);

    // Build child
    const childData = {
      ...item,
      pid,
      id: childId,
    };

    this.reindexDirectChildrens(pid, { add: childData });

    return { id: childId, pid, ...childData };
  }

  /**
   * Removes an item from the tree structure.
   * @param id - The ID of the target item to remove.
   * @param saveChildren - If true, moves children to default root. If given a string (ID), moves children to the specified parent. If false or undefined, deletes children.
   * @returns Updated dictionary.
   */
  remove(id: ItemId, saveChildren?: ItemId | boolean): Dictionary {
    const targetItem = this.dictionary[id];
    if (!targetItem) {
      throw new Error(`Item with ID ${id} not found.`);
    }

    const { pid } = targetItem;

    if (saveChildren) {
      const targetPid =
        typeof saveChildren === "string"
          ? saveChildren
          : this.options.defaultRoot;

      // Move direct children to targetPid
      const children = this.getDirectChildrens(id);
      for (const child of children) {
        child.pid = targetPid;
      }

      // Reindex children
      this.reindexDirectChildrens(targetPid);
    } else {
      // Delete deep children
      for (const child of this.getDeepChildren(id)) {
        delete this.dictionary[child.id];
      }
    }

    // Remove the target item
    delete this.dictionary[id];

    // Reindex siblings
    this.reindexDirectChildrens(pid);

    return this.dictionary;
  }

  /**
   * UPDATE ITEM
   * @param id - child id
   * @param payload - new child properties
   * @returns Updated item
   */
  update(id: ItemId, payload: Partial<Item>): Item {
    const item = this.dictionary[id];

    if (!item) throw new Error(`Item with ID ${id} not found.`);

    // Update the item while ensuring the id remains unchanged
    this.dictionary[id] = { ...item, ...payload, id };

    return this.dictionary[id];
  }

  /**
   * Move child to a new parent or position.
   * @param id - The ID of the child to move.
   * @param newIndex - The index at which the child should be positioned under the new parent.
   * @param pid - The ID of the new parent. If omitted, the child will be reordered within its current parent.
   * @returns Updated dictionary.
   */
  move(id: ItemId, newIndex: number, pid?: ItemId): Dictionary {
    const child = { ...this.dictionary[id], id };

    // Prevent moving an item to itself
    if (pid && pid === id) {
      console.warn("An item cannot be moved to itself.");
      return this.dictionary;
    }

    // Prevent moving an item to one of its descendants
    if (pid && this.isDeepParent(pid, id)) {
      console.warn("An item cannot be moved under one of its descendants.");
      return this.dictionary;
    }

    // New pid
    if (pid && pid !== child.pid) {
      this.remove(id, true); // if parent is moving dont delete children
      this.add({
        ...child,
        pid: pid,
        index: newIndex !== undefined ? newIndex : child.index,
      });
    } else {
      // Reorder within the same parent
      this.reindexDirectChildrens(child.pid, {
        remove: id,
        add: { ...child, index: newIndex },
      });
    }
    return this.dictionary;
  }

  /**
   * Searches for a child of a given parent that has a specific property with a certain value.
   * @param pid - The parent ID.
   * @param key - The property key to look for.
   * @param value - The desired value of the property.
   * @returns The child object if found, otherwise undefined.
   */
  checkKeyPropertyExists(
    pid: ItemId,
    key: string,
    value: any
  ): Item | undefined {
    const children = this.getDirectChildrens(pid);
    return children.find((child) => child[key] === value);
  }
}

export default TreeBase;
