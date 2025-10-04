import "@testing-library/jest-dom/vitest"

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock Monaco Editor
Object.defineProperty(window, "monaco", {
  writable: true,
  value: {
    editor: {
      create: () => ({
        dispose: () => {},
        getValue: () => "",
        setValue: () => {},
        onDidChangeModelContent: () => ({ dispose: () => {} }),
      }),
    },
  },
})
