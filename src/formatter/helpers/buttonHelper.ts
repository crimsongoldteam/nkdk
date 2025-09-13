import { ButtonElement } from "@/elements/buttonElement"

export const getCaption = (element: ButtonElement, isMenu = false): string => {
  let textPicture: string | undefined = element.getProperty("Картинка") as string | undefined
  let textTitle = element.getProperty("Заголовок") as string | undefined
  const picturePosition = element.getProperty("ПоложениеКартинки") ?? "Лево"

  if (textPicture) {
    textPicture = "@" + textPicture
  }

  if (isMenu && textTitle) {
    textPicture = undefined
  }

  if (textPicture === undefined) {
    return textTitle ?? ""
  }

  if (textTitle === undefined) {
    return textPicture
  }

  if (picturePosition === "Лево") {
    return textPicture + " " + textTitle
  }

  return textTitle + " " + textPicture
}
