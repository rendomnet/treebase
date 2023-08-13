# TreeBase

`Treebase` is library designed to manage and manipulate tree structures. With a host of powerful utilities and a straightforward API, working with hierarchical data structures has never been easier.

<img src="https://user-images.githubusercontent.com/18900210/260242268-b2b914db-8d83-4540-bb07-c00126612e18.png" width="300" height="300" />

## Features

- **Easy Manipulation**: Add, delete, update, or move nodes with ease.
- **Search**: Search for nodes based on a specific property.
- **Hierarchical Tree**: Construct a hierarchical tree structure from a flat list of items.
- **Dictionary**: Get a key-value dictionary of all items in the tree structure.

## Installation

```bash
yarn add treebase
npm install treebase
```

## Usage

```javascript
import { TreeBase } from "treebase";

const props = {
  data: {
    // this can also be tree sctructured data
    oak: { title: "Oak Item", pid: "root" }, //
    apple: { title: "Apple title", pid: "oak" },
    banana: { title: "Banan title", pid: "oak" },
    cucumber: { title: "Cucumber title", pid: "banana" },
  },
  // OPTIONS (optional)
  options: {
    pid: "pid", // key for parent id
    children: "children", // key for children
    isDir: null, // function to check if item is a directory
    defaultRoot: "root", // default root id
  },
};

const treebase = new TreeBase(props);

treebase.add({ title: "Watermelon title", pid: "apple" }); // If id is not provided, it will be generated

// tree sctructured data
let treeData = treebase.getTree();
// key value dictionary
let treeDictionary = treebase.getDictionary();

// Get tree of a specific root
let treeData = treebase.getTree("aa");

console.log(treeDictionary, treeData);
```

# Result

```javascript
// treeDictionary
{
    oak: { title: "Oak title", pid: "root" },
    apple: { title: "Apple title", pid: "oak" },
    banana: { title: "Banan title", pid: "oak" },
    cucumber: { title: "Cucumber title", pid: "banana" },
    watermelon: { title: "Watermelon title", pid: "apple" },
}

// treeData
[
  {
    id: "oak",
    title: "Oak title",
    pid: "root",
    children: [
      {
        id: "apple",
        title: "Apple title",
        pid: "oak",
        children: [
          {
            id: "watermelon",
            title: "Watermelon title",
            pid: "apple",
            children: [],
          },
        ],
      },
      {
        id: "banana",
        title: "Banana title",
        pid: "oak",
        children: [
          {
            id: "cucumber",
            title: "Cucumber title",
            pid: "banana",
            children: [],
          },
        ],
      },
    ],
  },
];
```

## Methods

### `getTree(rootId, keepIndex)`

Constructs a hierarchical tree structure starting from the specified root.

- **Parameters**:
  - `rootId`: The identifier for the root of the tree (defaults to `this.options.defaultRoot`).
  - `keepIndex`: Whether to preserve the order of items based on their index (defaults to `true`).
- **Returns**: A tree structure where each item has a list of its children.

---

### `add(item)`

Adds a new item to the tree structure.

- **Parameters**:
  - `item`: The item to be added.
- **Returns**: The newly added item or the existing item if a duplicate is found.

---

### `delete(id, options?)`

Removes an item from the tree structure.

- **Parameters**:
  - `id`: The ID of the target item to delete.
  - `options`: {moveToRoot?, moveTo?} - If `moveToRoot` is set to `true`, the item will be moved to the root of the tree. If `moveTo` is set to the ID of another item, the item will be moved to the specified item's children.
- **Returns**: Updated dictionary.

---

### `update(id, payload)`

Updates properties of a specified item in the tree structure.

- **Parameters**:
  - `id`: The unique identifier of the item to be updated.
  - `payload`: An object containing the properties to be updated.
- **Returns**: The updated item with the new properties.

---

### `move(id, options)`

Moves a child to a different parent or position within the tree structure.

- **Parameters**:

  - `id`: The unique identifier of the child to be moved.
  - `options`: {pid?, index?} - If `pid` is set to the ID of another item, the child will be moved to the specified item's children. If `index` is set to a number, the child will be moved to the specified position within the parent's children.

- **Returns**: The updated dictionary after the move operation.

---

### `search(path, value)`

Search for an item in the tree structure.

- **Parameters**:
  - `path`: The path to the property to search for.
  - `value`: The value to search for.
- **Returns**: A list of items that match the search criteria.

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

### `reindexDirectChildren(pid)`

Re-indexes the direct children of a specified parent item.

- **Parameters**:
  - `pid`: The unique identifier of the parent item.
- **Returns**: The updated dictionary after reindexing the children.

---

### `updateDictionaryFromList(list)`

Update dictionary object from an array of items.

- **Parameters**:
  - `list`: list items.
- **Returns**: None.

```

```
