import { container } from "tsyringe"
import { DITokens } from "../../src/symbols"
import { IClientApplicationForm } from "../../src/metadata/forms/elements/сlientApplicationForm/interfaces"
import { I8nText } from "../../src/metadata/i8n/i8nText"
import { ContainerFactory } from "../../src/metadata/forms/elements"
import { useEffect, useState } from "react"
import { IHTMLExportRules } from "../../src/metadata/forms/interfaces"
import { IInputField } from "../../src/metadata/forms/elements/inputField/interfaces"
import { Container } from "react-bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"

export default function App() {
  const [reactNode, setReactNode] = useState<React.ReactNode>(<div>Loading...</div>)

  useEffect(() => {
    new ContainerFactory().register()

    const form = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)
    form.title = { ru: "Форма" } as I8nText

    const inputField = container.resolve<IInputField>(DITokens.InputField.Element)
    inputField.title = { ru: "Поле ввода" } as I8nText
    form.items.push(inputField)

    const node = container.resolve<IHTMLExportRules<IClientApplicationForm>>(form.HTMLExportRulesToken).export(form)
    setReactNode(node)
  }, [])

  return <Container>{reactNode}</Container>
}
