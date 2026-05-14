import { registerTypeRule } from "~/metadata/orchestration"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const exportChildSubsystemNamesToXML = (
  value: ChildSubsystemNames | undefined
): ChildSubsystemNamesXML | undefined => {
  if (!value || value.length === 0) return undefined
  return value.length === 1 ? value[0] : value
}

registerTypeRule("ChildSubsystemNames", "exportToXML", (_context, _rule, value) =>
  exportChildSubsystemNamesToXML(value as ChildSubsystemNames | undefined)
)
