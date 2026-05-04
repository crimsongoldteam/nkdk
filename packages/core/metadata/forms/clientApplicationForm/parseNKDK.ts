import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "./fromNKDK"
import type { ClientApplicationForm } from "./types"

let parseHelperCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

function getNkdkParse(): ReturnType<typeof parseHelper<NkdkForm>> {
  if (!parseHelperCached) {
    const services = createNkdkServices(EmptyFileSystem)
    parseHelperCached = parseHelper<NkdkForm>(services.Nkdk)
  }
  return parseHelperCached
}

export async function parseClientApplicationFormFromNKDK(
  context: ConfigurationContext,
  nkdkText: string,
): Promise<ClientApplicationForm | undefined> {
  const parsed = await getNkdkParse()(nkdkText)
  if (!parsed || parsed.parseResult.parserErrors.length > 0) return undefined
  return importClientApplicationFromFromNKDK({
    context,
    value: parsed.parseResult.value,
  })
}
