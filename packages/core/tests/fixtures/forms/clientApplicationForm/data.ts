import { ClientApplicationForm } from "~/metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

// Import test fixtures
export const titleForm: ClientApplicationForm = {
  elementType: FormElementType.ClientApplicationForm,
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    childItems: [],
  },
  title: { items: { ru: "Поле" } },
  childItems: [],
}

export const commandBarForm: ClientApplicationForm = {
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    autofill: false,
    childItems: [],
  },
  elementType: FormElementType.ClientApplicationForm,
  childItems: [],
}

export const itemsForm: ClientApplicationForm = {
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    childItems: [],
  },
  elementType: FormElementType.ClientApplicationForm,
  childItems: [
    {
      name: "ПолеВвода",
      id: "1",
      elementType: FormElementType.InputField,
    },
  ],
}

export const attributesForm: ClientApplicationForm = {
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    childItems: [],
  },
  elementType: FormElementType.ClientApplicationForm,
  childItems: [],
  attributes: [
    {
      name: "Объект",
      id: "1",
      valueType: { type: ["DataProcessorObject.ТестоваяОбработка"] },
      mainAttribute: true,
    },
  ],
}

export const usualGroupForm: ClientApplicationForm = {
  autoCommandBar: {
    id: "-1",
    name: "ФормаКоманднаяПанель",
    elementType: FormElementType.CommandBar,
    childItems: [],
  },
  elementType: FormElementType.ClientApplicationForm,
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
}
