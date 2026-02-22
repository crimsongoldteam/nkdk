import { EmptyFileSystem, type LangiumDocument } from "langium"
import { clearDocuments, parseHelper } from "langium/test"
import { createNkdkServices, Form as NkdkForm } from "nkdk-language"
import { afterEach, beforeAll, beforeEach } from "vitest"
import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms/commonObjects/index"
import "~/metadata/forms/elements"
import "~/metadata/systemEnumerations"

import { mockContext } from "./mockContext"

export let nkdkServices: ReturnType<typeof createNkdkServices>
export let nkdkParse: ReturnType<typeof parseHelper<NkdkForm>>
const documentsToClear: LangiumDocument<NkdkForm>[] = []

beforeAll(async () => {
  nkdkServices = createNkdkServices(EmptyFileSystem)
  nkdkParse = parseHelper<NkdkForm>(nkdkServices.Nkdk)
})

beforeEach(() => {
  mockContext.context = {}
})

afterEach(async () => {
  if (documentsToClear.length > 0) {
    clearDocuments(nkdkServices.shared, documentsToClear)
    documentsToClear.length = 0
  }
})

export function registerNkdkDocument(doc: LangiumDocument<NkdkForm>): void {
  documentsToClear.push(doc)
}
