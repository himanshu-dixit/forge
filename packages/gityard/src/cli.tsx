#!/usr/bin/env bun
/**
 * CLI entry point for gityard (Ink UI)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput, render } from "ink";
import {
  deleteWorktreeBranch,
  initgityard,
  mergeWorktree,
  runScript,
  switchWorktree,
} from "./index";
import { getRelativeWorktreeName, isValidWorktreePath } from "./utils/worktree";
import {
  getLastCommitInfo,
  getMainWorktreePath,
  getWorktreeDiffStats,
  getWorktreeStatus,
  parseWorktreeList,
  resolveBaseBranch,
} from "./utils/git";
import { loadConfig } from "./config";

type Command = "switch" | "run" | "init" | "merge" | "help";

type Flags = {
  cd?: boolean;
  force?: boolean;
  help?: boolean;
  squash?: boolean;
  noFF?: boolean;
};

type ParsedArgs = {
  command: Command;
  args: string[];
  flags: Flags;
  defaultCommand: boolean;
};

const COMMANDS: Command[] = ["switch", "run", "init", "merge", "help"];

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Flags = {};
  const args: string[] = [];
  let defaultCommand = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cd") {
      flags.cd = true;
      continue;
    }
    if (arg === "--force" || arg === "-f") {
      flags.force = true;
      continue;
    }
    if (arg === "--squash") {
      flags.squash = true;
      continue;
    }
    if (arg === "--no-ff") {
      flags.noFF = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    args.push(arg);
  }

  let command: Command = "switch";
  let commandArgs = args;

  if (flags.help) {
    command = "help";
  } else if (args.length === 0) {
    defaultCommand = true;
    command = "switch";
    commandArgs = [];
  } else if (COMMANDS.includes(args[0] as Command)) {
    command = args[0] as Command;
    commandArgs = args.slice(1);
  } else {
    defaultCommand = true;
    command = "switch";
    commandArgs = args;
  }

  return { command, args: commandArgs, flags, defaultCommand };
}

function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: string | null;
  }>({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });
    fn()
      .then((data) => {
        if (active) {
          setState({ loading: false, data, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ loading: false, data: null, error: error.message || String(error) });
        }
      });
    return () => {
      active = false;
    };
  }, deps);

  return state;
}

function HelpView() {
  return (
    <Box flexDirection="column">
      <Text>gityard - Git worktree helper</Text>
      <Text> </Text>
      <Text>Usage:</Text>
      <Text>  gityard [switch] [name] [branch] [--cd]</Text>
      <Text>  gityard run &lt;worktree&gt; &lt;script&gt;</Text>
      <Text>  gityard init</Text>
      <Text>  gityard merge &lt;worktree&gt; --squash|--no-ff</Text>
      <Text> </Text>
      <Text>Tips:</Text>
      <Text>  eval "$(gityard switch --cd &lt;name&gt;)"</Text>
    </Box>
  );
}

function InitView() {
  const { loading, data, error } = useAsync(async () => initgityard(), []);
  if (loading) {
    return <Text>Initializing gityard...</Text>;
  }
  return <ResultView message={data ? "Initialized gityard configuration." : undefined} error={error || undefined} />;
}

function RunView({ worktree, script }: { worktree?: string; script?: string }) {
  const { loading, data, error } = useAsync(async () => {
    if (!worktree || !script) {
      throw new Error("Usage: gityard run <worktree> <script>");
    }
    return runScript(worktree, script);
  }, [worktree, script]);
  if (loading) {
    return <Text>Running script...</Text>;
  }
  return (
    <ResultView
      message={data ? `Executed script '${script}' in '${worktree}'.` : undefined}
      error={error || undefined}
    />
  );
}

function MergeView({ name, squash, noFF }: { name?: string; squash: boolean; noFF: boolean }) {
  const { loading, data, error } = useAsync(async () => {
    if (!name) {
      throw new Error("Usage: gityard merge <worktree> --squash|--no-ff");
    }
    return mergeWorktree(name, { squash, noFF });
  }, [name, squash, noFF]);
  if (loading) {
    return <Text>Merging into master...</Text>;
  }
  return (
    <ResultView
      message={data ? `Merged ${data.mergedBranch} into ${data.baseBranch}.` : undefined}
      error={error || undefined}
    />
  );
}

function ResultView({ message, error }: { message?: string; error?: string }) {
  const { exit } = useApp();

  useEffect(() => {
    if (message) {
      setTimeout(() => exit(), 0);
    }
    if (error) {
      setTimeout(() => exit(new Error(error)), 0);
    }
  }, [message, error, exit]);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return <Text>{message || "Done."}</Text>;
}

function useSelectList<T extends { value: string }>(items: T[], active: boolean) {
  const [index, setIndex] = useState(0);

  useInput((_, key) => {
    if (!active) {
      return;
    }
    if (key.downArrow || key.rightArrow) {
      setIndex((current) => (current + 1) % items.length);
    }
    if (key.upArrow || key.leftArrow) {
      setIndex((current) => (current - 1 + items.length) % items.length);
    }
  });

  return { index, selected: items[index], setIndex };
}

function TextInput({
  label,
  placeholder,
  value,
  onSubmit,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onSubmit: (value: string) => void;
  onChange: (value: string) => void;
}) {
  useInput((input, key) => {
    if (key.return) {
      onSubmit(value.trim());
      return;
    }
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }
    if (input) {
      onChange(value + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{label}</Text>
      <Text color="gray">{value.length ? value : placeholder || ""}</Text>
    </Box>
  );
}

type WorktreeRow = {
  value: string;
  name: string;
  branch: string;
  age: string;
  status: string;
  statusCounts?: { staged: number; unstaged: number; untracked: number };
  diff: string;
  diffCounts?: { added: number; deleted: number };
  isCurrent?: boolean;
  isCreate?: boolean;
};

function formatAge(timestamp: number): string {
  if (!timestamp) {
    return "-";
  }
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 60 * 60) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 60 * 60 * 24) {
    return `${Math.floor(seconds / (60 * 60))}h`;
  }
  if (seconds < 60 * 60 * 24 * 7) {
    return `${Math.floor(seconds / (60 * 60 * 24))}d`;
  }
  if (seconds < 60 * 60 * 24 * 30) {
    return `${Math.floor(seconds / (60 * 60 * 24 * 7))}w`;
  }
  if (seconds < 60 * 60 * 24 * 365) {
    return `${Math.floor(seconds / (60 * 60 * 24 * 30))}mo`;
  }
  return `${Math.floor(seconds / (60 * 60 * 24 * 365))}y`;
}

function formatStatusText(counts: {
  staged: number;
  unstaged: number;
  untracked: number;
}): string {
  const { staged, unstaged, untracked } = counts;
  return `staged:${staged} unstaged:${unstaged} untracked:${untracked}`;
}

function padCell(value: string, width: number): string {
  if (value.length === width) {
    return value;
  }
  if (value.length < width) {
    return value.padEnd(width, " ");
  }
  if (width <= 3) {
    return value.slice(0, width);
  }
  return `${value.slice(0, width - 3)}...`;
}

function renderStatusCell(item: WorktreeRow, width: number): React.ReactNode {
  if (!item.statusCounts) {
    return <Text>{padCell(item.status || "", width)}</Text>;
  }
  const { staged, unstaged, untracked } = item.statusCounts;
  const stagedText = `staged:${staged}`;
  const unstagedText = `unstaged:${unstaged}`;
  const untrackedText = `untracked:${untracked}`;
  const full = `${stagedText} ${unstagedText} ${untrackedText}`;
  if (full.length > width) {
    return <Text>{padCell(full, width)}</Text>;
  }
  const padding = " ".repeat(Math.max(0, width - full.length));
  return (
    <>
      <Text color="blue">{stagedText}</Text>
      <Text> </Text>
      <Text color="yellow">{unstagedText}</Text>
      <Text> </Text>
      <Text color="yellow">{untrackedText}</Text>
      {padding ? <Text>{padding}</Text> : null}
    </>
  );
}

function renderDiffCell(item: WorktreeRow, width: number): React.ReactNode {
  if (!item.diffCounts) {
    return <Text>{padCell(item.diff || "", width)}</Text>;
  }
  const plus = `+${item.diffCounts.added}`;
  const minus = `-${item.diffCounts.deleted}`;
  const full = `${plus} ${minus}`;
  if (full.length > width) {
    return <Text>{padCell(full, width)}</Text>;
  }
  const padding = " ".repeat(Math.max(0, width - full.length));
  return (
    <>
      <Text color="green">{plus}</Text>
      <Text> </Text>
      <Text color="red">{minus}</Text>
      {padding ? <Text>{padding}</Text> : null}
    </>
  );
}

function SwitchView({
  nameOrPath,
  branch,
  cdMode,
}: {
  nameOrPath?: string;
  branch?: string;
  cdMode: boolean;
}) {
  const { exit } = useApp();
  const [step, setStep] = useState<
    "loading" | "select" | "path" | "branch" | "merge" | "merging" | "delete" | "deleting" | "done" | "error"
  >("loading");
  const [rows, setRows] = useState<WorktreeRow[]>([]);
  const [baseBranch, setBaseBranch] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => {
    return [
      {
        value: "__CREATE__",
        name: "+ Create a new worktree",
        branch: "",
        age: "",
        status: "",
        statusCounts: undefined,
        diff: "",
        diffCounts: undefined,
        isCurrent: false,
        isCreate: true,
      },
      ...rows,
    ];
  }, [rows]);

  const selection = useSelectList(items, step === "select");
  const mergeOptions = useMemo(
    () => [
      { value: "squash", label: `Merge into ${baseBranch || "master"} (squash)` },
      { value: "no-ff", label: `Merge into ${baseBranch || "master"} (no-ff)` },
      { value: "back", label: "Back" },
    ],
    [baseBranch]
  );
  const mergeSelection = useSelectList(mergeOptions, step === "merge");
  const deleteOptions = useMemo(
    () => [
      { value: "worktree", label: "Remove worktree only" },
      { value: "safe", label: "Remove worktree + delete branch (safe)" },
      { value: "force", label: "Remove worktree + delete branch (force)" },
      { value: "back", label: "Back" },
    ],
    []
  );
  const deleteSelection = useSelectList(deleteOptions, step === "delete");
  const table = useMemo(() => {
    const nameHeader = "Worktree";
    const branchHeader = "Branch";
    const ageHeader = "Age";
    const statusHeader = "Changes";
    const diffHeader = "Diff";
    const nameWidth = Math.max(
      10,
      Math.min(
        28,
        Math.max(
          nameHeader.length,
          ...items.map((item) => item.name.length)
        )
      )
    );
    const branchWidth = Math.max(
      8,
      Math.min(20, Math.max(branchHeader.length, ...items.map((item) => item.branch.length)))
    );
    const ageWidth = Math.max(5, Math.min(8, Math.max(ageHeader.length, ...items.map((item) => item.age.length))));
    const statusWidth = Math.max(
      7,
      Math.min(42, Math.max(statusHeader.length, ...items.map((item) => item.status.length)))
    );
    const diffWidth = Math.max(6, Math.min(14, Math.max(diffHeader.length, ...items.map((item) => item.diff.length))));

    const header = [
      padCell(nameHeader, nameWidth),
      padCell(branchHeader, branchWidth),
      padCell(ageHeader, ageWidth),
      padCell(statusHeader, statusWidth),
      padCell(diffHeader, diffWidth),
    ].join("  ");
    return { header, nameWidth, branchWidth, ageWidth, statusWidth, diffWidth };
  }, [items]);

  useEffect(() => {
    if (nameOrPath) {
      switchWorktree(nameOrPath, branch)
        .then((result) => {
          if (cdMode) {
            setOutput(`cd "${result.path}"`);
          } else {
            setOutput(
              result.created
                ? `Created and switched to worktree: ${result.path}`
                : `Switched to worktree: ${result.path}`
            );
          }
          setStep("done");
        })
        .catch((err) => {
          setError(err.message || String(err));
          setStep("error");
        });
      return;
    }

    getMainWorktreePath()
      .then(async (repoRoot) => {
        const [list, config] = await Promise.all([parseWorktreeList(repoRoot), loadConfig(repoRoot)]);
        const base = await resolveBaseBranch("master", repoRoot);
        setBaseBranch(base);
        const rowData = await Promise.all(
          list.map(async (worktree) => {
            const name = getRelativeWorktreeName(worktree.path, config?.gitforge);
            let age = "-";
            let status = "-";
            let statusCounts: WorktreeRow["statusCounts"];
            let diff = "-";
            let diffCounts: WorktreeRow["diffCounts"];
            try {
              const lastCommit = await getLastCommitInfo(worktree.path);
              age = formatAge(lastCommit.timestamp);
            } catch {
              age = "-";
            }
            try {
              const counts = await getWorktreeStatus(worktree.path);
              status = formatStatusText(counts);
              statusCounts = counts;
            } catch {
              status = "-";
            }
            try {
              const diffStats = await getWorktreeDiffStats(worktree.path);
              diffCounts = diffStats;
              diff = `+${diffStats.added} -${diffStats.deleted}`;
            } catch {
              diff = "-";
            }
            return {
              value: worktree.path,
              name,
              branch: worktree.isDetached ? "detached" : worktree.branch,
              age,
              status,
              statusCounts,
              diff,
              diffCounts,
              isCurrent: worktree.path === repoRoot,
            };
          })
        );
        setRows(rowData);
        setStep("select");
      })
      .catch((err) => {
        setError(err.message || String(err));
        setStep("error");
      });
  }, [nameOrPath, branch, cdMode]);

  useInput((_, key) => {
    if (step !== "select") {
      return;
    }
    if (key.return) {
      const selected = selection.selected;
      if (!selected) {
        return;
      }
      if (selected.value === "__CREATE__") {
        setStep("path");
      } else {
        switchWorktree(selected.value)
          .then((result) => {
            if (cdMode) {
              setOutput(`cd "${result.path}"`);
            } else {
              setOutput(`Switched to worktree: ${result.path}`);
            }
            setStep("done");
          })
          .catch((err) => {
            setError(err.message || String(err));
            setStep("error");
          });
      }
    }
  });

  useInput((input, key) => {
    if (step === "select") {
      if (input?.toLowerCase() === "m") {
        const selected = selection.selected;
        if (selected && !selected.isCreate) {
          setStep("merge");
        }
      }
      if (input?.toLowerCase() === "d") {
        const selected = selection.selected;
        if (selected && !selected.isCreate) {
          setStep("delete");
        }
      }
      return;
    }
    if (step !== "merge" && step !== "delete") {
      return;
    }
    if (key.escape) {
      setStep("select");
      return;
    }
    if (key.return && step === "merge") {
      const selected = selection.selected;
      if (!selected || selected.isCreate) {
        setStep("select");
        return;
      }
      const choice = mergeSelection.selected?.value;
      if (!choice || choice === "back") {
        setStep("select");
        return;
      }
      setStep("merging");
      mergeWorktree(selected.value, { squash: choice === "squash", noFF: choice === "no-ff" })
        .then((result) => {
          setOutput(`Merged ${result.mergedBranch} into ${result.baseBranch}.`);
          setStep("done");
        })
        .catch((err) => {
          setError(err.message || String(err));
          setStep("error");
        });
    }
    if (key.return && step === "delete") {
      const selected = selection.selected;
      if (!selected || selected.isCreate) {
        setStep("select");
        return;
      }
      const choice = deleteSelection.selected?.value;
      if (!choice || choice === "back") {
        setStep("select");
        return;
      }
      setStep("deleting");
      if (choice === "worktree") {
        rmWorktree(selected.value, false)
          .then(() => {
            setOutput(`Removed worktree: ${selected.name}.`);
            setStep("done");
          })
          .catch((err) => {
            setError(err.message || String(err));
            setStep("error");
          });
        return;
      }
      deleteWorktreeBranch(selected.value, { forceBranch: choice === "force" })
        .then((result) => {
          setOutput(`Removed worktree and deleted branch: ${result.branch}.`);
          setStep("done");
        })
        .catch((err) => {
          setError(err.message || String(err));
          setStep("error");
        });
    }
  });

  useEffect(() => {
    if (step === "done") {
      setTimeout(() => exit(), 0);
    }
    if (step === "error" && error) {
      setTimeout(() => exit(new Error(error)), 0);
    }
  }, [step, error, exit]);

  if (step === "loading") {
    return <Text>Loading worktrees...</Text>;
  }

  if (step === "error") {
    return <Text color="red">{error}</Text>;
  }

  if (step === "done") {
    return <Text>{output || "Done."}</Text>;
  }

  if (step === "path") {
    return (
      <TextInput
        label="Enter worktree path (e.g., ./my-feature)"
        placeholder="./my-feature"
        value={pathInput}
        onChange={setPathInput}
        onSubmit={(value) => {
          if (!isValidWorktreePath(value)) {
            setError(`Invalid worktree path: ${value}`);
            setStep("error");
            return;
          }
          setPathInput(value);
          const defaultBranch = value.split("/").pop()?.replace(/^\.\//, "") || value;
          setBranchInput(defaultBranch);
          setStep("branch");
        }}
      />
    );
  }

  if (step === "branch") {
    return (
      <TextInput
        label="Enter branch name (optional, defaults to path)"
        placeholder={branchInput || "branch-name"}
        value={branchInput}
        onChange={setBranchInput}
        onSubmit={(value) => {
          const finalBranch = value || branchInput || pathInput;
          switchWorktree(pathInput, finalBranch)
            .then((result) => {
              if (cdMode) {
                setOutput(`cd "${result.path}"`);
              } else {
                setOutput(`Created and switched to worktree: ${result.path}`);
              }
              setStep("done");
            })
            .catch((err) => {
              setError(err.message || String(err));
              setStep("error");
            });
        }}
      />
    );
  }

  if (step === "merging") {
    return <Text>Merging into {baseBranch || "master"}...</Text>;
  }

  if (step === "deleting") {
    return <Text>Deleting worktree...</Text>;
  }

  if (step === "merge") {
    return (
      <Box flexDirection="column">
        <Text>Merge target:</Text>
        {mergeOptions.map((item, idx) => (
          <Text key={item.value} color={idx === mergeSelection.index ? "cyan" : undefined}>
            {idx === mergeSelection.index ? "➤ " : "  "}
            {item.label}
          </Text>
        ))}
        <Text color="gray">Press Enter to confirm, Esc to cancel.</Text>
      </Box>
    );
  }

  if (step === "delete") {
    return (
      <Box flexDirection="column">
        <Text>Delete branch:</Text>
        {deleteOptions.map((item, idx) => (
          <Text key={item.value} color={idx === deleteSelection.index ? "cyan" : undefined}>
            {idx === deleteSelection.index ? "➤ " : "  "}
            {item.label}
          </Text>
        ))}
        <Text color="gray">Press Enter to confirm, Esc to cancel.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>Available worktrees:</Text>
      <Text color="gray">{table.header}</Text>
      {items.map((item, idx) => {
        const isSelected = idx === selection.index;
        let rowColor: "green" | "blue" | undefined;
        if (isSelected) {
          rowColor = "green";
        } else if (item.isCurrent) {
          rowColor = "blue";
        } else {
          rowColor = undefined;
        }
        const left = [
          padCell(item.name, table.nameWidth),
          padCell(item.branch, table.branchWidth),
          padCell(item.age, table.ageWidth),
        ].join("  ");
        const prefix = isSelected ? "➤ " : "  ";
        return (
          <Text key={item.value}>
            <Text color={rowColor}>
              {prefix}
              {left}
              {"  "}
            </Text>
            {renderStatusCell(item, table.statusWidth)}
            <Text>{"  "}</Text>
            {renderDiffCell(item, table.diffWidth)}
          </Text>
        );
      })}
      <Text color="gray">
        Use arrow keys and press Enter. Press m to merge into {baseBranch || "master"}, d to delete a branch.
      </Text>
    </Box>
  );
}

function App({ parsed }: { parsed: ParsedArgs }) {
  const { command, args, flags } = parsed;
  const cdMode = flags.cd ?? false;

  if (command === "help") {
    return <HelpView />;
  }

  if (command === "init") {
    return <InitView />;
  }

  if (command === "run") {
    return <RunView worktree={args[0]} script={args[1]} />;
  }

  if (command === "merge") {
    return <MergeView name={args[0]} squash={flags.squash ?? false} noFF={flags.noFF ?? false} />;
  }

  if (command === "switch") {
    const name = args[0];
    const branch = args[1];
    return <SwitchView nameOrPath={name} branch={branch} cdMode={cdMode} />;
  }

  return <HelpView />;
}

const parsed = parseArgs(process.argv.slice(2));

if (parsed.command === "switch" && parsed.flags.cd && parsed.args[0]) {
  switchWorktree(parsed.args[0], parsed.args[1])
    .then((result) => {
      process.stdout.write(`cd "${result.path}"\n`);
      process.exit(0);
    })
    .catch((error) => {
      process.stderr.write(`Error switching worktree: ${error.message}\n`);
      process.exit(1);
    });
} else {
  render(<App parsed={parsed} />);
}
