import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/fromNKDK"
import { FromNKDKResult, NkdkChildItem } from "~/metadata/orchestration/formElement/fromNKDK/types"

export const importChildItemsFromNKDK = <NkdkItem extends NkdkChildItem>(params: {
  context: ConfigurationContext
  value: NkdkItem[]
}): FromNKDKResult<NkdkItem>[] => {
  const { context, value } = params

  const result = [] as FromNKDKResult<NkdkItem>[]

  for (const item of value) {
    const resultItem = importElementFromNKDK({ context, value: item })
    result.push(resultItem)
  }

  return result
}
