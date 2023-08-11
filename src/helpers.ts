import {
  Item,
  ItemId,
  Options,
  Dictionary,
  ItemTree,
  ItemList,
  TreeItem,
  initDictionary,
} from "./types";

function makeId(length: number): ItemId {
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

export function sort(list: ItemList, property: string) {
  return list.sort((a: object, b: object) =>
    a[property] > b[property] ? 1 : -1
  );
}

export function generateId(dictionary: Dictionary, length: number = 5): string {
  const newId = makeId(length);
  if (dictionary[newId]) return generateId(dictionary);
  return newId;
}

/**
 * Create dictionary object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial dictionary object (default is empty)
 * @returns treebase dictionary
 */
export function dictionaryFromTree(
  tree: ItemTree,
  result: Dictionary = {},
  options: Options
): Dictionary {
  for (const originalItem of tree) {
    let newItem = { ...originalItem };

    let children = newItem[options.children];
    let pid = newItem[options.pid];

    delete newItem[options.children];
    delete newItem[options.pid];

    newItem.pid = pid;

    const item: Item = newItem;

    if (newItem.id) {
      result[item.id] = { ...(result[newItem.id] || {}), ...newItem };
    }
    if (children) dictionaryFromTree(children, result, options);
  }
  return result;
}

export function initDictionary(props: initDictionary, options: Options) {
  if (props.tree) {
    return dictionaryFromTree(props.tree, {}, options);
  }

  const result = {};
  for (const id in props.dictionary) {
    result[id] = {
      ...props.dictionary[id],
      pid:
        props.dictionary[id].pid === undefined
          ? options.defaultRoot
          : props.dictionary[id].pid,
    };
  }

  return result;
}
