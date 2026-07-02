import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { parseMetadataTargetFromYAML } from "../metadataTargets"
import { borderStyleItemTarget, type Border, type BorderYAML } from "./types"

export const importBorderFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: BorderYAML | undefined
): Border | undefined => {
  if (!data) return undefined

  const result: Border = {}

  if (data.Имя != null) {
    if (typeof data.Имя !== "string") throw new Error("Border: поле Имя должно быть строкой")
    result.ref = importStyleItemRefFromYAML(data.Имя)
  }

  if (data.Ширина !== undefined) {
    result.width = data.Ширина
  }

  const controlBorderType = importSystemEnumerationFromYAMLDeprecated<SE.ControlBorderType>(
    context,
    { type: "SystemEnumeration", typeSE: "ControlBorderType" },
    data.ТипРамки
  )
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function importStyleItemRefFromYAML(value: string): string {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: borderStyleItemTarget,
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target.kind === "object" && parsed.target.root === "StyleItem" ? parsed.target.objectName : value
}

registerTypeRule("Border", "importFromYAML", importBorderFromYAML)
