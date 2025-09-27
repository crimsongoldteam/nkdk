import { container } from "tsyringe"

import { InputField } from "./inputField/element"
import "./inputField/formatter"
import "./inputField/XMLImportRules"

import { ClientApplicationForm } from "./сlientApplicationForm/element"
import "./сlientApplicationForm/formatter"
import "./сlientApplicationForm/XMLImportRules"

export { InputField, ClientApplicationForm }

export class ContainerFactory {
  public register() {
    container.clearInstances()
  }
}
