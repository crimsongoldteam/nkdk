import { expect, beforeEach, it } from "vitest"
import { container } from "tsyringe"
import { IFormatter, IFormatterParams, WrapInGroupStrategy } from "@/metadata/forms/interfaces"
import { ContainerFactory } from "@/metadata/forms/elements"
import { DITokens } from "@/symbols"
import { I8nText } from "@/metadata/i8n/i8nText"
import { IClientApplicationForm } from "@/metadata/forms/elements/сlientApplicationForm/interfaces"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

let formatter: IFormatter
let form: IClientApplicationForm

beforeEach(() => {
  container.clearInstances()
  new ContainerFactory().register()

  form = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)

  formatter = container.resolve(form.formatterToken)
})

it("should format form header", () => {
  form.title = { ru: "Форма" } as I8nText

  const result = formatter.render(form, mockParams)

  expect(result).toEqual(["--- Форма ---"])
})
