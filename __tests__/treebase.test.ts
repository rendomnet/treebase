import TreeBase from "../dist/index.js";
import * as helpers from "../dist/helpers.js";
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
        d: { title: "Inner Item d", pid: "2", index: 3 },
        e: { title: "Inner Item e", pid: "2", index: 4 },
      },
    });
  });

  describe("get data", () => {
    it("should return a dictionary", () => {
      const dictionary = treeBase.getDictionary();
      expect(dictionary).toEqual(expect.any(Object));
    });

    it("should return a dictionary with a default item", () => {
      const dictionary = treeBase.getDictionary();
      expect(dictionary).toHaveProperty("1", {
        title: "Root Item",
        pid: "root",
        id: "1",
      });
    });

    it("should return a global tree", () => {
      const tree = treeBase.getTree();
      expect(tree).toHaveLength(1);
      // epxect tree to have children no empty
      expect(tree[0].children).not.toHaveLength(0);
    });
    it("should return a tree of pid", () => {
      const tree2 = treeBase.getTree("2");
      expect(tree2).toHaveLength(5);
    });
  });

  describe("crud", () => {
    it("should add an item to the tree", () => {
      const item = { name: "Node 1", pid: "root" };
      const addedItem = treeBase.add(item);
      const dictionary = treeBase.getDictionary();
      // expect dictinary have addedItem
      expect(dictionary).toHaveProperty(addedItem.id);
      // expect addedItem to be equal to item
      expect(dictionary[addedItem.id]).toEqual(
        expect.objectContaining({ ...item, id: addedItem.id })
      );
    });

    it("should update an item", () => {
      const itemId = "b";
      treeBase.update(itemId, { title: "renamed" });
      const dictionary = treeBase.getDictionary();
      // check if title is renamed
      expect(dictionary[itemId].title).toBe("renamed");
    });

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

  // HELPERS
  describe("helpers", () => {
    it("should insert", () => {
      const list = [
        { id: "1", index: 0, pid: "root" },
        { id: "2", pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "4", pid: "root" },
        { id: "5", index: 4, pid: "root" },
      ];

      const inserted = helpers.insert(list, 2, { id: "6", pid: "root" });
      expect(inserted).toEqual([
        { id: "1", index: 0, pid: "root" },
        { id: "2", pid: "root" },
        { id: "6", pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "4", pid: "root" },
        { id: "5", index: 4, pid: "root" },
      ]);
    });
    it("should sort", () => {
      const list = [
        { id: "1", index: 0, pid: "root" },
        { id: "2", pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "4", pid: "root" },
        { id: "5", index: 4, pid: "root" },
      ];

      const sorted = helpers.sort(list);

      expect(sorted).toEqual([
        { id: "1", index: 0, pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "5", index: 4, pid: "root" },
        { id: "2", pid: "root" },
        { id: "4", pid: "root" },
      ]);
    });
    it("should reindex", () => {
      const list = [
        { id: "1", index: 0, pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "5", index: 4, pid: "root" },
        { id: "2", pid: "root" },
        { id: "4", pid: "root" },
      ];

      const reindexed = helpers.reindex(list);

      expect(reindexed).toEqual([
        { id: "1", index: 0, pid: "root" },
        { id: "3", index: 1, pid: "root" },
        { id: "5", index: 2, pid: "root" },
        { id: "2", pid: "root", index: 3 },
        { id: "4", pid: "root", index: 4 },
      ]);
    });

    it("should sortReindex", () => {
      const list = [
        { id: "1", index: 0, pid: "root" },
        { id: "2", pid: "root" },
        { id: "3", index: 2, pid: "root" },
        { id: "4", pid: "root" },
        { id: "5", index: 4, pid: "root" },
      ];

      const reindexed = helpers.sortReindex(list);

      expect(reindexed).toEqual([
        { id: "1", index: 0, pid: "root" },
        { id: "3", index: 1, pid: "root" },
        { id: "5", index: 2, pid: "root" },
        { id: "2", pid: "root", index: 3 },
        { id: "4", pid: "root", index: 4 },
      ]);
    });
  });

  // reorder
  describe("move", () => {
    it("should reorder item", () => {
      const reorderedItem = treeBase.move("a", 3);
      expect(reorderedItem.index).toBe(3);
      expect(treeBase.dictionary.b.index).toBe(1);
      expect(treeBase.dictionary.e.index).toBe(4);
      expect(treeBase.dictionary.c.index).toBe(5);
    });

    it("should move and reorder", () => {
      treeBase.add({ id: "f", pid: "1" });
      treeBase.add({ id: "g", pid: "1" });
      treeBase.add({ id: "h", pid: "1" });
      treeBase.add({ id: "i", pid: "1" });
      const lengthOriginal = treeBase.getTree("1").length;
      const lengthTo = treeBase.getTree("2").length;
      treeBase.move("f", 2, "2");
      expect(treeBase.dictionary.d.index).toBe(4);
      // To have length minus 1
      expect(treeBase.getTree("1").length).toBe(lengthOriginal - 1);
      expect(treeBase.getTree("2").length).toBe(lengthTo + 1);
    });
  });
});
