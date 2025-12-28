import { describe, expect, it } from "vitest"
import {
  commandWithParameterUseMode,
  commandWithParameterUseModeEnterprise,
  commandWithUserGroup,
  commandWithUserGroupEnterprise,
  commandWithoutSynonym,
  commandWithoutSynonymEnterprise,
  twoCommands,
  twoCommandsEnterprise,
} from "~/tests/fixtures/metadataCommand/fixtures"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataCommandFromEnterprise, importMetadataCommandsFromEnterprise } from "./importFromEnterprise"

describe("importMetadataCommandFromEnterprise", () => {
  it("should import metadata command from enterprise", () => {
    const result = importMetadataCommandFromEnterprise(
      mockСontext,
      commandWithParameterUseModeEnterprise,
      "ТестоваяКоманда"
    )

    expect(result).toEqual(commandWithParameterUseMode)
  })

  it("should import with user group", () => {
    const result = importMetadataCommandFromEnterprise(mockСontext, commandWithUserGroupEnterprise, "ТестоваяКоманда")

    expect(result).toEqual(commandWithUserGroup)
  })

  it("should import without synonym when synonym is omitted", () => {
    const result = importMetadataCommandFromEnterprise(mockСontext, commandWithoutSynonymEnterprise, "ТестоваяКоманда")

    expect(result).toEqual(commandWithoutSynonym)
  })

  it("should import two commands from enterprise", () => {
    const result = importMetadataCommandsFromEnterprise(mockСontext, twoCommandsEnterprise)

    expect(result).toEqual(twoCommands)
  })
})
