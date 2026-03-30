"use client";

import { Loader2 } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

type ToolArgs = StrReplaceArgs | FileManagerArgs | Record<string, unknown>;

interface ToolCallBadgeProps {
  toolName: string;
  args: ToolArgs;
  state: "call" | "partial-call" | "result";
}

function getLabel(toolName: string, args: ToolArgs): string {
  const filename = (path: string) => path.split("/").pop() ?? path;

  if (toolName === "str_replace_editor") {
    const { command, path } = args as StrReplaceArgs;
    const name = filename(path);
    switch (command) {
      case "create":
        return `Creating ${name}`;
      case "str_replace":
      case "insert":
        return `Editing ${name}`;
      case "view":
        return `Reading ${name}`;
      case "undo_edit":
        return `Reverting ${name}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args as FileManagerArgs;
    switch (command) {
      case "rename":
        return `Renaming ${filename(path)} to ${filename(new_path ?? path)}`;
      case "delete":
        return `Deleting ${filename(path)}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
