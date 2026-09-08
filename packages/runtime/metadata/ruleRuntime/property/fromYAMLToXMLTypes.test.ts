import { expectTypeOf, it } from "vitest"
import type { YAMLToXMLNestedRule, YAMLToXMLOutputRequest } from "./fromYAMLToXMLTypes"
import type { shouldProcessProperty } from "./helpers"

it("не принимает прежний XML в договорах обычного экспорта", () => {
  expectTypeOf<YAMLToXMLOutputRequest>().not.toHaveProperty("referenceXML")
  type ExternalInput = Parameters<Extract<YAMLToXMLNestedRule, { kind: "externalFile" }>["convert"]>[0]
  expectTypeOf<ExternalInput>().not.toHaveProperty("referenceXML")
  expectTypeOf<Parameters<typeof shouldProcessProperty>[0]>().not.toHaveProperty("referenceMetadata")
})
