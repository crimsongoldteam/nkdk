import { describe, expect, it } from "vitest"
import { MetadataIntegrationServiceChannelRules } from "../metadataIntegrationServiceChannel/rules"
import { MetadataExternalDataSourceCubeRules } from "../metadataExternalDataSourceCube/rules"
import { MetadataExternalDataSourceDimensionTableRules } from "../metadataExternalDataSourceDimensionTable/rules"
import { MetadataExternalDataSourceTableRules } from "../metadataExternalDataSourceTable/rules"

describe("InternalInfo rules contract", () => {
  it.each([
    MetadataIntegrationServiceChannelRules,
    MetadataExternalDataSourceCubeRules,
    MetadataExternalDataSourceDimensionTableRules,
    MetadataExternalDataSourceTableRules,
  ])("восстанавливает InternalInfo %s без XML-референса", (rule) => {
    expect(rule.properties.internalInfo).toMatchObject({
      type: "InternalInfo",
      exportWithoutReferenceXML: true,
    })
  })
})
