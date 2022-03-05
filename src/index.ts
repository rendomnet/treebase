import { nanoid } from "nanoid";

interface DataType {
  [P: idType]: childType;
}

type childListType = childType[];
type childTreeType = childType[];

type idType = string;

type childType = {
  id: idType;
  pid: idType;
  index?: number;
  children?: childListType;
  [key: string]: any;
};

type optionsType = {
  pid: string;
  children: string;
  isDir: Function;
};

type initDataType = {
  tree: [];
  data: object;
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
 * Create data object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial data object (default is empty)
 * @returns treebase data
 */
function dataFromTree(
  tree: childListType,
  result = {},
  options: optionsType
): DataType {
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
    if (children) dataFromTree(children, result, options);
  }
  return result;
}

function initData(props: initDataType, options: optionsType) {
  if (props.tree) {
    return dataFromTree(props.tree, {}, options);
  } else return { ...(props.data || {}) };
}

/**
 * TREEBASE class
 */
class TreeBase {
  data: DataType;
  options: optionsType;

  constructor(props: any) {
    this.options = {
      pid: "pid",
      children: "children",
      isDir: null,
      ...(props.options || {}),
    };
    this.data = initData(
      {
        data: props.data,
        tree: props.tree,
      },
      this.options
    );
  }

  /**
   * Update data from list items
   * @param list - list items
   */
  updateDataWith(list: childListType) {
    for (const [index, item] of list.entries()) {
      this.data[item.id] = { ...item, index };
    }
  }

  generateId(value = 5): string {
    const newId = nanoid(value);
    if (this.data[newId]) return this.generateId();
    return newId;
    // return Math.max(...(Object.keys(this.props.data) + 1));
  }

  /**
   * Return sanitized data object in safe way
   * @param data
   * @returns
   */
  private prepareData(data: object) {
    let result = {};
    Object.keys(data).map((id) => {
      result[id] = { ...data?.[id], pid: data?.[id]?.pid || "root" };
    });
    return result;
  }

  /**
   * Converts data object to flat list
   * @param data - data object
   * @returns
   */
  private dataToList(data: DataType): childListType {
    return Object.keys(data).map((id) => ({
      ...data[id],
      pid: data[id].pid || "root",
      id: id,
    }));
  }

  private listFromTree(
    list: childTreeType,
    result: childListType = []
  ): childListType {
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
  getDirectChildrens(id: idType): childListType {
    return this.dataToList(this.data).filter(
      (item) => String(item.pid) === String(id)
    );
  }

  /**
   * GET DEEP CHILDRENS
   * @param pid - id of parent
   * @returns - flat list of child items
   */
  getDeepChildren(pid: idType): childType[] {
    let result = [];

    if (this.options.isDir) {
      // If isDir is exist
      function recurFind(idList: idType[]) {
        for (const id of idList) {
          let direct = this.getDirectChildrens(id);
          result = [...direct];
          // Find all folders of direct childs
          let innerFolders: childType[] = direct.map((item: childType) =>
            this.options.isDir(item)
          );
          let innerIds = innerFolders.map((item) => item.id);
          recurFind(innerIds);
        }
      }
      recurFind([pid]);
    } else {
      // If isDir func not exist check manualy
      for (const id in this.data) {
        if (this.isDeepParent(id, pid)) {
          if (!result.includes(id)) {
            result.push(id);
          }
        }
      }
      result = result.map((id) => this.data[id]);
    }
    return result;
  }

  /**
   * Get tree of item
   * @param options - Parameters
   * @returns tree
   */
  getTree(options: { rootId: string; keepIndex: boolean }): childTreeType {
    const { rootId = "root", keepIndex = true } = options;
    let o = {};
    for (const id in this.data) {
      const item = this.data[id];

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

  haveChildren(id: idType) {
    if (this.getDirectChildrens(id)?.length > 0) return true;
    return false;
  }

  /**
   * Get all parents of child until root element
   * @param id - target child
   * @param rootId - root element id
   * @returns - array of parent ids
   */
  getParents(id: idType, rootId: idType = "root"): idType[] {
    let item = this.data[id];

    let result: idType[] = [];
    let maxLength = 0;

    while (item && item.pid && maxLength < 10) {
      if (item.pid === rootId) break;
      result.push(item.pid);
      item = this.data[item.pid];
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
  isDeepParent(id: idType, pid: idType) {
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
  reindexTree(pid: idType, removeId?: idType, addChild?: childType) {
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
    this.updateDataWith(childrens);

    return this.data;
  }

  /**
   * Add child item
   * @param payload - Child object with required (pid,id,index)
   * @param check - Check if already exists
   * @returns
   */
  addChild(
    payload: { pid: idType; id: idType; index?: number },
    check?: { key: string; value: any }
  ) {
    const { pid = "root", index, id } = payload;

    if (check) {
      if (this.checkDuplicates(pid, check.key, check.value)) return this.data; // Already exisits in pid
    }

    // Build child
    const child = {
      ...payload,
      pid,
      id: id || this.generateId(),
      index,
    };

    this.reindexTree(pid, undefined, child);

    return this.data;
  }

  /**
   * Remove child
   * @param id - target item id
   * @param childrenBehavior - what to do with target childrens
   * @returns
   */
  removeChild(id: idType, childrenBehavior?: "save" | "orphan" | undefined) {
    const { pid } = this.data[id];

    // Delete item childrens
    if (!childrenBehavior) {
      for (const item of this.getDeepChildren(id)) {
        delete this.data[item.id];
      }
    } else if (childrenBehavior === "orphan") {
      // Make orphaned
      const deletedChildrens = this.getDirectChildrens(id);
      // Move children to orphaned pid
      // Get orphaned items
      if (deletedChildrens.length > 0 && !this.data.orphaned) {
        this.addChild({ pid: "root", id: "orphaned" });
      }
      // Set deleted children to orphaned
      for (const item of deletedChildrens) {
        this.data[item.id].pid = "orphaned";
      }

      this.reindexTree("orphaned");
    }

    delete this.data[id];

    // Reindex siblings
    this.reindexTree(pid);

    return this.data;
  }

  /**
   * Edit child object
   * @param id - child id
   * @param payload - new child data
   * @returns
   */
  editChild(id: idType, payload: object) {
    const item = this.data[id];
    if (!item) this.data;
    this.data[id] = { ...item, ...payload, id };
    return this.data;
  }

  /**
   * Move child to new parent
   * @param id - child id
   * @param newIndex - index in new parent
   * @param pid - new parent id
   * @returns
   */
  moveChild(id: string, newIndex: number, pid?: idType) {
    const child = { ...this.data[id], id: id };

    if (pid && pid === id) return this.data;

    if (pid && this.isDeepParent(pid, id)) return this.data;

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
    return this.data;
  }

  checkDuplicates(pid: idType, key: string, value: any) {
    const childrens = this.getDirectChildrens(pid);
    return childrens.findIndex((item) => item[key] === value) !== -1;
  }
}

export default TreeBase;
