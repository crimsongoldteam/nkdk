import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"

export const withoutTextI8nText: I8nText = { items: { ru: "" } }

export const escapedContentI8nText: I8nText = { items: { ru: "<Текст с экранированным символом>" } }

export const escapedContentI8nTextEnterprise: I8nTextEnterprise = {
  ru: "<Текст с экранированным символом>",
}
