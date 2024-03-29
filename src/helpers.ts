import {
  Item,
  Options,
  Dictionary,
  ItemTree,
  ItemList,
  initData,
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

export const insert = <T>(arr: T[], index: number, newItem: T): T[] => {
  // Adjust the index to fall within valid boundaries
  index = Math.max(0, Math.min(index, arr.length));

  // Create a copy of the array to keep things immutable
  const newArr = arr.slice();
  newArr.splice(index, 0, newItem);

  return newArr;
};

export function sort(list: ItemList): ItemList {
  // Sort the list
  return list.sort((a, b) => {
    if (a.index === undefined) return 1;
    if (b.index === undefined) return -1;
    return a.index - b.index;
  });
}

export function sortReindex(list: ItemList): ItemList {
  // Sort the list
  return reindex(sort(list));
}

export function reindex(list: ItemList): ItemList {
  return list.map((item, idx) => ({ ...item, index: idx }));
}

export function generateId(dictionary: Dictionary, length: number = 5): string {
  const newId = makeId(length);
  if (dictionary[newId]) return generateId(dictionary);
  return newId;
}

export function getNestedValue(obj: Item, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
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

export function initData(data: initData, options: Options) {
  const result = {};
  if (data === undefined) return result;
  // if data is array
  if (Array.isArray(data)) {
    return dictionaryFromTree(data, {}, options);
  } else {
    for (const id in data) {
      result[id] = {
        ...data[id],
        id: id !== undefined && id !== null ? String(id) : generateId(result),
        pid: data[id].pid === undefined ? options.defaultRoot : data[id].pid,
      };
    }
  }
  return result;
}
