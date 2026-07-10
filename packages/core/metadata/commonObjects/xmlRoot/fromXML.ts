import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"

/** Маркерный обработчик: реальная работа выполняется оркестратором в importMetadataItemFromXML. */
export const importXMLRootFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  _xml: unknown
): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "importFromXML", importXMLRootFromXML)
