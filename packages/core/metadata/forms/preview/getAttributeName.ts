import { ConfigurationContext } from "~/metadata/context/types"
import { PreviewAttribute } from "../clientApplicationForm/base/types"

export const getAttributeName = (
  context: ConfigurationContext,
  dataPath?: string,
  _tableDataPath?: string
): string | undefined => {
  if (!dataPath) return undefined

  const preview = context.preview!

  const current = preview.attributes[dataPath]

  if (current) return current.dataPath

  const name = preview.prefix + dataPath.replace(".", "")

  const attribute: PreviewAttribute = {
    name: name,
    title: dataPath,
    dataPath: dataPath,
    type: { type: ["String"] },
  }

  preview.attributes[dataPath] = attribute

  return name
}
