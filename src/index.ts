function makeId(length: number): itemId {
  for (
    var s = "";
    s.length < length;
    s +=
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
        (Math.random() * 62) | 0
      )
  );
  return s;
}

interface CollectionType {
  [P: itemId]: ItemType;
}

type itemId = string;

type ItemType = {
  id: itemId;
  pid: itemId;
  index?: number;
  data?: object;
};

type TreeItemType = {
  id: itemId;
  pid: itemId;
  index?: number;
  children?: ItemType[];
  data?: object;
};

type ItemListType = ItemType[];
type ItemTreeType = TreeItemType[];

type optionsType = {
  pid: string;
  children: string;
  isDir: Function;
};

type initCollectionType = {
  tree: [];
  collection: object;
};

export const insert = <T>(arr: T[], index: number, newItem: T): T[] => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

function sort(array, property: string) {
  return array.sort((a: object, b: object) =>
    a[property] > b[property] ? 1 : -1
  );
}

/**
 * Create collection object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial collection object (default is empty)
 * @returns treebase collection
 */
function collectionFromTree(
  tree: ItemTreeType,
  result = {},
  options: optionsType
): CollectionType {
  for (const originalItem of tree) {
    let item = { ...originalItem };
    let children = item[options.children];
    let pid = item[options.pid];

    delete item[options.children];
    delete item[options.pid];

    item.pid = pid;
    if (item.id) {
      result[item.id] = { ...(result[item.id] || {}), ...item };
    }
    if (children) collectionFromTree(children, result, options);
  }
  return result;
}

function initCollection(props: initCollectionType, options: optionsType) {
  if (props.tree) {
    return collectionFromTree(props.tree, {}, options);
  } else return { ...(props.collection || {}) };
}

/**
 * TREEBASE class
 */
class TreeBase {
  collection: CollectionType;
  options: optionsType;

  constructor(props: any) {
    this.options = {
      pid: "pid",
      children: "children",
      isDir: null,
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
   * Update collection from list items
   * @param list - list items
   */
  updateCollectionWith(list: ItemListType) {
    for (const [index, item] of list.entries()) {
      this.collection[item.id] = { ...item, index };
    }
  }

  generateId(value = 5): string {
    const newId = makeId(value);
    if (this.collection[newId]) return this.generateId();
    return newId;
    // return Math.max(...(Object.keys(this.props.collection) + 1));
  }

  /**
   * Return sanitized collection object in safe way
   * @param collection
   * @returns
   */
  private prepareCollection(collection: object) {
    let result = {};
    Object.keys(collection).map((id) => {
      result[id] = {
        ...collection?.[id],
        pid: collection?.[id]?.pid || "root",
      };
    });
    return result;
  }

  /**
   * Converts collection object to flat list
   * @param collection - collection object
   * @returns
   */
  private collectionToList(collection: CollectionType): ItemListType {
    return Object.keys(collection).map((id) => ({
      ...collection[id],
      pid: collection[id].pid || "root",
      id: id,
    }));
  }

  private listFromTree(
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
      if (children) this.listFromTree(children, result);
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
   * Get tree of item
   * @param options - Parameters
   * @returns tree
   */
  getTree(options: { rootId: string; keepIndex: boolean }): ItemTreeType {
    const { rootId = "root", keepIndex = true } = options;
    let o = {};
    for (const id in this.collection) {
      const item = this.collection[id];

      const { pid } = item;

      o[id] = o[id] ? { ...o[id], ...item } : { ...item, id, pid };

      o[pid] = o[pid] || {
        ...(o[pid] && o[pid]),
        ...(pid && { id: pid }),
        ...(o[pid]?.pid ? { pid: o[pid]?.pid } : { pid: "root" }),
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

  // Methods

  haveChildren(id: itemId) {
    if (this.getDirectChildrens(id)?.length > 0) return true;
    return false;
  }

  /**
   * Get all parents of child until root element
   * @param id - target child
   * @param rootId - root element id
   * @returns - array of parent ids
   */
  getParents(id: itemId, rootId: itemId = "root"): itemId[] {
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
   * @param pid
   * @param removeId
   * @param addChild
   * @returns
   */
  reindexTree(pid: itemId, removeId?: itemId, addChild?: ItemType) {
    // Reindex siblings
    let childrens = this.getDirectChildrens(pid);

    if (removeId) {
      // Remove from pid
      childrens = childrens.filter((item) => item.id !== removeId);
    }
    // Sort
    childrens = sort(childrens, "index");

    if (addChild) {
      // Insert
      let newIndex =
        addChild.index !== undefined ? addChild.index : childrens.length || 0;

      childrens = insert(childrens, newIndex, { ...addChild, index: newIndex });
    }

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
  addChild(
    payload: { pid: itemId; id: itemId; index?: number },
    check?: { key: string; value: any }
  ) {
    const { pid = "root", index, id } = payload;

    if (check) {
      if (this.checkDuplicates(pid, check.key, check.value))
        return this.collection; // Already exisits in pid
    }

    // Build child
    const child = {
      ...payload,
      pid,
      id: id || this.generateId(),
      index,
    };

    this.reindexTree(pid, undefined, child);

    return this.collection;
  }

  /**
   * Remove child
   * @param id - target item id
   * @param childrenBehavior - what to do with target childrens
   * @returns
   */
  removeChild(id: itemId, childrenBehavior?: "save" | "orphan" | undefined) {
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
        this.addChild({ pid: "root", id: "orphaned" });
      }
      // Set deleted children to orphaned
      for (const item of deletedChildrens) {
        this.collection[item.id].pid = "orphaned";
      }

      this.reindexTree("orphaned");
    }

    delete this.collection[id];

    // Reindex siblings
    this.reindexTree(pid);

    return this.collection;
  }

  /**
   * Edit child object
   * @param id - child id
   * @param payload - new child collection
   * @returns
   */
  editChild(id: itemId, payload: object) {
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
  moveChild(id: string, newIndex: number, pid?: itemId) {
    const child = { ...this.collection[id], id: id };

    if (pid && pid === id) return this.collection;

    if (pid && this.isDeepParent(pid, id)) return this.collection;

    // New pid
    if (pid && pid !== child.pid) {
      this.removeChild(id, "save"); // if parent is moving dont delete children
      this.addChild({
        ...child,
        pid: pid,
        index: newIndex !== undefined ? newIndex : child.index,
      });
    } else {
      // Reindex siblings
      this.reindexTree(child.pid, id, { ...child, index: newIndex });
    }
    return this.collection;
  }

  checkDuplicates(pid: itemId, key: string, value: any) {
    const childrens = this.getDirectChildrens(pid);
    return childrens.findIndex((item) => item[key] === value) !== -1;
  }
}

export default TreeBase;
