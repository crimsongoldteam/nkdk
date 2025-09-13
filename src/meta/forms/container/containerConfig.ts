import "reflect-metadata"
import { container } from "tsyringe"
import { DataPathNameStrategy } from "../mixins/formAttributeableMixin"
import { InputFieldElement } from "../elements/inputFieldElement"
import { IDataPathNameStrategy } from "../mixins/interfaces"
import { IInputFieldElement } from "../interfaces"

/**
 * Настройка DI контейнера для форм
 */
export function configureFormContainer(): void {
  container.register<IDataPathNameStrategy>("IDataPathNameStrategy", {
    useClass: DataPathNameStrategy,
  })
  container.register<IInputFieldElement>("IInputFieldElement", {
    useClass: InputFieldElement,
  })
}
