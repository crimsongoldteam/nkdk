import { InputField } from "nkdk-language"
import {
  fullInputField,
  fullInputFieldEnterprise,
  fullInputFieldPartialYAML,
  minimalInputField,
  minimalInputFieldEnterprise,
  minimalInputFieldPartialYAML,
} from "../inputField/__fixtures__/data"

type ElementFixture = {
  group: string
  name: string
  element: Element
  xml: string
  model: object
  yaml: object
  enterprise: object
}

export const ElementFixtures: ElementFixture[] = [
  {
    group: "InputField",
    name: "all fields",
    element: InputField,
    xml: "full.xml",
    model: fullInputField,
    yaml: fullInputFieldPartialYAML,
    enterprise: fullInputFieldEnterprise,
  },
  {
    group: "InputField",
    name: "minimal fields",
    element: InputField,
    xml: "minimal.xml",
    model: minimalInputField,
    yaml: minimalInputFieldPartialYAML,
    enterprise: minimalInputFieldEnterprise,
  },
]
