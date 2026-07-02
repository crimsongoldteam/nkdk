import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { importFromYAMLFunction } from "../../orchestration/property/fn"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const importXDTOPackagesFromYAML: importFromYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackagesYAML | undefined
): XDTOPackages | undefined => value

registerTypeRule("XDTOPackages", "importFromYAML", importXDTOPackagesFromYAML)
