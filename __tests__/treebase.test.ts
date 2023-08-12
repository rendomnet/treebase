import TreeBase from "../dist/index.js";
// import { describe, expect, beforeEach, it } from "jest";

describe("TreeBase", () => {
  let treeBase: TreeBase;

  beforeEach(() => {
    // Setup for each test
    treeBase = new TreeBase({
      dictionary: {
        "1": { title: "Root Item", pid: "root" },
        "2": { title: "item 2", pid: "1" },
        "3": { title: "Inner Item 3", pid: "2", index: 0 },
        a: { title: "Inner Item a", pid: "2", index: 1 },
        b: { title: "Inner Item b", pid: "2", index: 2 },
        c: { title: "Inner Item c", pid: "a" },
      },
    });
  });

  describe("getDictionary", () => {
    it("should return a dictionary", () => {
      const dictionary = treeBase.getDictionary();
      expect(dictionary).toEqual(expect.any(Object));
    });
  });

  // Check if dictionary has a default item
  describe("Default item exist", () => {
    it("should return a dictionary with a default item", () => {
      const dictionary = treeBase.getDictionary();
      // haveProperty and title is "Root Item"
      expect(dictionary).toHaveProperty("1", { title: "Root Item" });
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
      const item = { name: "Node 1", pid: "root" };
      const addedItem = treeBase.add(item);
      const dictionary = treeBase.getDictionary();
      // expect dictinary have addedItem
      expect(dictionary).toHaveProperty(addedItem.id);
      // expect addedItem to be equal to item
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

  // move
  describe("move", () => {
    it("should move an item to a new parent", () => {
      const itemId = "1";

      const addedItem = treeBase.add({
        id: itemId,
        name: "Node 1",
        pid: "root",
      });
      const movedItem = treeBase.move(addedItem.id, 0, "root");
      expect(movedItem.pid).toBe("root");
    });
  });

  // reorder
  describe("reorder", () => {
    it("should reorder an item in the tree", () => {
      // const reorderedItem = treeBase.move("3", 2);
      const dictionary = treeBase.getDictionary();
      console.log("dictionary", dictionary);
      // console.log("reorderedItem", reorderedItem);
      // expect(reorderedItem.index).toBe(2);
    });
  });
});
