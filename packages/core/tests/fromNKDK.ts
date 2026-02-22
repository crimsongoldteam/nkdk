import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "~/metadata/forms/clientApplicationForm/fromNKDK"
import { nkdkParse } from "./setupTests"

export const testImportElementFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const inputString = Array.isArray(input) ? input.join("\n") : input
  const result = await nkdkParse(inputString)

  const parsed = importClientApplicationFromFromNKDK({
    context: context,
    value: result?.parseResult.value,
  })

  return parsed?.childItems[0]
}
