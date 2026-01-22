import { Picture, PictureEnterprise } from "~/metadata/commonObjects/picture/types"

//#region Standard Picture BusinessProcess
export const standardPicture: Picture = {
  ref: "BusinessProcess",
  type: "StandardPicture",
  loadTransparent: true,
}

export const standardPictureEnterprise = `БизнесПроцесс`
//#endregion

//#region Common Picture
export const commonPicture: Picture = {
  ref: "ОбщаяКартинка1",
  type: "CommonPicture",
  loadTransparent: true,
}

export const commonPictureEnterprise = `ОбщаяКартинка1`
//#endregion

//#region Common Picture Without Transparent
export const coommomPictureWithoutTransparent: Picture = {
  ref: "Картинка1",
  type: "CommonPicture",
  loadTransparent: false,
}

export const coommomPictureWithoutTransparentEnterprise: PictureEnterprise = {
  Ссылка: "Картинка1",
  ПрозрачныйФон: "Ложь",
}

//#endregion

//#region Standard Picture Without Transparent
export const standardPictureWithoutTransparent: Picture = {
  ref: "Report",
  type: "StandardPicture",
  loadTransparent: false,
}

export const standardPictureWithoutTransparentEnterprise: PictureEnterprise = {
  Ссылка: "Отчет",
  ПрозрачныйФон: "Ложь",
}
//#endregion

//#region Absolute Picture

export const absolutePicture: Picture = {
  ref: "Picture.png",
  type: "AbsolutePicture",
  loadTransparent: false,
}

export const absolutePictureEnterprise: PictureEnterprise = {
  Ссылка: "Picture.png",
  ПрозрачныйФон: "Ложь",
}

//#endregion
