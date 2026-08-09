import type { Diagnostic } from "../../diagnostics/types"

interface IndexedElement {
  readonly name: string
  readonly path: string
}

export function validateBaseFormCompatibility(params: {
  readonly base: unknown
  readonly extension: unknown
  readonly extensionFilePath: string
}): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const baseElements = indexElements(params.base, "основной", params.extensionFilePath, diagnostics)
  const extensionElements = indexElements(params.extension, "форме расширения", params.extensionFilePath, diagnostics)
  for (const [name, element] of baseElements) {
    if (extensionElements.has(name)) continue
    diagnostics.push(diagnostic(
      params.extensionFilePath,
      `В форме расширения отсутствует элемент основной формы «${name}»`,
      element.path,
    ))
  }
  return diagnostics
}

function indexElements(
  form: unknown,
  formName: string,
  extensionFilePath: string,
  diagnostics: Diagnostic[],
): ReadonlyMap<string, IndexedElement> {
  const result = new Map<string, IndexedElement>()
  if (!isRecord(form)) return result
  visitTree(form.Элементы, "Элементы")
  return result

  function visitTree(value: unknown, path: string): void {
    if (value === undefined) return
    if (!isRecord(value)) {
      diagnostics.push(diagnostic(extensionFilePath, `Некорректное дерево элементов в ${formName} форме`, path))
      return
    }
    for (const [name, rawElement] of Object.entries(value)) {
      const elementPath = `${path}.${name}`
      if (name.length === 0) {
        diagnostics.push(diagnostic(extensionFilePath, `Имя элемента в ${formName} форме не может быть пустым`, path))
        continue
      }
      if (!isRecord(rawElement)) {
        diagnostics.push(diagnostic(extensionFilePath, `Некорректный элемент «${name}» в ${formName} форме`, elementPath))
        continue
      }
      if (result.has(name)) {
        diagnostics.push(diagnostic(extensionFilePath, `Повтор имени элемента «${name}» в ${formName} форме`, elementPath))
      } else {
        result.set(name, { name, path: elementPath })
      }
      visitTree(rawElement.Элементы, `${elementPath}.Элементы`)
    }
  }
}

function diagnostic(filePath: string, message: string, path: string): Diagnostic {
  return { filePath, line: 1, col: 1, severity: "error", source: "cross-file", message, path }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
