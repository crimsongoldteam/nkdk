import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "~/metadata/forms/clientApplicationForm/fromNKDK"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { nkdkParse } from "./setupTests"

/** Конвертирует имена в формате структуры {Name} в NKDK-формат %Name */
const structureToNkdkString = (s: string): string => s.replace(/\{([^}]+)\}/g, "%$1")

export const testImportElementFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const rawString = Array.isArray(input) ? input.join("\n") : input
  const inputString = structureToNkdkString(rawString)
  const result = await nkdkParse(inputString)

  if (!result) {
    throw new Error("Failed to parse input")
  }

  const parsed = importClientApplicationFromFromNKDK({
    context: context,
    value: result?.parseResult.value,
  })

  if (result.parseResult.parserErrors.length > 0) {
    throw new Error(`Parser errors: ${result.parseResult.parserErrors.join("\n")}`)
  }

  return parsed?.childItems[0]
}

export const testImportTableFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const rawString = Array.isArray(input) ? input.join("\n") : input
  const inputString = structureToNkdkString(rawString)
  const result = await nkdkParse(inputString)

  const parsed = importClientApplicationFromFromNKDK({
    context: context,
    value: result?.parseResult.value,
  })

  return parsed?.childItems?.find(
    (item) => (item as { itemType?: string })?.itemType === CollectionFormElementType.Table
  )
}
