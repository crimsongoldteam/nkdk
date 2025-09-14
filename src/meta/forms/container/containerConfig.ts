// import "reflect-metadata"
// import { container, Lifecycle } from "tsyringe"
// import { DataPathNameStrategy } from "../mixins/formAttributeableMixin"
// import { InputFieldElement, InputFieldElementProperties } from "../elements/inputFieldElement"
// import { IDataPathNameStrategy } from "../mixins/interfaces"
// import { IInputFieldElement, IInputFieldElementProperties } from "../interfaces"

// // Symbol токены для DI контейнера
export const IDataPathNameStrategyToken = Symbol()
export const INameStrategyToken = Symbol()
export const IInputFieldElementPropertiesToken = Symbol()
export const IInputFieldElementToken = Symbol()
export const ICheckBoxFieldElementPropertiesToken = Symbol()
export const ICheckBoxFieldElementToken = Symbol()

// /**
//  * Настройка DI контейнера для форм
//  */
// export function configureFormContainer(): void {
//   // container.register<IDataPathNameStrategy>(
//   //   IDataPathNameStrategyToken,
//   //   {
//   //     useClass: DataPathNameStrategy,
//   //   },
//   //   {
//   //     lifecycle: Lifecycle.ResolutionScoped,
//   //   }
//   // )

//   container.register<IInputFieldElement>(IInputFieldElementToken, {
//     useClass: InputFieldElement,
//   })

//   container.register<IInputFieldElementProperties>(IInputFieldElementPropertiesToken, {
//     useClass: InputFieldElementProperties,
//   })
// }

// configureFormContainer()
