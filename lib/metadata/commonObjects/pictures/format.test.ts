import { expect, it } from "vitest"
import { Picture } from "./types"
import { formatPicture } from "./format"

it("should format standard picture", () => {
  const data: Picture = {
    ref: "BusinessProcess",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `БизнесПроцесс`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})

it("should format standard picture Print", () => {
  const data: Picture = {
    ref: "Print",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `Печать`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})

it("should format common picture", () => {
  const data: Picture = {
    ref: "ОбщаяКартинка1",
    type: "CommonPicture",
    loadTransparent: true,
  }

  const expectedResult = `ОбщаяКартинка1`

  const result = formatPicture(data)

  expect(result).toEqual(expectedResult)
})
