import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProject, useListFiles, useUpdateFile, useRunCode, useCreateFile, useDeleteFile, getGetProjectQueryKey, getListFilesQueryKey } from "@workspace/api-client-react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import JSZip from "jszip";
import { 
  Play, Save, Download, ArrowLeft, Plus, FileCode2, 
  TerminalSquare, Layout, Moon, Sun, Trash2, Code2
} from "lucide-react";
import { CodeFile } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useGetProject(id, { 
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) } 
  });
  
  const { data: files, isLoading: filesLoading } = useListFiles(id, {
    query: { enabled: !!id, queryKey: getListFilesQueryKey(id) }
  });

  const updateFile = useUpdateFile();
  const createFile = useCreateFile();
  const deleteFile = useDeleteFile();
  const runCode = useRunCode();

  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [fileContents, setFileContents] = useState<Record<number, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<number>>(new Set());
  
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [previewPane, setPreviewPane] = useState<"preview" | "console">("preview");

  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const activeFile = useMemo(() => {
    return files?.find(f => f.id === activeFileId);
  }, [files, activeFileId]);

  // Init files
  useEffect(() => {
    if (files && files.length > 0) {
      const newContents = { ...fileContents };
      let changed = false;
      files.forEach(f => {
        if (newContents[f.id] === undefined) {
          newContents[f.id] = f.content;
          changed = true;
        }
      });
      if (changed) {
        setFileContents(newContents);
      }
      if (activeFileId === null) {
        setActiveFileId(files[0].id);
      }
    }
  }, [files, activeFileId]);

  // Automatically determine if project supports live preview
  useEffect(() => {
    if (project) {
      if (project.language === 'html-css-js' || project.language === 'react') {
        setPreviewPane("preview");
      } else {
        setPreviewPane("console");
      }
    }
  }, [project]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFileId !== null) {
      setFileContents(prev => ({ ...prev, [activeFileId]: value }));
      setUnsavedChanges(prev => new Set(prev).add(activeFileId));
    }
  };

  const handleSave = async () => {
    if (unsavedChanges.size === 0) return;

    try {
      const promises = Array.from(unsavedChanges).map(fileId => {
        return updateFile.mutateAsync({
          id,
          fileId,
          data: { content: fileContents[fileId] }
        });
      });

      await Promise.all(promises);
      
      setUnsavedChanges(new Set());
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(id) });
      
      toast({
        title: "Saved",
        description: "All changes have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save your changes.",
      });
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Keyboard shortcut for save
  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', downHandler);
    return () => window.removeEventListener('keydown', downHandler);
  }, []);

  const handleRun = async () => {
    if (!activeFile) return;
    
    setPreviewPane("console");
    setIsRunning(true);
    setOutput("Running...\n");
    
    // Auto-save before run
    await handleSave();

    try {
      // If it's a python project, we might just want to run the main file.
      // But for simplicity, we run the active file if it's python/typescript.
      const result = await runCode.mutateAsync({
        data: {
          language: activeFile.language || project?.language || 'python',
          code: fileContents[activeFile.id] || activeFile.content
        }
      });

      setOutput(result.stdout + (result.stderr ? `\nError:\n${result.stderr}` : '') + `\n\nProcess exited with code ${result.exitCode}`);
    } catch (error: any) {
      setOutput(`Failed to execute code:\n${error.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownload = async () => {
    if (!files || !project) return;
    
    try {
      const zip = new JSZip();
      
      files.forEach(f => {
        const content = fileContents[f.id] !== undefined ? fileContents[f.id] : f.content;
        zip.file(f.name, content);
      });
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Project files downloaded successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not generate zip file.",
      });
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      let ext = newFileName.split('.').pop() || '';
      let lang = 'plaintext';
      if (ext === 'js') lang = 'javascript';
      if (ext === 'ts') lang = 'typescript';
      if (ext === 'py') lang = 'python';
      if (ext === 'html') lang = 'html';
      if (ext === 'css') lang = 'css';
      if (ext === 'json') lang = 'json';

      const file = await createFile.mutateAsync({
        id,
        data: {
          name: newFileName,
          language: lang,
          content: ''
        }
      });

      setFileContents(prev => ({ ...prev, [file.id]: '' }));
      setActiveFileId(file.id);
      setNewFileDialog(false);
      setNewFileName("");
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(id) });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create file.",
      });
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile.mutateAsync({ id, fileId });
      if (activeFileId === fileId) {
        const remaining = files?.filter(f => f.id !== fileId);
        setActiveFileId(remaining && remaining.length > 0 ? remaining[0].id : null);
      }
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(id) });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete file.",
      });
    }
  };

  // Generate srcdoc for live preview
  const previewSrcDoc = useMemo(() => {
    if (!files) return "";

    // ── React preview (JSX/TSX via Babel Standalone + CDN) ──────────────────
    if (project?.language === 'react') {
      const appFile =
        files.find(f => f.name === 'App.tsx' || f.name === 'App.jsx') ||
        files.find(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx')) ||
        files.find(f => f.name.endsWith('.ts') || f.name.endsWith('.js'));
      const cssFile = files.find(f => f.name.endsWith('.css'));

      if (!appFile) {
        return `<html><body style="font-family:sans-serif;padding:2rem;color:#888;text-align:center">No App.tsx file found</body></html>`;
      }

      const rawCode = fileContents[appFile.id] !== undefined ? fileContents[appFile.id] : appFile.content;
      const cssContent = cssFile ? (fileContents[cssFile.id] !== undefined ? fileContents[cssFile.id] : cssFile.content) : '';

      // Strip/replace imports so the code runs without a bundler
      const processed = rawCode
        // import React, { useState } from 'react'  →  (removed, React is global)
        .replace(/^import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"].*$/gm, '')
        // import { useState, useEffect } from 'react'  →  const { useState, useEffect } = React;
        .replace(/^import\s*\{([^}]*)\}\s*from\s+['"]react['"].*$/gm, 'const {$1} = React;')
        // import ReactDOM from 'react-dom'  →  (removed, ReactDOM is global)
        .replace(/^import\s+\w+\s+from\s+['"]react-dom[^'"]*['"].*$/gm, '')
        // remove all remaining import lines (no bundler available)
        .replace(/^import\s+.*$/gm, '')
        // export default function/class/const  →  keep definition, remove export
        .replace(/export\s+default\s+/g, '');

      // Escape </script> inside user code so it doesn't close our script tag
      const escaped = processed.replace(/<\/script>/gi, '<\\/script>');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: sans-serif; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    ${escaped}

    // Auto-render: look for a component named App, default, or the first exported name
    try {
      const AppComponent = typeof App !== 'undefined' ? App
        : typeof Default !== 'undefined' ? Default
        : null;
      if (AppComponent) {
        ReactDOM.createRoot(document.getElementById('root')).render(
          React.createElement(AppComponent)
        );
      } else {
        document.getElementById('root').innerHTML =
          '<div style="padding:1rem;color:#888">No default component found. Make sure your component is named <b>App</b>.</div>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<pre style="color:red;padding:1rem;font-size:13px">' + err.message + '</pre>';
    }
  </script>
</body>
</html>`;
    }

    // ── HTML / CSS / JS preview ──────────────────────────────────────────────
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js'));

    if (!htmlFile) return "<html><body><div style='font-family:sans-serif;padding:2rem;text-align:center;color:#888'>No HTML file found for preview</div></body></html>";

    let htmlContent = fileContents[htmlFile.id] !== undefined ? fileContents[htmlFile.id] : htmlFile.content;
    const cssContent = cssFile ? (fileContents[cssFile.id] !== undefined ? fileContents[cssFile.id] : cssFile.content) : "";
    const jsContent = jsFile ? (fileContents[jsFile.id] !== undefined ? fileContents[jsFile.id] : jsFile.content) : "";

    if (cssContent) {
      htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
    }
    if (jsContent) {
      htmlContent = htmlContent.replace('</body>', `<script>${jsContent}<\/script></body>`);
    }

    return htmlContent;
  }, [files, fileContents, project?.language]);

  if (projectLoading || filesLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Code2 className="h-12 w-12 text-primary animate-pulse" />
          <h2 className="text-xl font-medium">Loading workspace...</h2>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isServerSide = project.language === 'python' || project.language === 'typescript';

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{project.name}</span>
            <span className="text-xs text-muted-foreground">{project.language}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isServerSide && (
            <Button onClick={handleRun} disabled={isRunning} variant="secondary" className="gap-2 bg-green-600/10 text-green-600 hover:bg-green-600/20 dark:text-green-400">
              <Play className="h-4 w-4" />
              {isRunning ? "Running..." : "Run"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={unsavedChanges.size === 0} variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save {unsavedChanges.size > 0 && `(${unsavedChanges.size})`}
          </Button>
          <Button onClick={handleDownload} variant="ghost" size="icon" title="Download Source">
            <Download className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-border mx-1"></div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Sidebar - File Tree */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25} className="bg-muted/30 border-r flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNewFileDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {files?.map(file => (
                <div 
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`
                    flex items-center justify-between group px-3 py-1.5 rounded-md text-sm cursor-pointer
                    ${activeFileId === file.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    {unsavedChanges.has(file.id) && <span className="h-2 w-2 rounded-full bg-primary shrink-0"></span>}
                  </div>
                  <button 
                    onClick={(e) => handleDeleteFile(e, file.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded text-muted-foreground transition-all shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          {activeFile ? (
            <div className="h-full flex flex-col">
              <div className="h-10 bg-card border-b flex items-center px-4 shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileCode2 className="h-4 w-4" />
                  {activeFile.name}
                  {unsavedChanges.has(activeFile.id) && <span className="text-primary ml-1">*</span>}
                </div>
              </div>
              <div className="flex-1 relative">
                <MonacoEditor
                  language={activeFile.language === 'html-css-js' ? (activeFile.name.split('.').pop() === 'js' ? 'javascript' : activeFile.name.split('.').pop()) : activeFile.language}
                  theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                  value={fileContents[activeFile.id] !== undefined ? fileContents[activeFile.id] : activeFile.content}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "var(--font-mono)",
                    wordWrap: "on",
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    formatOnPaste: true,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a file to edit
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview / Output */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="h-full flex flex-col bg-background">
            <div className="h-10 bg-card border-b flex items-center px-2 shrink-0 gap-1">
              {!isServerSide && (
                <Button 
                  variant={previewPane === "preview" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setPreviewPane("preview")}
                >
                  <Layout className="h-3 w-3 mr-1.5" />
                  Preview
                </Button>
              )}
              <Button 
                variant={previewPane === "console" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setPreviewPane("console")}
              >
                <TerminalSquare className="h-3 w-3 mr-1.5" />
                Output
              </Button>
            </div>
            
            <div className="flex-1 relative bg-white dark:bg-[#1e1e1e]">
              {previewPane === "preview" ? (
                <iframe
                  title="preview"
                  srcDoc={previewSrcDoc}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              ) : (
                <ScrollArea className="h-full">
                  <pre className="p-4 font-mono text-sm whitespace-pre-wrap dark:text-gray-300 text-gray-800">
                    {output || "Run your code to see output here."}
                  </pre>
                </ScrollArea>
              )}
            </div>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* New File Dialog */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateFile}>
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="filename" className="mb-2 block">Filename</Label>
              <Input
                id="filename"
                placeholder="e.g. index.js, style.css"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewFileDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!newFileName.trim()}>Create File</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}