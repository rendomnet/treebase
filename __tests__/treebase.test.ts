import TreeBase from "../dist/index.js";
// import { describe, expect, beforeEach, it } from "jest";

describe("TreeBase", () => {
  let treeBase: TreeBase;

  beforeEach(() => {
    // Setup for each test
    treeBase = new TreeBase({
      dictionary: {
        1: { id: "1", title: "Root Item", pid: "root" },
        2: { id: "2", title: "item 2", pid: "1" },
        3: { id: "3", title: "Inner Item 3", pid: "2" },
      },
      tree: [],
    });
  });

  describe("getDictionary", () => {
    it("should return a dictionary", () => {
      const dictionary = treeBase.getDictionary();
      expect(dictionary).toEqual(expect.any(Object));
    });
  });

  describe("getTree", () => {
    it("should return a tree structure", () => {
      const tree = treeBase.getTree();
      expect(tree).toEqual(expect.any(Array));
    });
  });

  describe("add", () => {
    it("should add an item to the tree", () => {
      const item = { id: "1", name: "Node 1", pid: "root" };
      const addedItem = treeBase.add(item);
      expect(addedItem).toEqual(expect.objectContaining(item));
    });
  });

  describe("remove", () => {
    it("should remove an item from the tree", () => {
      const itemId = "1";
      treeBase.add({ id: itemId, name: "Node 1", pid: "root" });
      const dictionaryBeforeRemoval = treeBase.getDictionary();

      expect(dictionaryBeforeRemoval).toHaveProperty(itemId);
      treeBase.remove(itemId);

      const dictionaryAfterRemoval = treeBase.getDictionary();
      expect(dictionaryAfterRemoval).not.toHaveProperty(itemId);
    });
  });

  describe("update", () => {
    it("should update an item in the tree", () => {
      const itemId = "1";
      treeBase.add({ id: itemId, name: "Node 1", pid: "root" });
      const updatedItem = treeBase.update(itemId, { name: "Updated Node 1" });

      expect(updatedItem.name).toBe("Updated Node 1");
    });
  });

  // ... Add more tests for other methods
});
