import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"

/**
 * Возвращает true, если первая компонента dataPath ссылается на FormAttribute
 * с единственным типом "DynamicList" в metadataForNumbering экспортного контекста.
 */
export const isDynamicListAttribute = (
  dataPath: string | undefined,
  context: ConfigurationContextWithExportToXML | undefined,
): boolean => {
  if (!dataPath || !context) return false
  const name = dataPath.split(".")[0]!
  const metadataForNumbering = context.exportToXML?.context?.metadataForNumbering ?? []
  for (const entry of metadataForNumbering) {
    const element = entry.element as any
    if (element?.itemType === "FormAttribute" && element?.name === name) {
      const typeArr = element?.type?.type
      return Array.isArray(typeArr) && typeArr.length === 1 && typeArr[0] === "DynamicList"
    }
  }
  return false
}
