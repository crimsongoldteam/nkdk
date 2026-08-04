import { markYAMLScalarTag, yamlScalarTagAt } from "../../../yaml/scalarTags"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export function markExplicitEmptyPanelDefinition(panel: object): void {
  markYAMLScalarTag(panel, "UUID", "xml")
}

export function hasExplicitEmptyPanelDefinition(panel: unknown): boolean {
  return isRecord(panel) && yamlScalarTagAt(panel, "UUID") === "xml"
}

export function collectExplicitEmptyPanelDefinitionUUIDs(
  yaml: unknown,
  standardPanelUUIDs: ReadonlySet<string>
): Set<string> {
  const result = new Set<string>()

  const visit = (value: unknown, isPanel = false): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        rejectUnexpectedTag(value, index)
        visit(entry)
      })
      return
    }
    if (!isRecord(value)) return

    for (const [key, entry] of Object.entries(value)) {
      if (yamlScalarTagAt(value, key) === "xml") {
        if (!isPanel || key !== "UUID") {
          throw new Error(`Тег !xml не допускается у поля панели ${key}`)
        }
        if (typeof entry !== "string" || standardPanelUUIDs.has(entry)) {
          throw new Error("Тег !xml допускается только у UUID нестандартной панели")
        }
        if (value.Имя !== undefined || value.Представление !== undefined) {
          throw new Error("Тег !xml допускается только для пустого определения нестандартной панели")
        }
        result.add(entry)
      }

      visit(entry, key === "Панель" && isRecord(entry))
    }
  }

  visit(yaml)
  return result
}

function rejectUnexpectedTag(parent: unknown[], key: number): void {
  if (yamlScalarTagAt(parent, key) === "xml") {
    throw new Error("Тег !xml не допускается у элемента списка интерфейса")
  }
}
