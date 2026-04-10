# TreeBase for AI Agents

`TreeBase` is an ideal structure for managing the hierarchical data often encountered in AI agent workflows, such as conversation branching, thought tracing, and complex tool output organization.

## Use Cases

### 1. Conversation Branching
When building agents that support "What-if" scenarios or multi-path dialogues, you can use TreeBase to manage the conversation history.

```javascript
// Branching a conversation
const chatStore = new TreeBase({ data: initialChat });

// User asks a different question from a previous turn
chatStore.add({ 
  id: 'branch-1', 
  pid: 'turn-3', 
  role: 'user', 
  content: 'What if we try Option B instead?' 
});

// The agent can now navigate different "timelines" of the conversation
const timeline = chatStore.getParents('branch-1');
```

### 2. Reasoning Trees (Tree of Thoughts)
For complex tasks, agents often need to explore multiple reasoning paths simultaneously. 

*   **Nodes**: Represent a reasoning step or a hypothesis.
*   **Children**: Represent refinements or alternative paths based on the parent step.
*   **Ordering**: Use the `index` property to rank paths by confidence.

### 3. Tool Result Hierarchies
When an agent calls a tool that triggers sub-agents or sub-tasks, TreeBase organizes these results semantically.

```javascript
// Organising a multi-step research task
tb.add({ id: 'research-task', title: 'Find 2024 GDP' });
tb.add({ id: 'step-1', pid: 'research-task', title: 'Search IMF API' });
tb.add({ id: 'step-2', pid: 'research-task', title: 'Cross-reference with World Bank' });
```

---

## Best Practices for Agents

### Context Window Optimization
Instead of sending a flat history to an LLM, use `getParents(childId)` to reconstruct only the relevant path (the "current timeline") for the agent. This saves tokens and reduces noise from discarded branches.

### Traceability
Use custom properties in your nodes to store metadata like `token_count`, `latency`, or `model_version`. Use the `search()` method to find specific reasoning steps across a massive trace.

### Handling Reactive Agents
When an agent is streaming updates to a node's content in a reactive environment (Vue/Pinia, React/Valtio, MobX):
1.  Update the `dictionary` directly for performance during the stream.
2.  Call `refresh()` once the stream completes or at throttled intervals to update the UI tree.

```javascript
// Throttled update pattern for agents
function onStreamChunk(chunk) {
  state.dictionary[currentNodeId].content += chunk;
  // Throttled refresh to keep UI smooth but updated
  throttledRefresh(); 
}
```

## Mandatory Reactivity Rules for Agents

When an AI Agent is modifying the tree, it **MUST** follow these rules to maintain internal state integrity:

1.  **API Preference**: Always prefer using `tb.add()`, `tb.update()`, `tb.move()`, or `tb.delete()`. These methods manage internal maps and cache automatically.
2.  **External Mutations**: If you mutate the `dictionary` directly (e.g., `dictionary[id].prop = val`), you **MUST** call `tb.refresh()` immediately after.
3.  **Bulk Updates**: When replacing the entire tree, use `tb.setData(newData)` instead of manual assignment to `tb.dictionary`.
4.  **UI Sync**: In reactive environments (Vue/Pinia, React/Valtio), remember that `TreeBase` internal Maps (`childrenMap`, `treeCache`) are only rebuilt during a `refresh()`. If you omit this, the UI tree will become stale even if the dictionary appears updated.

---

## Agent API Summary

| Method | Agentic Use Case |
| :--- | :--- |
| `getTree(root)` | Visualizing the full reasoning/dialogue tree. |
| `getParents(id)` | Extracting the current "Context Path" for LLM prompts. |
| `move(id, {pid})` | Refactoring thought structures or re-categorizing information. |
| `search(path, val)` | Finding past memories or tool outputs by semantic keys. |
| `refresh()` | Syncing state after high-frequency streaming updates. |
