import { Picture, PictureEnterprise, PicturePreview } from "~/metadata/commonObjects/picture/types"

export interface PictureTestCase {
  name: string
  picture: Picture
  pictureEnterprise: PictureEnterprise
  enterpriseExpected: PictureEnterprise
  fixture: string | undefined
  enterpriseImport?: boolean
  preview: PicturePreview
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
    preview: { Type: "Picture" as const, Value: "PictureLib.BusinessProcess" },
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
    preview: { Type: "Picture" as const, Value: "CommonPictures.ОбщаяКартинка1" },
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
    preview: { Type: "AbsolutePicture" as const },
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
      ПрозрачныйФон: "Истина",
      ПрозрачныйПиксель: { x: 10, y: 15 },
    } as PictureEnterprise,
    enterpriseExpected: {
      Ссылка: "Picture.png",
      ПрозрачныйФон: "Истина",
      ПрозрачныйПиксель: { x: 10, y: 15 },
    } as PictureEnterprise,
    fixture: "picture/absoluteWithTransparent.xml",
    preview: { Type: "AbsolutePicture" },
  },
  // {
  //   name: "standard picture with transparent",
  //   picture: {
  //     ref: "HistoryMode",
  //     type: "StandardPicture",
  //     loadTransparent: true,
  //   } as Picture,
  //   pictureEnterprise: "ИсторияДанных",
  //   enterpriseExpected: "ИсторияДанных",
  //   fixture: "picture/standardWithTransparent.xml",
  //   preview: { type: "Picture", value: "PictureLib.HistoryMode" },
  // },
  // {
  //   name: "common picture with transparent",
  //   picture: {
  //     ref: "ОбщаяКартинка2",
  //     type: "CommonPicture",
  //     loadTransparent: true,
  //     transparentPixel: { x: 0, y: 0 },
  //   } as Picture,
  //   pictureEnterprise: {
  //     Ссылка: "ОбщаяКартинка2",
  //     ПрозрачныйФон: "Истина",
  //     ПрозрачныйПиксель: { x: 0, y: 0 },
  //   } as PictureEnterprise,
  //   enterpriseExpected: {
  //     Ссылка: "ОбщаяКартинка2",
  //     ПрозрачныйФон: "Истина",
  //     ПрозрачныйПиксель: { x: 0, y: 0 },
  //   } as PictureEnterprise,
  //   fixture: "picture/commonWithTransparent.xml",
  //   preview: { type: "Picture" as const, value: "CommonPictures.ОбщаяКартинка2" },
  // },
  // {
  //   name: "absolute picture with path",
  //   picture: {
  //     ref: "\\Images\\Logo.png",
  //     type: "AbsolutePicture",
  //     loadTransparent: false,
  //   } as Picture,
  //   pictureEnterprise: "\\Images\\Logo.png" as PictureEnterprise,
  //   enterpriseExpected: "\\Images\\Logo.png" as PictureEnterprise,
  //   fixture: "picture/absolutePath.xml",
  //   preview: { type: "Picture" as const, value: "\\Images\\Logo.png" },
  // },
] as const
