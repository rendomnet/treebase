import {
  itemId,
  optionsType,
  CollectionType,
  ItemTreeType,
  initCollectionType,
} from "./types";

export function makeId(length: number): itemId {
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

export const insert = <T>(arr: T[], index: number, newItem: T): T[] => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export function sort(array, property: string) {
  return array.sort((a: object, b: object) =>
    a[property] > b[property] ? 1 : -1
  );
}

export function generateId(value = 5): string {
  const newId = makeId(value);
  if (this.collection[newId]) return this.generateId();
  return newId;
  // return Math.max(...(Object.keys(this.props.collection) + 1));
}

/**
 * Create collection object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial collection object (default is empty)
 * @returns treebase collection
 */
export function collectionFromTree(
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

export function initCollection(
  props: initCollectionType,
  options: optionsType
) {
  if (props.tree) {
    return collectionFromTree(props.tree, {}, options);
  } else return { ...(props.collection || {}) };
}
