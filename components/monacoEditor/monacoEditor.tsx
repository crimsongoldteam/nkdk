"use client"

import Editor from "@monaco-editor/react"
import { useEffect, useState } from "react"

interface MonacoEditorProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

export function MonacoEditor({ value = "", onChange }: MonacoEditorProps) {
  const [editorValue, setEditorValue] = useState(value)

  // Синхронизируем внутреннее состояние с внешним value
  useEffect(() => {
    setEditorValue(value)
  }, [value])

  const handleEditorChange = (newValue: string | undefined) => {
    setEditorValue(newValue || "")
    onChange?.(newValue)
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        value={editorValue}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
        }}
      />
    </div>
  )
}
