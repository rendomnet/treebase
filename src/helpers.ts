import {
  itemId,
  optionsType,
  DictionaryType,
  ItemTreeType,
  initDictionaryType,
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
  if (this.dictionary[newId]) return this.generateId();
  return newId;
  // return Math.max(...(Object.keys(this.props.dictionary) + 1));
}

/**
 * Create dictionary object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial dictionary object (default is empty)
 * @returns treebase dictionary
 */
export function dictionaryFromTree(
  tree: ItemTreeType,
  result = {},
  options: optionsType
): DictionaryType {
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
    if (children) dictionaryFromTree(children, result, options);
  }
  return result;
}

export function initDictionary(
  props: initDictionaryType,
  options: optionsType
) {
  if (props.tree) {
    return dictionaryFromTree(props.tree, {}, options);
  } else {
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
    return { ...(result || {}) };
  }
}
