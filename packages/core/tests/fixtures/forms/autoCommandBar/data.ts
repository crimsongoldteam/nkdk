import { IFormatElementResult } from "~/format/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullCommandBarEnterprise } from "../commandBar/data"
import { fullFormGroup } from "../formGroup/data"

export const fullAutoCommandBar: AutoCommandBar = {
  ...fullFormGroup,
  name: "КакойТоЭлементКоманднаяПанель",
}

export const fullAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  Имя: "КакойТоЭлементКоманднаяПанель",
  ...fullCommandBarEnterprise,
}

export const minimalAutoCommandBar: AutoCommandBar = {
  elementType: "AutoCommandBar" as FormElementType,
  name: "АвтоКоманднаяПанель",
  childItems: [],
}

export const minimalAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  Имя: "АвтоКоманднаяПанель",
}

export interface AutoCommandBarStructureFixture {
  name: string
  element: AutoCommandBar
  structured: IFormatElementResult
}

export const autoCommandBarStructureFixturesTable: AutoCommandBarStructureFixture[] = [
  {
    name: "with buttons",
    element: {
      name: "AutoCommandBar",
      elementType: "AutoCommandBar" as FormElementType,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Button1",
          title: { items: { ru: "Button1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button2",
          title: { items: { ru: "Button2" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button3",
          title: { items: { ru: "Button3" } },
        },
      ],
    },
    structured: {
      strings: ["<Button1|Button2|Button3>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
