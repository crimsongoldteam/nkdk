import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ExportToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const exportXDTOPackagesToYAML: ExportToYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackages | undefined
): XDTOPackagesYAML | undefined => value

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOPackages", "exportToYAML", exportXDTOPackagesToYAML)
