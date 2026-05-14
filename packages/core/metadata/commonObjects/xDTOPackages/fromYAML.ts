import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importFromYAMLFunction } from "~/metadata/orchestration/property/fn"
import { XDTOPackages, XDTOPackagesYAML } from "./types"

export const importXDTOPackagesFromYAML: importFromYAMLFunction = (
  _context,
  _rule,
  value: XDTOPackagesYAML | undefined
): XDTOPackages | undefined => value

registerTypeRule("XDTOPackages", "importFromYAML", importXDTOPackagesFromYAML)
