import { DendrogramField, DendrogramFieldEnterprise } from "~/metadata/forms/elements/dendrogramField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullDendrogramField: DendrogramField = {
  elementType: FormElementType.DendrogramField,
  name: "ПолеДендрограммы",
  id: "1",
  title: {
    items: { ru: "Поле дендрограммы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
  },
}

export const fullDendrogramFieldEnterprise: DendrogramFieldEnterprise = {
  Заголовок: "Поле дендрограммы",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
  },
}

export const minimalDendrogramField: DendrogramField = {
  elementType: FormElementType.DendrogramField,
  name: "ПолеДендрограммы",
  id: "1",
}

export const minimalDendrogramFieldEnterprise: DendrogramFieldEnterprise = {}

