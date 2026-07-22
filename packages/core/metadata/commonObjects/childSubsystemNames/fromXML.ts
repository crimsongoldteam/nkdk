import { registerTypeRule } from "../../orchestration"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const importChildSubsystemNamesFromXML = (
  value: ChildSubsystemNamesXML | undefined
): ChildSubsystemNames | undefined => {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

registerTypeRule("ChildSubsystemNames", "importFromXML", (_context, _rule, value) =>
  importChildSubsystemNamesFromXML(value as ChildSubsystemNamesXML | undefined)
)
