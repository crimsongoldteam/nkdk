import { expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { exportPictureToEnterprise } from "./exportToEnterprise"
import { Picture } from "./types"

it("should format standard picture", () => {
  const data: Picture = {
    ref: "BusinessProcess",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `БизнесПроцесс`

  const result = exportPictureToEnterprise(mockСontext, data)

  expect(result).toEqual(expectedResult)
})

it("should format standard picture Print", () => {
  const data: Picture = {
    ref: "Print",
    type: "StandardPicture",
    loadTransparent: true,
  }

  const expectedResult = `Печать`

  const result = exportPictureToEnterprise(mockСontext, data)

  expect(result).toEqual(expectedResult)
})

it("should format common picture", () => {
  const data: Picture = {
    ref: "ОбщаяКартинка1",
    type: "CommonPicture",
    loadTransparent: true,
  }

  const expectedResult = `ОбщаяКартинка1`

  const result = exportPictureToEnterprise(mockСontext, data)

  expect(result).toEqual(expectedResult)
})
