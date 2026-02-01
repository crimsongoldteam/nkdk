import { PreviewAttributes } from "~/metadata/forms/clientApplicationForm/base/types"

export interface GetAttributeNameFixture {
  name: string
  attributes: PreviewAttributes
  dataPath: string | undefined
  expectedDataPath: string | undefined
  expectedAttributes: PreviewAttributes
}

export const getAttributeNameFixtures: GetAttributeNameFixture[] = [
  {
    name: "return undefined if dataPath is undefined",
    attributes: {},
    dataPath: undefined,
    expectedDataPath: undefined,
    expectedAttributes: {},
  },
  {
    name: "return dataPath if attribute doesn't exists",
    attributes: {},
    dataPath: "Test",
    expectedDataPath: "p_Test",
    expectedAttributes: {
      Test: { name: "p_Test", title: "Test", dataPath: "p_Test", type: { type: ["String"] } },
    },
  },
  {
    name: "return dataPath if attribute already exists",
    attributes: {
      ОбъектTest: { name: "p_ОбъектTest", title: "Test title", dataPath: "p_ОбъектTest", type: { type: ["String"] } },
    },
    dataPath: "Объект.Test",
    expectedDataPath: "Test",
    expectedAttributes: {
      ОбъектTest: { name: "p_ОбъектTest", title: "Test title", dataPath: "p_ОбъектTest", type: { type: ["String"] } },
      "Объект.Test": { name: "p_ОбъектTest1", title: "Test", dataPath: "p_ОбъектTest1", type: { type: ["String"] } },
    },
  },
]
