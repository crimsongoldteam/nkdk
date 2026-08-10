import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importFromYAMLFunction } from "@nkdk/runtime/rule-kit"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const importXDTOPackagesFromYAML: importFromYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackagesYAML | undefined
): XDTOPackages | undefined => value

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOPackages", "importFromYAML", importXDTOPackagesFromYAML)
