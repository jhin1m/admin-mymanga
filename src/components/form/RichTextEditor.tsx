"use client";
import React, { useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const createLink = () => {
    const url = prompt("Nhập URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M14 4l-4 16M6 20h4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
          </svg>
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Bullet List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Numbered List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 12h18M3 20h18" />
          </svg>
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <button
          type="button"
          onClick={createLink}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Insert Link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => execCommand("removeFormat")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Clear Formatting"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-4 text-sm text-gray-900 dark:text-white/90 focus:outline-none bg-white dark:bg-gray-900"
        data-placeholder={placeholder}
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        [contenteditable] {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
