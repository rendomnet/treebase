import { optionsType, DictionaryType, ItemTreeType, initDictionaryType } from "./types";
export declare const insert: <T>(arr: T[], index: number, newItem: T) => T[];
export declare function sort(array: any, property: string): any;
export declare function generateId(dictionary: DictionaryType, length?: number): string;
/**
 * Create dictionary object from tree structured item array
 * @param tree - tree structured item array
 * @param result - initial dictionary object (default is empty)
 * @returns treebase dictionary
 */
export declare function dictionaryFromTree(tree: ItemTreeType, result: {}, options: optionsType): DictionaryType;
export declare function initDictionary(props: initDictionaryType, options: optionsType): DictionaryType;
