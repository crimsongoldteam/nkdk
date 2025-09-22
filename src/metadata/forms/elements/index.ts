import { container } from "tsyringe"

import { InputField } from "./inputField/element"
import "./inputField/formatter"
import "./inputField/properties"
import "./inputField/xmlTransform"

export { InputField }

export class ContainerFactory {
  public register() {
    container.clearInstances()
  }
}
