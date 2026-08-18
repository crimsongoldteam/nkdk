import type { TypedDataPathMemberDeclaration } from "@nkdk/runtime/rule-kit"
import { builtInStructuredDataPathRules } from "../../validation/dataPath/declarations"

const members: readonly TypedDataPathMemberDeclaration[] = [
  { internal: "Variant", yaml: "Вариант", target: { kind: "terminal", terminalTypes: ["StandardPeriodVariant"] } },
  { internal: "StartDate", yaml: "ДатаНачала", target: { kind: "terminal", terminalTypes: ["dateTime"] } },
  { internal: "EndDate", yaml: "ДатаОкончания", target: { kind: "terminal", terminalTypes: ["dateTime"] } },
]

export const standardPeriodDataPathRules = builtInStructuredDataPathRules({
  type: "StandardPeriod",
  aliases: ["СтандартныйПериод"],
  members,
  conditionalMembers: ["StartDate", "EndDate"],
})
