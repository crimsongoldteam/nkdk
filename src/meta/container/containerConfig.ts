import { container } from "tsyringe"
import { ManagedFormElement } from "../../lib/meta/forms/elements/managedFormElement"
import { InputFieldElement } from "../../lib/meta/forms/elements/inputFieldElement"
// import { FormElementFactory } from "../factories/formElementFactory"

export class ContainerConfig {
  static configure(): void {
    container.register("ManagedFormElement", {
      useClass: ManagedFormElement,
    })

    container.register("InputFieldElement", {
      useClass: InputFieldElement,
    })

    // // Регистрируем фабрику
    // container.register("FormElementFactory", {
    //   useClass: FormElementFactory,
    // })

    // // Регистрируем синглтоны для часто используемых объектов
    // container.registerSingleton("FormElementFactory", FormElementFactory)
  }

  // /**
  //  * Получает экземпляр фабрики из контейнера
  //  */
  // static getFactory(): FormElementFactory {
  //   return container.resolve<FormElementFactory>("FormElementFactory")
  // }

  static createManagedFormElement(): ManagedFormElement {
    return container.resolve<ManagedFormElement>("ManagedFormElement")
  }

  static createInputFieldElement(): InputFieldElement {
    return container.resolve<InputFieldElement>("InputFieldElement")
  }
}
