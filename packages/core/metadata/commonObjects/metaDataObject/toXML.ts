import { registerTypeRule } from "~/metadata/orchestration"

/** Маркерный обработчик: реальная работа выполняется оркестратором в exportMetadataItemToXML. */
export const exportMetaDataObjectToXML = (): undefined => {
  return undefined
}

registerTypeRule("MetaDataObject", "exportToXML", exportMetaDataObjectToXML)
