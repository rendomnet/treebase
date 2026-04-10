import TreeBase from "../src/index";
import TreeBaseLegacy from "../src/index_legacy";

describe("TreeBase A/B Comparison", () => {
  const NODE_COUNT = 5000;
  let optimized: TreeBase;
  let legacy: TreeBaseLegacy;
  let data: any = {};

  beforeAll(() => {
    // Generate data for 5,000 nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const pid = i === 0 ? "root" : Math.floor(i / 10).toString();
      data[i.toString()] = { 
        title: `Item ${i}`, 
        pid: pid,
        index: i % 10 
      };
    }
  });

  function benchmark(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  }

  test("Side-by-Side Comparison", () => {
    console.log(`\n=== A/B TESTING RESULTS (${NODE_COUNT} nodes) ===`);
    
    // 1. Initialization
    const initOpt = benchmark("Optimized Init", () => { optimized = new TreeBase({ data }); });
    const initLeg = benchmark("Legacy Init", () => { legacy = new TreeBaseLegacy({ data }); });
    console.log(`Initialization:   Legacy: ${initLeg.toFixed(2)}ms | Optimized: ${initOpt.toFixed(2)}ms [${(initLeg/initOpt).toFixed(1)}x faster]`);

    // 2. Direct Children Lookups (1,000 random calls)
    const directOpt = benchmark("Optimized Direct", () => {
      for (let i = 0; i < 1000; i++) optimized.getDirectChildren(Math.floor(Math.random() * 500).toString());
    });
    const directLeg = benchmark("Legacy Direct", () => {
      for (let i = 0; i < 1000; i++) legacy.getDirectChildren(Math.floor(Math.random() * 500).toString());
    });
    console.log(`Direct Children:  Legacy: ${directLeg.toFixed(2)}ms | Optimized: ${directOpt.toFixed(2)}ms [${(directLeg/directOpt).toFixed(1)}x faster]`);

    // 3. Deep Children Retrieval
    const deepOpt = benchmark("Optimized Deep", () => optimized.getDeepChildren("0"));
    const deepLeg = benchmark("Legacy Deep", () => legacy.getDeepChildren("0"));
    console.log(`Deep Children:    Legacy: ${deepLeg.toFixed(2)}ms | Optimized: ${deepOpt.toFixed(2)}ms [${(deepLeg/deepOpt).toFixed(1)}x faster]`);

    // 4. Tree Construction (Branch "0")
    const treeOpt = benchmark("Optimized Tree", () => optimized.getTree("0"));
    const treeLeg = benchmark("Legacy Tree", () => legacy.getTree("0"));
    console.log(`Tree Build:       Legacy: ${treeLeg.toFixed(2)}ms | Optimized: ${treeOpt.toFixed(2)}ms [${(treeLeg/treeOpt).toFixed(1)}x faster]`);

    // 5. Move/Reorder Operation
    const moveOpt = benchmark("Optimized Move", () => optimized.move("4999", { index: 0, pid: "0" }));
    const moveLeg = benchmark("Legacy Move", () => legacy.move("4999", { index: 0, pid: "0" }));
    console.log(`Move Operation:   Legacy: ${moveLeg.toFixed(2)}ms | Optimized: ${moveOpt.toFixed(2)}ms [${(moveLeg/moveOpt).toFixed(1)}x faster]`);
    
    console.log("==========================================\n");
    
    expect(initOpt).toBeLessThan(initLeg * 2); // Init might be a bit slower due to indexing, but should be reasonable
    expect(directOpt).toBeLessThan(directLeg);
    expect(deepOpt).toBeLessThan(deepLeg);
  });
});
