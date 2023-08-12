# TreeBase

`Treebase` is a versatile and efficient library designed to manage and manipulate tree structures. With a host of powerful utilities and a straightforward API, working with hierarchical data structures has never been easier.

## Features

- **Easy Manipulation**: Add, delete, update, or move nodes with ease.
- **Reindexing Support**: Ensure your tree remains organized even after intensive operations.
- **High Performance**: Optimized for both small and large datasets, ensuring high performance at all times.

## Installation

```bash
yarn add treebase
npm install treebase
```

## Usage

```javascript
import { TreeBase } from "treebase";

// Use "dictionary" or "tree" as initial data if "tree" exist "dictionary" will be ignored
const props = {
  // USE DICTIONARY
  dictionary: {
    aa: { title: "Root Item", pid: "root" }, // when init we can leave id empty it will be populated from key
    ab: { title: "Child Item 1", pid: "1" },
    ac: { title: "Child Item 2", pid: "1" },
    abc: { title: "Child Item 3", pid: "2" },
  },
  // OR TREE
  tree: [
    {
      id: "aa",
      title: "Root Item",
      children: [
        {
          id: "ab",
          title: "Child Item 1",
          children: [{ id: "abc", title: "Child Item 3" }],
        },
        { id: "ac", title: "Child Item 2" },
      ],
    },
  ],
  // OPTIONS
  options: {
    pid: "pid",
    children: "children",
    isDir: null,
    defaultRoot: "root",
  },
};

const treebase = new TreeBase(props);

treebase.add({ id: "4", title: "Child Item 3", pid: "1" });

// tree sctructured data
let treeData = treebase.tree;
// key value dictionary
let treeDictionary = treebase.dictionary;

// Get tree of a specific root
let treeData = treebase.getTree("1");

console.log(treeData, treeDictionary);
```

# Result

tree.

## Methods

### `getTree(rootId, keepIndex)`

Constructs a hierarchical tree structure starting from the specified root.

- **Parameters**:
  - `rootId`: The identifier for the root of the tree (defaults to `this.options.defaultRoot`).
  - `keepIndex`: Whether to preserve the order of items based on their index (defaults to `true`).
- **Returns**: A tree structure where each item has a list of its children.

---

### `add(item, check)`

Adds a new item to the tree structure.

- **Parameters**:
  - `item`: The item to be added.
- **Returns**: The newly added item or the existing item if a duplicate is found.

---

### `delete(id, moveChildren?)`

Removes an item from the tree structure.

- **Parameters**:
  - `id`: The ID of the target item to delete.
  - `moveChildren`: If true, moves children to default root. If given a string (ID), moves children to the specified parent. If false or undefined, deletes children.
- **Returns**: Updated dictionary.

---

### `update(id, payload)`

Updates properties of a specified item in the tree structure.

- **Parameters**:
  - `id`: The unique identifier of the item to be updated.
  - `payload`: An object containing the properties to be updated.
- **Returns**: The updated item with the new properties.

---

### `move(id, {index?, pid?})`

Moves a child to a different parent or position within the tree structure.

- **Parameters**:

  - `id`: The unique identifier of the child to be moved.
  - `options`: An object containing the new index and/or parent ID. If no index is specified, the child will be moved to the end of the list.

- **Returns**: The updated dictionary after the move operation.

---

### `getDirectChildren(id)`

Retrieves the direct children of a specified parent item.

- **Parameters**:
  - `id`: The unique identifier of the parent item.
- **Returns**: List containing all the direct children of the specified parent item.

---

### `getDeepChildren(pid)`

Retrieves all descendants (deep children) of a specified parent item.

- **Parameters**:
  - `pid`: The unique identifier of the parent item.
- **Returns**: A flattened list containing all descendants of the specified parent item.

---

### `haveChildren(id)`

Checks if an item has any children.

- **Parameters**:
  - `id`: target item.
- **Returns**: `true` if the item has children, `false` otherwise.

---

### `getParents(id, rootId)`

Get all parents of a child until the root item.

- **Parameters**:
  - `id`: target child.
  - `rootId`: root item id.
- **Returns**: Array of parent ids.

---

### `isDeepParent(id, pid)`

Checks if an item is a deep parent of another item.

- **Parameters**:
  - `id`: child item ID.
  - `pid`: potential parent item ID.
- **Returns**: `true` if pid is a parent of id, `false` otherwise.

---

### `reindexDirectChildren(pid, options)`

Re-indexes the direct children of a specified parent item.

- **Parameters**:
  - `pid`: The unique identifier of the parent item.
  - `options`: Configuration object for adding or removing items.
- **Returns**: The updated dictionary after reindexing the children.

---

### `updateDictionaryFromList(list)`

Update dictionary object from an array of items.

- **Parameters**:
  - `list`: list items.
- **Returns**: None.
