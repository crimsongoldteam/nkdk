import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportPictureToPreview } from "./exportToPreview"

describe("exportPictureToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportPictureToPreview(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when ref is empty string", () => {
    const result = exportPictureToPreview(mockСontext, {
      ref: "",
      type: "StandardPicture",
      loadTransparent: false,
    })

    expect(result).toBeUndefined()
  })

  it("should return PictureEnterprisePreview when value is provided for StandardPicture", () => {
    const result = exportPictureToPreview(mockСontext, {
      ref: "StandardPicture.MyPicture",
      type: "StandardPicture",
      loadTransparent: false,
    })

    expect(result).toEqual({
      type: "StandardPicture",
      value: "StandardPicture.MyPicture",
    })
  })

  it("should return PictureEnterprisePreview when value is provided for CommonPicture", () => {
    const result = exportPictureToPreview(mockСontext, {
      ref: "CommonPicture.MyPicture",
      type: "CommonPicture",
      loadTransparent: false,
    })

    expect(result).toEqual({
      type: "CommonPicture",
      value: "CommonPicture.MyPicture",
    })
  })

  it("should return PictureEnterprisePreview when value is provided for AbsolutePicture", () => {
    const result = exportPictureToPreview(mockСontext, {
      ref: "Picture.png",
      type: "AbsolutePicture",
      loadTransparent: false,
    })

    expect(result).toEqual({
      type: "AbsolutePicture",
      value: "Picture.png",
    })
  })
})
