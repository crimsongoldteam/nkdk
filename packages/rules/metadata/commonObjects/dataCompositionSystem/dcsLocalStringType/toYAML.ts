import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { taggedYAMLScalar } from "@nkdk/runtime"
import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import type { DcsLocalStringValue } from "./types"

const exportDcsLocalStringTypeToYAML: ExportToYAMLFunctionNew = (params) => {
  const value = params.value as DcsLocalStringValue | undefined
  if (value !== undefined && "kind" in value) return taggedYAMLScalar("xml/string", value.text)
  return exportI8nTextToYAML(params)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "exportToYAML",
  exportDcsLocalStringTypeToYAML,
)
