import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"

export interface PictureTestCase {
  name: string
  picture: Picture
  pictureYAML: PictureYAML
  expectedYAML: PictureYAML
  fixture: string | undefined
  importYAML?: boolean
  preview: PictureEnterprise
}

export const pictureTestCases: readonly PictureTestCase[] = [
  {
    name: "standard picture",
    picture: {
      ref: "BusinessProcess",
      type: "StandardPicture",
      loadTransparent: true,
    } as Picture,
    pictureYAML: "БизнесПроцесс" as PictureYAML,
    expectedYAML: "БизнесПроцесс" as PictureYAML,
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
    pictureYAML: "ОбщаяКартинка1" as PictureYAML,
    expectedYAML: "ОбщаяКартинка1" as PictureYAML,
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
    pictureYAML: "Picture.png" as PictureYAML,
    expectedYAML: "Picture.png" as PictureYAML,
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
    pictureYAML: {
      Ссылка: "Picture.png",
      ПрозрачныйФон: "Истина",
      ПрозрачныйПиксель: { x: 10, y: 15 },
    } as PictureYAML,
    expectedYAML: {
      Ссылка: "Picture.png",
      ПрозрачныйФон: "Истина",
      ПрозрачныйПиксель: { x: 10, y: 15 },
    } as PictureYAML,
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
  //   pictureYAML: "ИсторияДанных",
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
  //   pictureYAML: {
  //     Ссылка: "ОбщаяКартинка2",
  //     ПрозрачныйФон: "Истина",
  //     ПрозрачныйПиксель: { x: 0, y: 0 },
  //   } as PictureYAML,
  //   enterpriseExpected: {
  //     Ссылка: "ОбщаяКартинка2",
  //     ПрозрачныйФон: "Истина",
  //     ПрозрачныйПиксель: { x: 0, y: 0 },
  //   } as PictureYAML,
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
  //   pictureYAML: "\\Images\\Logo.png" as PictureYAML,
  //   enterpriseExpected: "\\Images\\Logo.png" as PictureYAML,
  //   fixture: "picture/absolutePath.xml",
  //   preview: { type: "Picture" as const, value: "\\Images\\Logo.png" },
  // },
] as const
