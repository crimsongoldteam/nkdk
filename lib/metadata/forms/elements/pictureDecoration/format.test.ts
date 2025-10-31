import { it, expect } from "vitest"
import { ZElementType } from "../types"
import { TPictureDecoration } from "./types"
import { formatPictureDecoration } from "./format"

it("should format picture decoration", () => {
  const element: TPictureDecoration = {
    elementType: ZElementType.enum.PictureDecoration,
    name: "ИмяПоля",
    id: "1",
  }

  const expectedResult = ["@Печать {ИмяПоля"]

  const result = formatPictureDecoration(element as TPictureDecoration, {})

  expect(result).toEqual(expectedResult)
})
