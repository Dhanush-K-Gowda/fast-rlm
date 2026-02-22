# fast-rlm

A minimal implementation of Recursive Language Models (RLMs) using Deno and Pyodide.

> **📺 Watch the full video for free**
> **[RLM Tutorial](https://youtu.be/nxaVvvrezbY)**

## What are RLMs

RLMs are an inference technique where an LLM interacts with arbitrarily long prompts through an external REPL. The LLM can write code to explore, decompose, and transform the prompt. It can recursively invoke sub-agents to complete smaller subtasks. Crucially, sub-agent responses are not automatically loaded into the parent agent's context — they are returned as symbols or variables inside the parent's REPL.

## Support

If you find this helpful, consider supporting on Patreon — it hosts all code, projects, slides, and write-ups from the YouTube channel.

[<img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patron!" width="200">](https://www.patreon.com/NeuralBreakdownwithAVB)

---

## Installation

### 1. Install Deno

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Then follow the instructions to add Deno to your `PATH`, or add it manually:

```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

Verify:

```bash
deno --version
```

### 2. Install uv (Python package manager)

To use from python scripts, or try benchmarking with huggingface datasets

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 3. Install Bun (for the log viewer)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 4. Install log viewer dependencies

```bash
cd tui_log_viewer && bun install
```

---

## Configuration

All hyperparameters are set in `rlm_config.yaml` at the project root:

```yaml
max_calls_per_subagent: 20   # max LLM calls a single subagent can make
max_depth: 3                 # max recursive subagent depth
truncate_len: 5000           # output characters shown to the LLM per step
primary_agent: "z-ai/glm-5" # model used for the root agent
sub_agent: "minimax/minimax-m2.5"  # model used for child subagents
max_money_spent: 1.0         # hard budget cap in USD — crashes if exceeded
```

Edit this file to change any setting before running. If the file is missing, built-in defaults are used.

---

## Running Examples

A working example is in `test_counting_r.ts`. Run it with:

```bash
deno task test_counting_r
```

To write your own script, copy `test_counting_r.ts` and edit the `PROMPT` and `PREFIX` constants at the top. Then run it directly:

```bash
FORCE_COLOR=1 deno run --allow-read --allow-env --allow-net --allow-sys=hostname --allow-write your_script.ts
```

Or add it as a task in `deno.json` the same way `test_counting_r` is defined.

---

## Running Benchmarks

First install Python dependencies (only needed for benchmarks):

```bash
uv sync
```

All benchmarks are under `benchmarks/` and use `uv run`:

```bash
uv run benchmarks/oolong_synth_benchmark.py
uv run benchmarks/longbench_benchmark.py
```

---

## Log Viewer

![TUI Log Viewer](images/tui.jpeg)

Every run saves a `.jsonl` log file to `logs/`. Use the `viewlog` script to open it in the interactive TUI viewer:

```bash
./viewlog logs/<logfile>.jsonl
```

You can also pass just the filename if the log is in the `logs/` directory:

```bash
./viewlog my_run_abc123.jsonl
```

Run `./viewlog` with no arguments to list recent logs.

### Installing the log viewer (OpenTUI app)

The viewer is a Bun + OpenTUI app in `tui_log_viewer/`. Install its dependencies once:

```bash
cd tui_log_viewer && bun install
```

After that `./viewlog` handles launching it automatically.
