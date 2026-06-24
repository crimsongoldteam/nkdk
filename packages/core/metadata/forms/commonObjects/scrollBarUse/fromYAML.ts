import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"

const importScrollBarUseFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): SE.ScrollBarUse | undefined => {
  if (!value) return undefined

  const enumeration = SE.ScrollBarUseFromYAML

  return enumeration[value as keyof typeof enumeration]
}

registerTypeRule("ScrollBarUseBoolean", "importFromYAML", importScrollBarUseFromYAML)
