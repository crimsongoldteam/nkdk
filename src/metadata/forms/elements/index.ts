import { container } from "tsyringe"

import { InputField } from "./inputField/element"
import "./inputField/formatter"
import "./inputField/properties"
import "./inputField/XMLTransform"

import { ClientApplicationForm } from "./сlientApplicationForm/element"
import "./сlientApplicationForm/XMLImportRules"

export { InputField, ClientApplicationForm }

export class ContainerFactory {
  public register() {
    container.clearInstances()
  }
}
