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

//#region XML Fixtures
export const withoutTransparentPicture: Picture = {
  ref: "Картинка1",
  type: "CommonPicture",
  loadTransparent: false,
}

export const withoutTransparentPictureEnterprise: PictureEnterprise = {
  Ссылка: "Картинка1",
  Прозрачность: false,
}

//#endregion
