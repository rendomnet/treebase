import {
  Item,
  Options,
  Dictionary,
  ItemTree,
  ItemList,
  initDictionary,
} from "./types";

function makeId(length: number): string {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export const insert = <T>(arr: T[], index: number, newItem: T): T[] => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export function sort(list: ItemList): ItemList {
  // Sort the list
  return list.sort((a, b) => {
    if (a.index === undefined) return 1;
    if (b.index === undefined) return -1;
    return a.index - b.index;
  });
}

export function reorder(list: ItemList): ItemList {
  // Sort the list
  return list
    .slice()
    .sort((a, b) => {
      if (a.index === undefined) return 1;
      if (b.index === undefined) return -1;
      return a.index - b.index;
    })
    .map((item, idx) => ({ ...item, index: idx }));
}

export function reindex(list: ItemList): ItemList {
  return list.map((item, idx) => ({ ...item, index: idx }));
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
    const newItem = { ...originalItem };

    const children = newItem[options.children];
    const pid = newItem[options.pid];

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
