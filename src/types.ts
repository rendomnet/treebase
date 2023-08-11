type ItemId = string;

interface Dictionary {
  [key: ItemId]: Item;
}

interface Item {
  id: ItemId;
  pid: ItemId;
  index?: number;
  [key: string]: any;
}

interface TreeItem extends Item {
  children?: Item[];
}

type ItemList = Item[];
type ItemTree = TreeItem[];

interface Options {
  pid: ItemId;
  children: string; // Children key
  defaultRoot: string; // Default root id
  isDir: (item: Item) => boolean;
}

interface TreeBaseProps {
  dictionary?: Dictionary;
  tree?: ItemTree;
  options?: Options;
}

type initDictionary = {
  tree: ItemTree;
  dictionary: Dictionary;
};

export {
  Dictionary,
  ItemId,
  Item,
  TreeItem,
  ItemList,
  ItemTree,
  Options,
  TreeBaseProps,
  initDictionary,
};
