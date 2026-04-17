import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  singleStringFixedArray,
  singleStringFixedArrayYAML,
  twoRefsFixedArray,
  twoRefsFixedArrayYAML,
} from "./__fixtures__/data"
import { exportFixedArrayToYAML } from "./toYAML"

describe("exportFixedArrayToYAML", () => {
  it("should export fixed array with two refs to YAML", () => {
    const result = exportFixedArrayToYAML(mockContext, twoRefsFixedArray)
    expect(result).toEqual(twoRefsFixedArrayYAML)
  })

  it("should export fixed array with single string to YAML", () => {
    const result = exportFixedArrayToYAML(mockContext, singleStringFixedArray)
    expect(result).toEqual(singleStringFixedArrayYAML)
  })
})
