# Context Engineering for Agents

### **Context Engineering**

- Agents need context (e.g., instructions, external knowledge, tool feedback) to perform tasks

> ***Context engineering is the art and science of filling the context window with just the right information at each step of an agent’s trajectory***
> 
- Common strategies
    - *Writing context - saving it outside the context window to help an agent perform a task.*
    - *Selecting context - pulling it into the context window to help an agent perform a task.*
    - *Compressing context - retaining only the tokens required to perform a task.*
    - *Isolating context - splitting it up to help an agent perform a task.*
- LangGraph is designed to support them

![image.png](attachment:859bf152-e22d-486c-a60a-5a6ff1586a70:image.png)

### **Context Engineering Defined**

https://x.com/tobi/status/1935533422589399127

https://x.com/karpathy/status/1937902205765607626

https://blog.langchain.com/the-rise-of-context-engineering/

### Definition

```markdown
*[Context engineering is the] ”…delicate art and science of filling the context window with just the right information for the next step.”*
```

### Analogy

- [Karpathy](https://www.youtube.com/watch?v=LCEmiRjPEtQ): LLMs are a new kind of OS
    - LLM is CPU
    - Context window is RAM or “working memory” and has [limited capacity](https://lilianweng.github.io/posts/2023-06-23-agent/) to handle context
    - Curation of what fits into RAM is analogous to “context engineering” as mentioned above

![image.png](attachment:945d2a25-3d02-4728-9885-1c8c41786127:image.png)

### Types of context

[Umbrella discipline](https://x.com/dexhorthy/status/1933283008863482067) that captures a few different types of context:

- **Instructions** – prompts, memories, few‑shot examples, tool descriptions, etc
- **Knowledge** – facts, memories, etc
- **Tools** – feedback from tool calls

![image.png](attachment:3bd9e308-76f3-4aeb-885d-204190221d16:image.png)

### Why this is harder for agents

- Long-running tasks and accumulating feedback from tool calls
- Agents often utilize a large number of tokens!

![image.png](attachment:955db69c-aeac-4c45-a300-f22c334072b0:image.png)

![image.png](attachment:99e1fd16-02b6-4883-9984-52d671a92741:image.png)

- Drew Breunig [nicely outlined](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html) longer context failures:
    - [Context Poisoning: When a hallucination makes it into the context](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html#context-poisoning)
    - [Context Distraction: When the context overwhelms the training](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html#context-distraction)
    - [Context Confusion: When superfluous context influences the response](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html#context-confusion)
    - [Context Clash: When parts of the context disagree](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html#context-clash)
- Context engineering is critical when building agents!

https://cognition.ai/blog/dont-build-multi-agents

> *Context Engineering is effectively the #1 job of engineers building AI agents.*
> 

### Approaches

- *Writing context means saving it outside the context window to help an agent perform a task.*
- *Selecting context means pulling it into the context window to help an agent perform a task.*
- *Compressing context involves retaining only the tokens required to perform a task.*
- *Isolating context involves splitting it up to help an agent perform a task.*

![image.png](attachment:e83415de-f6a5-48a6-818f-8815a60ccc06:image.png)

### Write

- *Writing context means saving it outside the context window to help an agent perform a task.*
- When humans solve tasks, we take notes and remember things for future, related tasks
- Notes → Scratchpad
- Remember → Memory

**Scratchpads**

- Persist information while an agent is performing a task
- [Anthropic’s multi-agent researcher](https://www.anthropic.com/engineering/built-multi-agent-research-system)

> *The LeadResearcher begins by thinking through the approach and saving its plan to Memory to persist the context, since if the context window exceeds 200,000 tokens it will be truncated and it is important to retain the plan.*
> 
- Use a runtime [state object](https://langchain-ai.github.io/langgraph/concepts/low_level/#state) or file

**Memories**

- [Generative Agents](https://ar5iv.labs.arxiv.org/html/2304.03442) synthesized memory from collections of past agent feedback
- [ChatGPT](https://help.openai.com/en/articles/8590148-memory-faq), [Cursor](https://forum.cursor.com/t/0-51-memories-feature/98509), and [Windsurf](https://docs.windsurf.com/windsurf/cascade/memories) all auto-generate memories

![image.png](attachment:d4daf107-c72c-4fb8-b2a4-9fdcf22a7acd:image.png)

### Select

- *Selecting context means pulling it into the context window to help an agent perform a task.*

**Scratchpads**

- Tool call
- Read from state

**Memories**

- Few-shot examples ([episodic](https://langchain-ai.github.io/langgraph/concepts/memory/#memory-types) [memories](https://arxiv.org/pdf/2309.02427)) for examples of desired behavior
- Instructions ([procedural](https://langchain-ai.github.io/langgraph/concepts/memory/#memory-types) [memories](https://arxiv.org/pdf/2309.02427)) to steer behavior
- Facts ([semantic](https://langchain-ai.github.io/langgraph/concepts/memory/#memory-types) [memories](https://arxiv.org/pdf/2309.02427))

![image.png](attachment:f5ce56ea-6715-40e4-ae6d-bb2aaf224d79:image.png)

- Instructions → Rules files / CLAUDE.md
- Facts → Collections

**Tools**

- RAG on tool descriptions: [recent papers](https://arxiv.org/abs/2505.03275) have shown this can improve selection 3x

**Knowledge**

- RAG is a big topic
- Code agent some of the large-scale RAG apps

https://x.com/_mohansolo/status/1899630246862966837

### Compress

- *Compressing context involves retaining only the tokens required to perform a task.*

**Summarization**

- Claude Code “auto compact” https://docs.anthropic.com/en/docs/claude-code/costs
- Completed work sections https://www.anthropic.com/engineering/built-multi-agent-research-system
- Passing context to linear sub-agents https://cognition.ai/blog/dont-build-multi-agents

![image.png](attachment:95e11173-044b-4fb6-baea-5e97c3ebe10e:image.png)

**Trimming**

- Heuristics: Recent messages
- Learned: https://arxiv.org/abs/2501.16214

### Isolate

- *Isolating context involves splitting it up to help an agent perform a task.*

**Multi-agent**

- https://github.com/openai/swarm “[separation of concerns](https://openai.github.io/openai-agents-python/ref/agent/)” where each agent has their own context
- https://www.anthropic.com/engineering/built-multi-agent-research-system

> *[Subagents operate] in parallel with their own context windows, exploring different aspects of the question simultaneously.*
> 

![image.png](attachment:94c28563-6b9b-4b65-8520-c133959a8250:image.png)

**Environment**

- https://huggingface.co/blog/open-deep-research#:~:text=From%20building%20,it%20can%20still%20use%20it

![image.png](attachment:6ff169d3-2bb4-404d-9173-724c1f21b4da:image.png)

**State** 

- https://docs.pydantic.dev/latest/concepts/models/

## Context Engineering + LangGraph

**Tracing + Eval**

- https://docs.smith.langchain.com/

### Write

**Scratchpad**

- [Checkpointing](https://langchain-ai.github.io/langgraph/concepts/persistence/) to persist [agent state](https://langchain-ai.github.io/langgraph/concepts/low_level/#state) across a session

**Memory**

- [Long-term memory](https://langchain-ai.github.io/langgraph/concepts/memory/#long-term-memory) to persist context *across many sessions*

### Select

**Scratchpad**

- Retrieve from state in any node

**Memory**

- Retrieve from [long-term memory](https://langchain-ai.github.io/langgraph/concepts/memory/#long-term-memory) in any node
- https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/
- https://academy.langchain.com/courses/ambient-agents

![image.png](attachment:9aeadd9b-238b-4595-8a80-239ce73c574d:image.png)

**Tools**

- https://github.com/langchain-ai/langgraph-bigtool

**Knowledge**

- https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_agentic_rag/

### Compress

**Summarization + Trimming**

- Summarizing, trimming message history: https://langchain-ai.github.io/langgraph/how-tos/memory/add-memory/#manage-short-term-memory
- [Low-level framework](https://blog.langchain.com/how-to-think-about-agent-frameworks/), gives flexibility to define logic within nodes
    - Post-processing tool execution: https://github.com/langchain-ai/open_deep_research/blob/e5a5160a398a3699857d00d8569cb7fd0ac48a4f/src/open_deep_research/utils.py#L1407

### **Isolate**

**Multi-Agent**

- ‣
- https://github.com/langchain-ai/langgraph-swarm-py
- https://www.youtube.com/watch?v=4nZl32FwU-o
- https://www.youtube.com/watch?v=JeyDrn1dSUQ
- https://www.youtube.com/watch?v=B_0TNuYi56w

**Environment**

- LangGraph + E2B https://github.com/jacoblee93/mini-chat-langchain?tab=readme-ov-file
- Pyodide https://www.youtube.com/watch?v=FBnER2sxt0w

**State**

- State object: https://langchain-ai.github.io/langgraph/concepts/low_level/#state Define graph schema

### Summary

- *Writing context means saving it outside the context window to help an agent perform a task.*
- *Selecting context means pulling it into the context window to help an agent perform a task.*
- *Compressing context involves retaining only the tokens required to perform a task.*
- *Isolating context involves splitting it up to help an agent perform a task.*

![image.png](attachment:0974aa33-9a2d-4d0c-a223-4961bc8898c3:image.png)