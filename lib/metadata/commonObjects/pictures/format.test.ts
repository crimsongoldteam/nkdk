import { expect, it } from "vitest"
import { TPicture } from "./types"
import { formatPicture } from "./format"

it("should format standard picture", () => {
  const data: TPicture = {
    ref: "BusinessProcess",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `БизнесПроцесс`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})

it("should format standard picture Print", () => {
  const data: TPicture = {
    ref: "Print",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `Печать`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})

it("should format common picture", () => {
  const data: TPicture = {
    ref: "ОбщаяКартинка1",
    type: "CommonPicture",
    loadTransparent: true,
  }

  const expectedResult = `ОбщаяКартинка1`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})
