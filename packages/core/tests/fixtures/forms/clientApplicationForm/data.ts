import { ClientApplicationForm } from "~/metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullClientApplicationForm: ClientApplicationForm = {
  elementType: FormElementType.ClientApplicationForm,
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    autofill: false,
    childItems: [],
  },
  title: { items: { ru: "Поле" } },
  childItems: [
    {
      name: "Группа",
      id: "1",
      elementType: FormElementType.UsualGroup,
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: FormElementType.InputField,
        },
      ],
    },
  ],
  attributes: [
    {
      name: "Объект",
      id: "1",
      valueType: { type: ["DataProcessorObject.ТестоваяОбработка"] },
      mainAttribute: true,
    },
  ],
}

export const minimalClientApplicationForm: ClientApplicationForm = {
  elementType: FormElementType.ClientApplicationForm,
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    childItems: [],
  },
  childItems: [],
}
