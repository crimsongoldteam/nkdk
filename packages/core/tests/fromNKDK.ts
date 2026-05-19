import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, Form as NkdkForm } from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "~/metadata/forms/clientApplicationForm/fromNKDK"

let nkdkParseCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

const getNkdkParse = (): ReturnType<typeof parseHelper<NkdkForm>> => {
  if (!nkdkParseCached) {
    const nkdkServices = createNkdkServices(EmptyFileSystem)
    nkdkParseCached = parseHelper<NkdkForm>(nkdkServices.Nkdk)
  }
  return nkdkParseCached
}

// /** Конвертирует имена в формате структуры {Name} в NKDK-формат %Name */
// const structureToNkdkString = (s: string): string => s.replace(/\{([^}]+)\}/g, "%$1")

export const testimportElementFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const form = await importFormFromNKDK(context, input)

  return form?.childItems[0]
}

export const testimportFormAutoCommandBarFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const form = await importFormFromNKDK(context, input)
  return form?.autoCommandBar
}

// export const testimportTableFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
//   const rawString = Array.isArray(input) ? input.join("\n") : input
//   const inputString = structureToNkdkString(rawString)
//   const result = await nkdkParse(inputString)

//   const parsed = importClientApplicationFromFromNKDK({
//     context: context,
//     value: result?.parseResult.value,
//   })

//   return parsed?.childItems?.find(
//     (item) => (item as { itemType?: string })?.itemType === "Table"
//   )
// }

export const importFormFromNKDK = async (context: ConfigurationContext, input: string | string[]) => {
  const rawString = Array.isArray(input) ? input.join("\n") : input
  const nkdkParse = getNkdkParse()
  const result = await nkdkParse(rawString)

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

  return parsed
}
