import { PreviewAttributes } from "~/metadata/forms/clientApplicationForm/base/types"

export interface GetAttributeNameFixture {
  name: string
  attributes: PreviewAttributes
  dataPath: string | undefined
  expected: PreviewAttributes | undefined
}

export const getAttributeNameFixtures: GetAttributeNameFixture[] = [
  {
    name: "undefined",
    attributes: {},
    dataPath: undefined,
    expected: undefined,
  },
]
