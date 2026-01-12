import {
  FormGroup,
  FormGroupPartialEnterprise,
  FormGroupTypedEnterprise,
} from "~/metadata/forms/elements/formGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullFormGroup: FormGroup = {
  elementType: FormElementType.FormGroup,
  name: "ГруппаФормы",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Группа формы" },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "UsualGroup",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
}

export const fullFormGroupPartialEnterprise: FormGroupPartialEnterprise = {
  Заголовок: "Группа формы",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
}

export const fullFormGroupTypedEnterprise: FormGroupTypedEnterprise = {
  ...fullFormGroupPartialEnterprise,
  Тип: "ГруппаФормы",
}

export const minimalFormGroup: FormGroup = {
  elementType: FormElementType.FormGroup,
  name: "ГруппаФормы",
}

export const minimalFormGroupPartialEnterprise: FormGroupPartialEnterprise = {}

export const minimalFormGroupTypedEnterprise: FormGroupTypedEnterprise = {
  Тип: "ГруппаФормы",
}
