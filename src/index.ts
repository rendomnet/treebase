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

import {
  insert,
  sort,
  sortReindex,
  initData,
  generateId,
  getNestedValue,
  reindex,
} from "./helpers";

/**
 * Represents a tree structure with CRUD operations and utilities for
 * tree manipulation.
 */
class TreeBase {
  // A flat key-value representation of the tree.
  dictionary: Dictionary;

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

    this.dictionary = initData(props.data, this.options);
  }

  /**
   * Generates a dictionary from the provided data. Each item in the dictionary
   * is sanitized to ensure it has a valid 'pid'. If an item doesn't have a 'pid',
   * it defaults to 'this.options.defaultRoot'.
   *
   * @param {boolean} sanitize - Whether to sanitize the items in the dictionary.
   * @returns {Dictionary} The generated dictionary with sanitized items.
   */
  getDictionary(sanitize?: false): Dictionary {
    if (!sanitize) return this.dictionary;
    const result = Object.keys(this.dictionary).reduce((acc, id) => {
      acc[id] = {
        ...this.dictionary[id],
        pid: this.dictionary[id]?.pid || this.options.defaultRoot,
      };
      return acc;
    }, {} as Dictionary);

    return result;
  }

  /**
   * Constructs a hierarchical tree structure starting from the specified root.
   * This tree represents relationships between items based on their parent-child associations.
   *
   * @param {ItemId} rootId - The identifier for the root of the tree. Defaults to the value specified in the options.
   * @param {boolean} keepIndex - Whether to preserve the order of items based on their index.
   *                              If set to true, the tree might have empty fields representing missing indices.
   *                              Defaults to true.
   * @returns {ItemTree} Returns a tree structure where each item has a list of its children.
   *                     The tree starts from the specified root and expands based on parent-child relationships.
   */
  getTree(
    rootId: ItemId = this.options.defaultRoot,
    keepIndex: boolean = true
  ): ItemTree {
    const tree: Record<ItemId, TreeItem> = {};

    // Populate tree
    for (const id in this.dictionary) {
      const item: TreeItem = { ...this.dictionary[id], id: id };
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

    return (tree[rootId]?.children || []) as ItemTree;
  }

  // CRUD OPERATIONS

  /**
   * Adds a new item.
   *
   * @param {Item} item - The item to be added. It should contain properties relevant to the tree structure
   *                                                   such as 'pid' for parent identifier, 'index' for position. 'id' is optional and will be generated if not provided.
   * @returns {Item & { id: ItemId }} Returns the newly added item or the existing item if a duplicate is found based on the check criteria.
   */
  add(item: Omit<Item, "id"> & { id?: ItemId }): Item & { id: ItemId } {
    const { pid = this.options.defaultRoot, id } = item;

    // Check if item already exists
    if (id && this.dictionary[id]) {
      return { ...this.dictionary[id], id: id };
    }

    const childId = id || generateId(this.dictionary);

    // Build child
    const childData = {
      ...item,
      id: childId,
      pid,
    };

    // Add child to dictionary
    if (item.index !== undefined) {
      // Insert child at specified index
      let siblings = this.getDeepChildren(pid);
      // Sort siblings by index
      siblings = sort(siblings);
      // Insert child at specified index
      siblings = insert(siblings, item.index, childData);
      // Reindex siblings
      siblings = reindex(siblings);
      // Update dictionary
      this.updateDictionaryFromList(siblings);
    } else {
      this._updateDictionary(childId, childData);
      this.reindexDirectChildren(pid);
    }

    return { ...this.dictionary[childId], id: childId };
  }

  /**
   * Updates properties of a specified item in the tree structure.
   *
   * @param {ItemId} id - The unique identifier of the item to be updated.
   * @param {Partial<Item>} payload - An object containing the properties to be updated.
   * @returns {Item} Returns the updated item with the new properties.
   * @throws {Error} Throws an error if the item with the given ID is not found or if the index is changed.
   */
  update(id: ItemId, payload: Partial<Item>): Item {
    const item = this.dictionary[id];

    if (!item) throw new Error(`Item with ID ${id} not found.`);

    // Prevent changing index and id
    const { index, id: oldId, pid, ...changes } = payload;

    // Update the item while ensuring the id remains unchanged
    this.dictionary[id] = { ...item, ...changes, id };

    return this.dictionary[id];
  }

  /**
   * Delete an item.
   * @param id - The ID of the target item to delete.
   * @param moveChildren - If true, moves children to default root. If given a string (ID), moves children to the specified parent. If false or undefined, deletes children.
   * @throws {Error} Throws an error if the item with the given ID is not found or if it is the root item.
   * @returns Updated dictionary.
   */
  delete(
    id: ItemId,
    options: { moveTo?: ItemId; moveToRoot?: boolean } = {}
  ): Dictionary {
    const targetItem = this.dictionary[id];
    const { moveTo, moveToRoot } = options;
    if (!targetItem) {
      throw new Error(`Item with ID ${id} not found.`);
    }

    if (id === this.options.defaultRoot) {
      throw new Error(`Cannot delete root item.`);
    }

    const { pid } = targetItem;

    if (moveToRoot || moveTo) {
      const targetPid = moveTo || this.options.defaultRoot;

      if (
        moveTo &&
        moveTo !== this.options.defaultRoot &&
        !this.dictionary[targetPid]
      ) {
        throw new Error(
          `Can't move children to non-existent parent ${targetPid}.`
        );
      }

      // Move direct children to targetPid
      const children = this.getDirectChildren(id);

      // Update pid of children and remove index so they are appended to the end
      const updatedPidList = children.map(({ index, ...item }) => ({
        ...item,
        pid: targetPid,
      }));

      this.updateDictionaryFromList(updatedPidList);

      // Reindex children
      this.reindexDirectChildren(targetPid);
    } else {
      // Delete deep children
      for (const child of this.getDeepChildren(id)) {
        delete this.dictionary[child.id];
      }
    }

    // Remove the target item
    delete this.dictionary[id];

    // Reindex siblings
    this.reindexDirectChildren(pid);

    return this.dictionary;
  }

  /**
   * Moves a child to a different parent or position within the tree structure.
   *
   * @param {ItemId} id - The unique identifier of the child to be moved.
   * @param {Object} options - An object containing options to guide the move operation.
   * @param {number} [options.index] - The desired index position under the new or current parent.
   * @param {ItemId} [options.pid] - Optional. The ID of the new parent. If omitted, the child remains under its current parent but may be reordered.
   * @returns {Item} Returns the updated item with the new properties.
   * @throws {Error} Throws an error if attempting to move an item to itself or to one of its descendants.
   */
  move(
    id: ItemId,
    options: { index: number; pid?: ItemId } | { index?: number; pid: ItemId }
  ): Item {
    const index = options?.index || undefined;
    const pid = options?.pid || undefined;

    const oldPid = this.dictionary[id].pid;
    const child = { ...this.dictionary[id], id, ...(pid ? { pid } : {}) };

    const isReorder = index !== null && index !== undefined;
    // Prevent moving an item to itself
    if (pid === id) {
      console.warn("An item cannot be moved to itself.");
      return this.dictionary[id];
    }

    // Prevent moving an item to one of its descendants
    if (pid && this.isDeepParent(pid, id)) {
      console.warn("An item cannot be moved under one of its descendants.");
      return this.dictionary[id];
    }

    // Reorder within the same parent

    // Get siblings
    let siblings = this.getDeepChildren(pid || oldPid);

    // Remove child from siblings if reordering within the same parent
    if (!pid) siblings = siblings.filter((item) => item.id !== id);

    // Sort siblings
    siblings = sort(siblings);

    // Add child to siblings
    if (isReorder) siblings = insert(siblings, index, child);
    else siblings.push(child);
    siblings = reindex(siblings);

    this.updateDictionaryFromList(siblings);

    // Reindex old siblings
    if (pid) this.reindexDirectChildren(oldPid);

    return this.dictionary[id];
  }

  /**
   * Retrieves the direct children of a specified parent item.
   *
   * @param {ItemId} pid - The unique identifier of the parent item whose direct children are to be fetched.
   * @returns {ItemList} Returns a list containing all the direct children of the specified parent item.
   */
  getDirectChildren(pid: ItemId): ItemList {
    const result = [];
    for (const id in this.dictionary) {
      const item = this.dictionary[id];
      if (item.pid === pid) result.push({ ...item, id: id });
    }
    return result;
  }

  /**
   * Retrieves all descendants (deep children) of a specified parent item.
   *
   * If the `isDir` option is set, the function will specifically look for directory-like items.
   * Otherwise, it fetches all children in a recursive manner.
   *
   * @param {ItemId} pid - The unique identifier of the parent item whose descendants are to be fetched.
   * @returns {ItemList} A flattened list containing all descendants of the specified parent item.
   */
  getDeepChildren(pid: ItemId): ItemList {
    const result: ItemList = [];

    if (this.options.isDir) {
      // If isDir is exist
      const recurFind = (idList: ItemId[]) => {
        for (const id of idList) {
          const direct = this.getDirectChildren(id);
          result.push(...direct);
          // Find all folders of direct children
          const innerFolders = direct.filter((item: Item) =>
            this.options.isDir!(item)
          );
          const innerIds = innerFolders.map((item) => item.id);
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
   * Checks if an item has any children.
   * @param id - target item
   * @returns boolean - true if the item has children, false otherwise
   */
  haveChildren(id: ItemId): boolean {
    return this.getDirectChildren(id)?.length > 0;
  }

  /**
   * Get an array of parent IDs from a child item up to the root item.
   *
   * @param {ItemId} id - The target child item ID.
   * @param {ItemId} [rootId] - The root item ID (default is taken from options).
   * @returns {ItemId[]} An array of parent item IDs.
   */
  getParents(id: ItemId, rootId?: ItemId): ItemId[] {
    const result: ItemId[] = [];
    let currentId = id;
    const visitedIds = new Set<ItemId>();
    if (!rootId) rootId = this.options.defaultRoot;

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
   * Searches for items matching a specified query.
   *
   * @param {string} path - The path to the property to search in.
   * @param {string} value - The value to search for.
   * @returns
   */
  search(path: string, value: string): Item[] {
    const matches: { item: Item; ratio: number }[] = [];

    for (const key in this.dictionary) {
      const item: Item = this.dictionary[key];
      const nestedValue = getNestedValue(item, path);
      if (
        nestedValue &&
        typeof nestedValue === "string" &&
        nestedValue.toLowerCase().includes(String(value.toLowerCase()))
      ) {
        const ratio = value.length / nestedValue.length;
        matches.push({ item: item, ratio });
      }
    }

    // Sort matches by ratio in descending order (most accurate first)
    matches.sort((a, b) => b.ratio - a.ratio);

    return matches.map((match) => match.item);
  }

  /**
   * Re-indexes the direct children of a specified parent item.
   *
   * @param {ItemId} pid - The unique identifier of the parent item whose children are to be reindexed. Defaults to the default root if not provided.
   * @returns {Dictionary} The updated dictionary after reindexing the children.
   */
  reindexDirectChildren(pid: ItemId = this.options.defaultRoot): ItemList {
    // Get items
    let children = this.getDirectChildren(pid);

    // Sort
    children = sortReindex(children);

    // Re-index
    this.updateDictionaryFromList(children);

    return children;
  }

  /**
   * Update the dictionary object using an array of items. If an item does not have an ID, a new ID will be generated for it.
   *
   * @param {ItemList} list - The list of items to update the dictionary with.
   * @returns {Dictionary} - The updated dictionary.
   */
  updateDictionaryFromList(list: ItemList): Dictionary {
    for (const item of list) {
      const id = item.id || generateId(this.dictionary);
      this.dictionary[id] = { ...item, id: id };
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
  private _checkKeyPropertyExists(
    pid: ItemId,
    key: string,
    value: any
  ): Item | undefined {
    const children = this.getDirectChildren(pid);
    return children.find((child) => child[key] === value);
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

  private _updateDictionary(id: ItemId, data: Item) {
    this.dictionary[id] = data;
  }
}

export default TreeBase;
