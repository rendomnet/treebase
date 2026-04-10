import TreeBase from "../src/index";

describe("TreeBase Performance", () => {
  const NODE_COUNT = 5000;
  let treeBase: TreeBase;

  beforeAll(() => {
    const data: any = {};
    // Create a tree with a depth of 5 and branching factor of 5-10
    for (let i = 0; i < NODE_COUNT; i++) {
      const pid = i === 0 ? "root" : Math.floor(i / 10).toString();
      data[i.toString()] = { 
        title: `Item ${i}`, 
        pid: pid,
        index: i % 10 
      };
    }
    
    console.time("Initialization");
    treeBase = new TreeBase({ data });
    console.timeEnd("Initialization");
  });

  test("getDirectChildren performance", () => {
    const start = performance.now();
    // Test multiple random lookups
    for (let i = 0; i < 1000; i++) {
      const rid = Math.floor(Math.random() * (NODE_COUNT / 10)).toString();
      treeBase.getDirectChildren(rid);
    }
    const end = performance.now();
    const duration = end - start;
    console.log(`1,000 getDirectChildren calls on ${NODE_COUNT} items took: ${duration.toFixed(2)}ms`);
    
    // Performance expectation: should be very fast (< 50ms for 1000 calls)
    expect(duration).toBeLessThan(100); 
  });

  test("getDeepChildren performance", () => {
    const start = performance.now();
    // Fetch deep children of a high-level node (~500 descendants)
    const descendants = treeBase.getDeepChildren("0");
    const end = performance.now();
    const duration = end - start;
    
    console.log(`getDeepChildren for 500 descendants took: ${duration.toFixed(2)}ms`);
    expect(descendants.length).toBeGreaterThan(400);
    expect(duration).toBeLessThan(50);
  });

  test("getTree performance", () => {
    const start = performance.now();
    // Build a specific branch (e.g., node "0" and its subtree)
    const tree = treeBase.getTree("0");
    const end = performance.now();
    const duration = end - start;
    
    console.log(`getTree for branch with ~500 nodes took: ${duration.toFixed(2)}ms`);
    expect(tree.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
  });

  test("CRUD overhead performance", () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const added = treeBase.add({ title: `New ${i}`, pid: "0" });
      treeBase.delete(added.id);
    }
    const end = performance.now();
    const duration = end - start;
    
    console.log(`100 Add/Delete cycles took: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(200);
  });
});
