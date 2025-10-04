"use client"

import { Editor } from "@monaco-editor/react"
import { useState } from "react"

interface MonacoEditorProps {
  value?: string
  onChange?: (value: string | undefined) => void
  language?: string
  height?: string
  width?: string
  readOnly?: boolean
  theme?: "vs-dark" | "light"
}

export function MonacoEditor({
  value = "",
  onChange,
  language = "javascript",
  height = "300px",
  width = "100%",
  readOnly = false,
  theme = "vs-dark",
}: MonacoEditorProps) {
  const [editorValue, setEditorValue] = useState(value)

  const handleEditorChange = (newValue: string | undefined) => {
    setEditorValue(newValue || "")
    onChange?.(newValue)
  }

  return (
    <div style={{ width, height }}>
      <Editor
        height={height}
        width={width}
        language={language}
        value={editorValue}
        onChange={handleEditorChange}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  )
}
