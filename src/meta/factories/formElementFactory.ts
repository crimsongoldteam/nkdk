// import { injectable, container } from "tsyringe"
// import { ManagedFormElement } from "../elements/managedFormElement"
// import { InputFieldElement } from "../elements/inputFieldElement"

// /**
//  * Фабрика для создания элементов формы
//  * Принцип SRP: отвечает только за создание элементов
//  * Принцип OCP: можно расширить для создания новых типов элементов
//  * Принцип DIP: использует DI контейнер для создания объектов
//  */
// @injectable()
// export class FormElementFactory {
//   /**
//    * Создает управляемый элемент формы
//    */
//   createManagedFormElement(
//     config: {
//       title?: string
//       name?: string
//       autoName?: boolean
//     } = {}
//   ): ManagedFormElement {
//     const element = container.resolve<ManagedFormElement>("ManagedFormElement")

//     if (config.title) element.title = config.title
//     if (config.name) element.name = config.name

//     // Если включено автоматическое именование
//     if (config.autoName) {
//       element.setFormAutoName()
//     }

//     return element
//   }

//   /**
//    * Создает поле ввода
//    */
//   createInputFieldElement(
//     config: {
//       name?: string
//       dataPath?: string
//       height?: number
//       multiLine?: boolean
//       choiceButton?: boolean
//       autoName?: boolean
//       value?: string
//     } = {}
//   ): InputFieldElement {
//     const element = container.resolve<InputFieldElement>("InputFieldElement")

//     if (config.name) element.name = config.name
//     if (config.dataPath) element.dataPath = config.dataPath
//     if (config.height !== undefined) element.height = config.height
//     if (config.multiLine !== undefined) element.multiLine = config.multiLine
//     if (config.choiceButton !== undefined) element.choiceButton = config.choiceButton
//     if (config.value !== undefined) element.value = config.value

//     // Если включено автоматическое именование
//     if (config.autoName && !config.name) {
//       element.setFieldAutoName()
//     }

//     return element
//   }

//   /**
//    * Создает форму с автоматическим именованием
//    */
//   createAutoNamedForm(title: string): ManagedFormElement {
//     return this.createManagedFormElement({
//       title,
//       autoName: true,
//     })
//   }

//   /**
//    * Создает именованную форму
//    */
//   createNamedForm(title: string, name: string): ManagedFormElement {
//     return this.createManagedFormElement({
//       title,
//       name,
//     })
//   }

//   /**
//    * Создает простое поле ввода
//    */
//   createSimpleInput(name: string, dataPath: string, value: string = ""): InputFieldElement {
//     return this.createInputFieldElement({
//       name,
//       dataPath,
//       value,
//       height: 30,
//     })
//   }

//   /**
//    * Создает многострочное поле ввода
//    */
//   createTextArea(name: string, dataPath: string, value: string = "", height: number = 100): InputFieldElement {
//     return this.createInputFieldElement({
//       name,
//       dataPath,
//       value,
//       height,
//       multiLine: true,
//     })
//   }

//   /**
//    * Создает поле с кнопкой выбора
//    */
//   createChoiceField(name: string, dataPath: string, value: string = ""): InputFieldElement {
//     return this.createInputFieldElement({
//       name,
//       dataPath,
//       value,
//       choiceButton: true,
//     })
//   }

//   /**
//    * Создает форму с предустановленными полями
//    */
//   createUserRegistrationForm(): ManagedFormElement {
//     const form = this.createNamedForm("User Registration", "userRegistrationForm")

//     const nameField = this.createSimpleInput("userName", "user.name")
//     const emailField = this.createSimpleInput("userEmail", "user.email")
//     const phoneField = this.createSimpleInput("userPhone", "user.phone")
//     const messageField = this.createTextArea("userMessage", "user.message", "", 80)

//     form.addFormElement(nameField)
//     form.addFormElement(emailField)
//     form.addFormElement(phoneField)
//     form.addFormElement(messageField)

//     return form
//   }

//   /**
//    * Создает форму обратной связи
//    */
//   createContactForm(): ManagedFormElement {
//     const form = this.createAutoNamedForm("Contact Form")

//     const nameField = this.createSimpleInput("contactName", "contact.name")
//     const emailField = this.createSimpleInput("contactEmail", "contact.email")
//     const subjectField = this.createSimpleInput("contactSubject", "contact.subject")
//     const messageField = this.createTextArea("contactMessage", "contact.message", "", 120)

//     form.addFormElement(nameField)
//     form.addFormElement(emailField)
//     form.addFormElement(subjectField)
//     form.addFormElement(messageField)

//     return form
//   }
// }
