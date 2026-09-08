import { describe, expect, it } from "vitest"
import { readHelpPageLanguages } from "./xmlPages"

describe("страницы XML-справки", () => {
  it.each([
    ["<Help/>", []],
    ["<Help><Page>ru</Page></Help>", ["ru"]],
    ["<Help><Page>ru</Page><Page>en</Page></Help>", ["ru", "en"]],
    ["<Help><Page><![CDATA[ru]]></Page><Page>ru</Page></Help>", ["ru", "ru"]],
    ["<Help><Page/></Help>", []],
    ["<Help><Page xsi:nil=\"true\"/></Help>", []],
    ["<Help><Page><Nested>ru</Nested></Page></Help>", []],
    ["<Help><Page>ru</Page></Help><Help><Page>en</Page></Help>", []],
  ])("читает %s", (xml, expected) => {
    expect(readHelpPageLanguages(xml)).toEqual(expected)
  })
})
