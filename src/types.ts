interface CollectionType {
  [P: itemId]: ItemType;
}

type itemId = string;

type ItemType = {
  id: itemId;
  pid: itemId;
  index?: number;
  data?: object;
};

type TreeItemType = {
  id: itemId;
  pid: itemId;
  index?: number;
  children?: ItemType[];
  data?: object;
};

type ItemListType = ItemType[];
type ItemTreeType = TreeItemType[];

type optionsType = {
  pid: string;
  children: string;
  defaultRoot: string;
  isDir: Function;
};

type initCollectionType = {
  tree: [];
  collection: object;
};

export {
  CollectionType,
  itemId,
  ItemType,
  TreeItemType,
  ItemListType,
  ItemTreeType,
  optionsType,
  initCollectionType,
};
