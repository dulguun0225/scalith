# Options

Approaches that have been worked out and are available to adopt. None is adopted; adopting one is the owner's decision.

## Tuning the pipeline's step prompts with DSPy or GEPA

**What it is.** Improve the instructions each pipeline step gives its agent: run the step on test features, score each result, and let an optimizer rewrite the instructions. The optimizer is GEPA, available inside DSPy (`dspy.GEPA`) and as a standalone library (`gepa.optimize_anything`). Tuning runs offline, outside the Workflow. The tuned instructions are copied into the prompts that `skills/build-feature/workflow.mjs` runs.

**What it can tune.** Prompt text only: instructions (GEPA) and worked examples (MIPROv2). It cannot tune model weights. Anthropic offers weight fine-tuning only for Haiku, on Amazon Bedrock, and not for Opus or Sonnet (checked 2026-09-30 against third-party sources). The pipeline runs no Haiku, so DSPy's `BootstrapFinetune` does not apply.

**Why it fits.** spec-kit is replaceable. Once plan, tasks, implement and converge are scalith's own prompts rather than spec-kit commands, they are the most valuable steps to tune: implement is the most expensive stage and converge the second.

**What DSPy cannot do here.** Run the pipeline. A DSPy module calls a model API directly. Each step needs a Claude Code subagent with tools, files and git, started by the Workflow script, whose sandbox has no Node APIs.

**How DSPy would be connected.**

1. Write each step as a DSPy signature: its named inputs and outputs.
2. Back it with a custom `dspy.BaseLM` that runs the step through headless Claude Code (`claude -p`) in a checkout of a test feature.
3. Score the result and optimize with `dspy.GEPA`.
4. Copy the tuned instructions into the step's prompt in the workflow script.

Standalone GEPA does the same with one evaluator function in place of steps 1 and 2. It needs no Python toolchain and no signature layer.

**Prerequisites.**

1. Each step is defined by its inputs, outputs and prompt, and spec-kit is one way to run them. Today the workflow depends on spec-kit directly:
   - `STAGE_READS` in `skills/build-feature/workflow.mjs` lists the files each stage's spec-kit script requires;
   - `SEVERITY_ORDER` is `/speckit-converge`'s scale;
   - feature lookup goes through `SPECIFY_FEATURE_DIRECTORY` and `.specify/feature.json`.

   Each `agent()` call already declares its output `schema`, and this work extends that.
2. A set of small test features and a score for each build:
   - the wall (the definition-of-done command) passes;
   - every task is ticked;
   - the number of converge rounds;
   - tokens used.

   The same set shows whether a spec-kit replacement is no worse than spec-kit.
3. Run journals and human decisions saved outside `~/.claude`, where the journals are machine-local and erased with that directory. The human decisions are:
   - `yes — <who>` in `QUESTIONS.md`;
   - `RESOLUTIONS.md`;
   - the commits between a stop and its restart.

**Order.** First tune the cheap steps, where text goes in and a short answer comes out: question severity grading, the plan review, tasks. Then plan. Implement last.

**Deferred choice.** Choose between DSPy and standalone GEPA at the tuning step; both use the same optimizer.

**Open risk.** It is not known whether tuning implement needs few enough runs to be affordable in tokens.

**Sources.**

- GEPA: https://github.com/gepa-ai/gepa
- DSPy: https://dspy.ai
- Claude fine-tuning availability: https://claudeimplementation.com/blog/claude-fine-tuning-custom-models, https://callsphere.ai/blog/vw8g-anthropic-claude-fine-tuning-patterns-bedrock-2026
