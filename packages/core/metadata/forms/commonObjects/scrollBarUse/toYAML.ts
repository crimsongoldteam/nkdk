import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToYAMLFunction, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import { ScrollBarUse } from "./types"

const exportScrollBarUseToYAML: ExportToYAMLFunction = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: ScrollBarUse | undefined
): string | undefined => {
  if (!value) return undefined

  const enumeration = SE.ScrollBarUseToYAML

  return enumeration[value]
}

registerTypeRule("ScrollBarUseBoolean", "exportToYAML", exportScrollBarUseToYAML)
