import { Picture, PictureEnterprise } from "~/metadata/commonObjects/picture/types"

export interface PictureTestCase {
  name: string
  picture: Picture
  pictureEnterprise: PictureEnterprise
  enterpriseExpected: PictureEnterprise
  fixture: string | undefined
  enterpriseImport?: boolean
}

export const pictureTestCases: readonly PictureTestCase[] = [
  {
    name: "standard picture",
    picture: {
      ref: "BusinessProcess",
      type: "StandardPicture",
      loadTransparent: true,
    } as Picture,
    pictureEnterprise: "БизнесПроцесс" as PictureEnterprise,
    enterpriseExpected: "БизнесПроцесс" as PictureEnterprise,
    fixture: "picture/standart.xml",
  },
  {
    name: "common picture",
    picture: {
      ref: "ОбщаяКартинка1",
      type: "CommonPicture",
      loadTransparent: false,
    } as Picture,
    pictureEnterprise: "ОбщаяКартинка1" as PictureEnterprise,
    enterpriseExpected: "ОбщаяКартинка1" as PictureEnterprise,
    fixture: "picture/common.xml",
  },
  {
    name: "absolute picture",
    picture: {
      ref: "Picture.png",
      type: "AbsolutePicture",
      loadTransparent: false,
    } as Picture,
    pictureEnterprise: "Picture.png" as PictureEnterprise,
    enterpriseExpected: "Picture.png" as PictureEnterprise,
    fixture: "picture/absolute.xml",
    enterpriseImport: false,
  },
  {
    name: "absolute picture with transparent",
    picture: {
      ref: "Picture.png",
      type: "AbsolutePicture",
      loadTransparent: true,
      transparentPixel: { x: 10, y: 15 },
    } as Picture,
    pictureEnterprise: {
      Ссылка: "Picture.png",
      ПрозрачныйФон: "Ложь",
      ПрозрачныйПиксель: { x: 10, y: 15 },
    } as PictureEnterprise,
    enterpriseExpected: "Picture.png" as PictureEnterprise,
    fixture: "picture/absoluteWithTransparent.xml",
    enterpriseImport: false,
  },
] as const
