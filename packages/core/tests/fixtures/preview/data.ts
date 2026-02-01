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
    expectedDataPath: "prefixTest",
    expectedAttributes: {
      Test: { name: "prefixTest", title: "Test", dataPath: "prefixTest", type: { type: ["String"] } },
    },
  },
  {
    name: "return dataPath if attribute already exists",
    attributes: {
      ОбъектTest: {
        name: "prefixОбъектTest",
        title: "Test title",
        dataPath: "prefixОбъектTest",
        type: { type: ["String"] },
      },
    },
    dataPath: "Объект.Test",
    expectedDataPath: "Test",
    expectedAttributes: {
      ОбъектTest: {
        name: "prefixОбъектTest",
        title: "Test title",
        dataPath: "prefixОбъектTest",
        type: { type: ["String"] },
      },
      "Объект.Test": {
        name: "prefixОбъектTest1",
        title: "Test",
        dataPath: "prefixОбъектTest1",
        type: { type: ["String"] },
      },
    },
  },
]
