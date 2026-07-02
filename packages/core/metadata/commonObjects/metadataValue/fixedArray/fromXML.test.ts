import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { importContentFromXML } from "../../../../xml/import/importer"
import {
  refsWithNilFixedArray,
  refsWithNilFixedArrayXML,
  singleStringFixedArray,
  singleStringFixedArrayXML,
  twoRefsFixedArray,
  twoRefsFixedArrayXML,
} from "./__fixtures__/data"
import { importFixedArrayFromXML } from "./fromXML"

const parseXML = (xml: string) => {
  const wrapped = `<root>${xml}</root>`
  const parsed = importContentFromXML<{ root: { Value: any } }>(wrapped)
  return parsed.root.Value
}

describe("importFixedArrayFromXML", () => {
  it("should import fixed array with two refs", () => {
    const result = importFixedArrayFromXML(mockContextFromXML(), parseXML(twoRefsFixedArrayXML))
    expect(result).toEqual(twoRefsFixedArray)
  })

  it("should import fixed array with single string element", () => {
    const result = importFixedArrayFromXML(mockContextFromXML(), parseXML(singleStringFixedArrayXML))
    expect(result).toEqual(singleStringFixedArray)
  })

  it("should import fixed array with nil element", () => {
    const result = importFixedArrayFromXML(mockContextFromXML(), parseXML(refsWithNilFixedArrayXML))
    expect(result).toEqual(refsWithNilFixedArray)
  })
})
