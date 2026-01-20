import React, { useState } from "react";
import { Copy, Check, Code } from "lucide-react";

interface CodePreviewProps {
  code: string;
  language?: "javascript" | "json";
  title?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language = "javascript",
  title = "Generated Code",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (text: string, lang: string) => {
    if (lang === "javascript") {
      return text
        .replace(
          /(ServerEvents\.|event\.|Item\.|Ingredient\.)/g,
          '<span class="text-blue-400">$1</span>'
        )
        .replace(
          /\b(const|let|var|function|return|if|else|for|while|of)\b/g,
          '<span class="text-purple-400">$1</span>'
        )
        .replace(
          /\b(recipes|shaped|shapeless|smelting|blasting|smoking)\b/g,
          '<span class="text-green-400">$1</span>'
        )
        .replace(/'([^']*)'/g, "<span class=\"text-yellow-400\">'$1'</span>")
        .replace(/"([^"]*)"/g, '<span class="text-yellow-400">"$1"</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground">$1</span>')
        .replace(/\/\*[\s\S]*?\*\//g, '<span class="text-muted-foreground">$&</span>');
    } else if (lang === "json") {
      return text
        .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="text-yellow-400">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="text-purple-400">$1</span>');
    }
    return text;
  };

  return (
    <div className="bg-background rounded-lg border border-primary/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-primary/20">
        <div className="flex items-center gap-2 text-foreground">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">({language})</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-muted/30">
        <pre className="text-sm font-mono text-foreground">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightCode(code, language),
            }}
          />
        </pre>
      </div>
    </div>
  );
};
