import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ExportToYAMLFunction } from "../../orchestration/property/fn"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const exportXDTOPackagesToYAML: ExportToYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackages | undefined
): XDTOPackagesYAML | undefined => value

registerTypeRule("XDTOPackages", "exportToYAML", exportXDTOPackagesToYAML)
