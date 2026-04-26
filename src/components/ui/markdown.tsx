"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: Props) {
  return (
    <div className={cn("text-sm text-zinc-300 leading-relaxed space-y-2", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-zinc-100 mt-3 mb-1">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-zinc-100 mt-3 mb-1">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-zinc-200 mt-2 mb-0.5">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="text-zinc-300 leading-relaxed">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic text-zinc-400">
              {children}
            </em>
          ),

          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 pl-1">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="text-zinc-300">
              {children}
            </li>
          ),

          code: ({ children }) => (
            <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500 pl-3 text-zinc-400 italic">
              {children}
            </blockquote>
          ),

          hr: () => <hr className="border-zinc-700 my-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}