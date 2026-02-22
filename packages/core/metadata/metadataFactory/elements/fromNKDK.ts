import { ConfigurationContext } from "~/metadata/context/types"
import { FromNKDKResult, importFromNKDKFn, NkdkChildItem } from "./fromNKDKFactory/types"

export const importElementFromNKDK = <NkdkItem extends NkdkChildItem>(params: {
  context: ConfigurationContext
  value: NkdkItem
}): FromNKDKResult<NkdkItem> => {
  const { context, value } = params

  const fn = importFromNKDKFn[value.$type]
  if (!fn) {
    throw new Error(`Unknown child item type: ${value.$type}`)
  }

  const result = fn({ context, source: value as never })

  return result as FromNKDKResult<NkdkItem>
}
