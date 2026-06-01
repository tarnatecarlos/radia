"use client";

import { useCallback, useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Quote,
  Table,
  CheckSquare,
  Link2,
} from "lucide-react";
import { RichContent } from "@/components/ui/rich-content";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

type ToolbarItem =
  | { separator: true }
  | { label: string; icon: React.ComponentType<{ className?: string }>; insert: { before: string; after?: string; placeholder?: string } | { line: string } | { block: string } };

const toolbar: ToolbarItem[] = [
  { label: "Heading 1", icon: Heading1, insert: { line: "# " } },
  { label: "Heading 2", icon: Heading2, insert: { line: "## " } },
  { separator: true },
  { label: "Bold", icon: Bold, insert: { before: "**", after: "**", placeholder: "bold" } },
  { label: "Italic", icon: Italic, insert: { before: "_", after: "_", placeholder: "italic" } },
  { label: "Code", icon: Code, insert: { before: "`", after: "`", placeholder: "code" } },
  { label: "Link", icon: Link2, insert: { before: "[", after: "](url)", placeholder: "text" } },
  { separator: true },
  { label: "Bullet List", icon: List, insert: { line: "- " } },
  { label: "Numbered List", icon: ListOrdered, insert: { line: "1. " } },
  { label: "Checklist", icon: CheckSquare, insert: { line: "- [ ] " } },
  { label: "Quote", icon: Quote, insert: { line: "> " } },
  { label: "Divider", icon: Minus, insert: { block: "---" } },
  { separator: true },
  { label: "Table", icon: Table, insert: { block: "| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |" } },
];

export function MarkdownEditor({ value, onChange, placeholder, minRows = 12 }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange]
  );

  const applyAction = useCallback((item: Exclude<ToolbarItem, { separator: true }>) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const { selectionStart, selectionEnd } = ta;
    const sel = value.slice(selectionStart, selectionEnd);
    let newValue: string;
    let cursorPos: number;

    if ("line" in item.insert) {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      newValue = value.slice(0, lineStart) + item.insert.line + value.slice(lineStart);
      cursorPos = selectionStart + item.insert.line.length;
    } else if ("block" in item.insert) {
      const pad = selectionStart > 0 && value[selectionStart - 1] !== "\n" ? "\n\n" : "";
      newValue = value.slice(0, selectionStart) + pad + item.insert.block + "\n" + value.slice(selectionStart);
      cursorPos = selectionStart + pad.length + item.insert.block.length + 1;
    } else {
      const { before, after = "", placeholder: ph = "" } = item.insert;
      const text = sel || ph;
      newValue = value.slice(0, selectionStart) + before + text + after + value.slice(selectionEnd);
      cursorPos = sel
        ? selectionStart + before.length + text.length + after.length
        : selectionStart + before.length + text.length;
    }

    onChange(newValue);

    // Restore focus + cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.currentTarget;
      const newVal = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
      onChange(newVal);
      requestAnimationFrame(() => {
        e.currentTarget.setSelectionRange(selectionStart + 2, selectionStart + 2);
      });
    }
  }, [value, onChange]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/50">
        <button
          onClick={() => setPreview(false)}
          className={`mr-0.5 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${!preview ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
        >
          <Pencil className="h-3 w-3" />Write
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`mr-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${preview ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
        >
          <Eye className="h-3 w-3" />Preview
        </button>

        {!preview && toolbar.map((item, i) =>
          "separator" in item ? (
            <div key={`s${i}`} className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
          ) : (
            <button
              key={item.label}
              onClick={() => applyAction(item)}
              title={item.label}
              className="rounded p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <item.icon className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>

      {/* Content area */}
      {preview ? (
        <div className="min-h-[12rem] overflow-auto p-4">
          {value.trim() ? (
            <RichContent content={value} />
          ) : (
            <p className="text-sm italic text-slate-400 dark:text-slate-500">Nothing to preview yet...</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Write using Markdown — **bold**, _italic_, # headings, - lists..."}
          rows={minRows}
          className="w-full resize-y bg-transparent p-4 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      )}
    </div>
  );
}
