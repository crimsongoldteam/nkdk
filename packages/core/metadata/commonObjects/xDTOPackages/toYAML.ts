import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ExportToYAMLFunction } from "~/metadata/orchestration/property/fn"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const exportXDTOPackagesToYAML: ExportToYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackages | undefined
): XDTOPackagesYAML | undefined => value

registerTypeRule("XDTOPackages", "exportToYAML", exportXDTOPackagesToYAML)
