import { FormElementType, FormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { Button, ButtonEnterprise, ButtonXML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupEnterprise, ButtonGroupXML } from "../../elements/buttonGroup/types"
import { Popup, PopupEnterprise, PopupXML } from "../../elements/popup/types"

export type ButtonGroupChildItem = Button | ButtonGroup | Popup
export type ButtonGroupChildItems = ButtonGroupChildItem[]

export type ButtonGroupChildItemXML = ButtonXML | ButtonGroupXML | PopupXML
export type ButtonGroupChildItemRecordXML = Record<FormElementType, ButtonGroupChildItemXML>
export type ButtonGroupChildItemsXML = ButtonGroupChildItemRecordXML | ButtonGroupChildItemRecordXML[]

export type ButtonGroupChildItemEnterprise = (ButtonEnterprise | ButtonGroupEnterprise | PopupEnterprise) & {
  Тип: keyof Pick<typeof FormElementTypeFromEnterprise, "Кнопка" | "ГруппаКнопок" | "Подменю">
}
export type ButtonGroupChildItemsEnterprise = Record<string, ButtonGroupChildItemEnterprise>
