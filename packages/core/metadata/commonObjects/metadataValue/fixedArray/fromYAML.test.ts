import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  singleStringFixedArray,
  singleStringFixedArrayYAML,
  twoRefsFixedArray,
  twoRefsFixedArrayYAML,
} from "./__fixtures__/data"
import { importFixedArrayFromYAML } from "./fromYAML"

describe("importFixedArrayFromYAML", () => {
  it("should import fixed array with two refs from YAML", () => {
    const result = importFixedArrayFromYAML(mockContext, twoRefsFixedArrayYAML)
    expect(result).toEqual(twoRefsFixedArray)
  })

  it("should import fixed array with single string from YAML", () => {
    const result = importFixedArrayFromYAML(mockContext, singleStringFixedArrayYAML)
    expect(result).toEqual(singleStringFixedArray)
  })
})
