import { importMetadataItemFromXML, MetadataItemRule } from "../../metadata/orchestration"
import { mockContextFromXML } from "../mockContext"
import { readAndParseXMLFixture } from "../readFixtureXML"

type Params = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  forReference?: boolean
}

export const testImportAppliedObjectFromXML = <T>(params: Params): T | undefined => {
  const { rule, importMetaUrl, fixture, forReference = false } = params
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(importMetaUrl, fixture)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference }),
    rule,
    xml: parsed.MetaDataObject,
  }) as T | undefined
}
