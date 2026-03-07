import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, Form as NkdkForm } from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "~/metadata/forms/clientApplicationForm/fromNKDK"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"

let parseHelperCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

function getNkdKParse(): ReturnType<typeof parseHelper<NkdkForm>> {
  if (!parseHelperCached) {
    const services = createNkdkServices(EmptyFileSystem)
    parseHelperCached = parseHelper<NkdkForm>(services.Nkdk)
  }
  return parseHelperCached
}

export const parseFormFromNkdKString = async (
  context: ConfigurationContext,
  nkdkString: string
): Promise<ClientApplicationForm | undefined> => {
  const nkdkParse = getNkdKParse()
  const result = await nkdkParse(nkdkString)
  if (!result || result.parseResult.parserErrors.length > 0) {
    return undefined
  }
  return importClientApplicationFromFromNKDK({
    context,
    value: result.parseResult.value,
  })
}
