import { Page, PageEnterprise } from "~/metadata/forms/elements/page/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPage: Page = {
  elementType: FormElementType.Page,
  name: "Страница",
  id: "1",
  childItems: [],
  title: {
    items: { ru: "Страница" },
  },
}

export const fullPageEnterprise: PageEnterprise = {
  Заголовок: "Страница",
}

export const minimalPage: Page = {
  elementType: FormElementType.Page,
  name: "Страница",
  id: "1",
  childItems: [],
}

export const minimalPageEnterprise: PageEnterprise = {}

