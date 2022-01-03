import { nanoid } from "nanoid";

interface TreeDataType {
  [P: idType]: childType;
}

type childListType = childType[];
type idType = string;

type childType = {
  id: idType;
  pid: idType;
  index?: number;
  children?: childListType;
  [key: string]: any;
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

// TREEBASE
class TreeBase {
  data: any;
  options: {
    pid: string;
    children: string;
  };

  constructor(props: any) {
    this.data = { ...(props.data || {}) };
    this.options = {
      pid: "pid",
      children: "children",
      ...(props.options || {}),
    };
  }

  flatten(data): childListType {
    return Object.keys(data).map((id) => ({
      ...data[id],
      pid: data[id].pid || "root",
      id: id,
    }));
  }

  private prepareData(data: object) {
    let result = {};
    Object.keys(data).map((id) => {
      result[id] = { ...data?.[id], pid: data?.[id]?.pid || "root" };
    });
    return result;
  }

  buildTree(data: childListType, rootId: string): childListType {
    const result = data.reduce((o, item) => {
      const { id, [this.options.pid]: pid } = item;

      o[id] = o[id] ? { ...o[id], ...item } : { ...item, id, pid };

      o[pid] = o[pid] || {
        ...(o[pid] && o[pid]),
        ...(pid && { id: pid }),
        ...(o[pid]?.pid ? { pid: o[pid]?.pid } : { pid: "root" }),
      };

      if (o[pid]) {
        o[pid].children = o[pid].children || [];

        if (o[id].index !== undefined) {
          o[pid].children[o[id].index] = o[id];
        } else {
          o[pid].children.push(o[id]);
        }
      }
      return o;
    }, {} as TreeDataType);

    if (result?.[rootId]?.children) return result[rootId].children;
    return [];
  }

  buildFlat(list: childType[], result: childType[] = []): childType[] {
    for (let item of list) {
      // const { [this.options.children]: children, ...rest } = item;

      let children = item[this.options.children];
      let pid = item[this.options.pid];

      delete item[this.options.children];
      delete item[this.options.pid];

      item.pid = pid;

      result.push(item);
      if (children) this.buildFlat(children, result);
    }
    return result;
  }

  buildData(list: childType[], result = {}): {} {
    for (const item of list) {
      let children = item[this.options.children];
      let pid = item[this.options.pid];

      delete item[this.options.children];
      delete item[this.options.pid];

      item.pid = pid;
      if (item.id) {
        result[item.id] = { ...(result[item.id] || {}), ...item };
      }
      if (children) this.buildData(children, result);
    }
    return result;
  }

  getTree(id = "root"): childListType {
    return this.buildTree(this.flatten(this.data), id);
  }

  getData() {
    return this.prepareData(this.data);
  }

  getList(id: idType) {
    return this.buildFlat(this.getTree(id));
  }

  listToData(list: childListType) {
    return this.buildFlat(list);
  }

  haveChildren(id: idType) {
    if (this.getDirectChildrens(id)?.length > 0) return true;
    return false;
  }

  isDeepParent(id: idType, pid: idType) {
    let item = this.data[id];

    let result = false;
    let maxLength = 0;
    while (item && item.pid !== "root" && maxLength < 10) {
      if (item.pid === pid) {
        result = true;
        break;
      }
      maxLength += 1;
      item = this.data[item.pid];
    }

    return result;
  }

  // Get list of all item parents
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

  generateId(): string {
    const newId = nanoid(5);
    if (this.data[newId]) return this.generateId();
    return newId;
    // return Math.max(...(Object.keys(this.props.data) + 1));
  }

  getChildren(id: idType) {
    return this.buildTree(this.flatten(this.data), id);
  }

  reindexChildrens(pid: idType, removeId?: idType, addChild?: childType) {
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
    this.populate(childrens);

    return this.getData();
  }

  populate(list) {
    for (const [index, item] of list.entries()) {
      this.data[item.id] = { ...item, index };
    }
  }

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

    this.reindexChildrens(pid, undefined, child);

    return this.getData();
  }

  removeChild(id: idType, childrenBehavior?: "save" | "orphan" | undefined) {
    const { pid } = this.data[id];

    // Delete children
    if (!childrenBehavior) {
      for (const item of this.getList(id)) {
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

      this.reindexChildrens("orphaned");
    }

    delete this.data[id];

    // Reindex siblings
    this.reindexChildrens(pid);

    return this.getData();
  }

  editChild(id: idType, payload: object) {
    const item = this.data[id];
    if (!item) this.data;
    this.data[id] = { ...item, ...payload, id };
    return this.getData();
  }

  moveChild(id: string, newIndex: number, pid?: idType) {
    const child = { ...this.data[id], id: id };

    if (pid && pid === id) return this.getData();

    if (pid && this.isDeepParent(pid, id)) return this.getData();

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
      this.reindexChildrens(child.pid, id, { ...child, index: newIndex });
    }
    return this.getData();
  }

  getDirectChildrens(id: idType): childListType {
    return this.flatten(this.data).filter((item) => item.pid === id);
  }

  checkDuplicates(pid: idType, key: string, value: any) {
    const childrens = this.getDirectChildrens(pid);
    return childrens.findIndex((item) => item[key] === value) !== -1;
  }
}

export default TreeBase;
