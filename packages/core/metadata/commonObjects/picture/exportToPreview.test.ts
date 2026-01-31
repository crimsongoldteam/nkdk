import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportPictureToPreview } from "./exportToPreview"

describe("exportPictureToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportPictureToPreview(mockСontext, undefined, "StandardPicture")

    expect(result).toBeUndefined()
  })

  it("should return undefined when value is empty string", () => {
    const result = exportPictureToPreview(mockСontext, "", "StandardPicture")

    expect(result).toBeUndefined()
  })

  it("should return PictureEnterprisePreview when value is provided for StandardPicture", () => {
    const result = exportPictureToPreview(mockСontext, "StandardPicture.MyPicture", "StandardPicture")

    expect(result).toEqual({
      type: "StandardPicture",
      value: "StandardPicture.MyPicture",
    })
  })

  it("should return PictureEnterprisePreview when value is provided for CommonPicture", () => {
    const result = exportPictureToPreview(mockСontext, "CommonPicture.MyPicture", "CommonPicture")

    expect(result).toEqual({
      type: "CommonPicture",
      value: "CommonPicture.MyPicture",
    })
  })

  it("should return PictureEnterprisePreview when value is provided for AbsolutePicture", () => {
    const result = exportPictureToPreview(mockСontext, "/path/to/picture.png", "AbsolutePicture")

    expect(result).toEqual({
      type: "AbsolutePicture",
      value: "/path/to/picture.png",
    })
  })
})
