import "reflect-metadata"

import { ContainerFactory } from "@/metadata/forms/elements"
import { IInputField } from "@/metadata/forms/elements/inputField/interfaces"
import { DITokens } from "@/symbols"
import { XMLImporter } from "@/xml/import/importer"
import { container } from "tsyringe"
import { beforeEach, expect, it } from "vitest"

const mockInput = `<InputField name="ИмяПоля">
    <Title>
        <v8:item>
            <v8:lang>ru</v8:lang>
            <v8:content>Поле</v8:content>
        </v8:item>
    </Title>
</InputField>`

beforeEach(() => {
  new ContainerFactory().register()
})

it("should import from XML", () => {
  const input = container.resolve(XMLImporter).import<IInputField>(mockInput, DITokens.InputField.XMLImportRules)

  expect(input.title).toEqual({ ru: "Поле" })
  expect(input.name).toEqual("ИмяПоля")
})
