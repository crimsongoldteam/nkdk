import { XML_PRESENT_TAG_VALUE, markYAMLScalarTag } from "@nkdk/runtime"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export function markExplicitEmptyPanelDefinition(
  panel: { ПустоеОпределение?: typeof XML_PRESENT_TAG_VALUE }
): void {
  panel.ПустоеОпределение = XML_PRESENT_TAG_VALUE
  markYAMLScalarTag(panel, "ПустоеОпределение", "xml/present")
}

export function collectExplicitEmptyPanelDefinitionUUIDs(
  yaml: unknown,
  standardPanelUUIDs: ReadonlySet<string>
): Set<string> {
  const result = new Set<string>()

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!isRecord(value)) return

    if (isRecord(value.Панель)) {
      collectPanel(value.Панель, standardPanelUUIDs, result)
    }
    Object.values(value).forEach(visit)
  }

  visit(yaml)
  return result
}

function collectPanel(
  panel: Record<string, unknown>,
  standardPanelUUIDs: ReadonlySet<string>,
  result: Set<string>
): void {
  if (!Object.prototype.hasOwnProperty.call(panel, "ПустоеОпределение")) return
  if (panel.ПустоеОпределение !== XML_PRESENT_TAG_VALUE) {
    throw new Error("ПустоеОпределение допускает только !xml/present")
  }
  if (typeof panel.UUID !== "string" || standardPanelUUIDs.has(panel.UUID)) {
    throw new Error("ПустоеОпределение допускается только у нестандартной панели с UUID")
  }
  if (panel.Имя !== undefined) {
    throw new Error("ПустоеОпределение допускается только для пустого определения нестандартной панели")
  }
  result.add(panel.UUID)
}
