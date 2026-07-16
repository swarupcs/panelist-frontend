import React, { useState, useEffect } from 'react';
import { Plus, X, FileCode, CheckCircle, Pencil } from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { cn } from '@/lib/cn';

interface EditorFile {
  id: string;
  name: string;
  content: string;
}

interface MultiFileEditorProps {
  onSubmit: (markdownPayload: string) => void;
  submitLoading?: boolean;
  disabled?: boolean;
}

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'graphql':
    case 'gql':
      return 'graphql';
    default:
      return 'plaintext';
  }
}

export function MultiFileEditor({
  onSubmit,
  submitLoading = false,
  disabled = false,
}: MultiFileEditorProps) {
  const [files, setFiles] = useState<EditorFile[]>([
    { id: '1', name: 'architecture.md', content: '# System Architecture\n\n' },
    { id: '2', name: 'schema.sql', content: '-- Database Schema\n\n' },
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('interview-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#09090b',
          'editor.lineHighlightBackground': '#18181b',
        }
      });
      monaco.editor.setTheme('interview-dark');

      // Enable Autocomplete / IntelliSense for JS/TS
      const m = monaco as any;
      m.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      m.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: m.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
      });

      m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      m.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: m.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
      });
    }
  }, [monaco]);

  const activeFile = files.find((f) => f.id === activeFileId);
  const activeLanguage = activeFile ? getLanguageFromExtension(activeFile.name) : 'plaintext';

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFileId) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value || '' } : f))
    );
  };

  const handleAddFile = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newFile: EditorFile = {
      id: newId,
      name: `file${files.length + 1}.ts`,
      content: '// New file\n',
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
    startEditing(newId, newFile.name);
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : '');
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingFileId(id);
    setEditName(currentName);
  };

  const commitNameEdit = () => {
    if (!editingFileId || !editName.trim()) {
      setEditingFileId(null);
      return;
    }
    setFiles((prev) =>
      prev.map((f) =>
        f.id === editingFileId ? { ...f, name: editName.trim() } : f
      )
    );
    setEditingFileId(null);
  };

  const handleSubmit = () => {
    if (submitLoading || disabled) return;
    
    // Bundle into a single markdown payload
    const payload = files.map(f => {
      const lang = getLanguageFromExtension(f.name);
      return `**File: ${f.name}**\n\`\`\`${lang}\n${f.content}\n\`\`\``;
    }).join('\n\n');

    onSubmit(payload);
  };

  return (
    <div className='flex flex-col h-full space-y-3'>
      {/* File Tabs */}
      <div className='flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin'>
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => {
              if (editingFileId !== file.id) setActiveFileId(file.id);
            }}
            className={cn(
              'group flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm transition-colors cursor-pointer min-w-[120px] max-w-[200px]',
              activeFileId === file.id
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <FileCode className='size-3.5 shrink-0 opacity-70' />
            
            {editingFileId === file.id ? (
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitNameEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitNameEdit();
                  if (e.key === 'Escape') setEditingFileId(null);
                }}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className='flex-1 truncate select-none' onDoubleClick={() => startEditing(file.id, file.name)}>
                {file.name}
              </span>
            )}

            <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
              {editingFileId !== file.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(file.id, file.name);
                  }}
                  className='rounded-sm p-0.5 hover:bg-primary/20 hover:text-primary transition-colors'
                >
                  <Pencil className='size-3' />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleDeleteFile(file.id, e)}
                className='rounded-sm p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors ml-1'
              >
                <X className='size-3' />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddFile}
          className='flex items-center justify-center shrink-0 rounded-t-lg border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors'
          title="New File"
        >
          <Plus className='size-4' />
        </button>
      </div>

      {/* Editor Area */}
      <div className='relative flex-1 min-h-[300px] overflow-hidden rounded-lg border border-border/50 bg-[#09090b]'>
        {activeFile ? (
          <Editor
            height="100%"
            theme="interview-dark"
            language={activeLanguage}
            value={activeFile.content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'all',
              readOnly: submitLoading || disabled,
              suggestOnTriggerCharacters: true,
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true
              },
              snippetSuggestions: "inline",
              wordBasedSuggestions: "currentDocument",
            }}
          />
        ) : (
          <div className='flex h-full items-center justify-center text-muted-foreground text-sm flex-col gap-2'>
            <FileCode className='size-8 opacity-20' />
            <p>No files open</p>
            <button 
              type="button" 
              onClick={handleAddFile} 
              className="text-primary hover:bg-primary/10 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Create a file
            </button>
          </div>
        )}
      </div>

      {/* Footer / Submit */}
      <div className='flex justify-end pt-2'>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitLoading || disabled || files.length === 0}
          className='flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50'
        >
          {submitLoading ? (
            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CheckCircle className='size-4' />
          )}
          Done — Submit System Design
        </button>
      </div>
    </div>
  );
}
