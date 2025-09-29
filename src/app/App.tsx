"use client"

import "reflect-metadata"
import { container } from "tsyringe"
import { DITokens } from "../symbols"
import { IClientApplicationForm } from "../metadata/forms/elements/сlientApplicationForm/interfaces"
import { I8nText } from "../metadata/i8n/i8nText"
import { ContainerFactory } from "../metadata/forms/elements"
import { useEffect, useState } from "react"
import { IHTMLExportRules } from "../metadata/forms/interfaces"
import { IInputField } from "../metadata/forms/elements/inputField/interfaces"
import { Flex, Button, Input } from "antd"

export default function App() {
  const [reactNode, setReactNode] = useState<React.ReactNode>(<div>Загрузка...</div>)
  const [showNewButton, setShowNewButton] = useState(false)
  const [form, setForm] = useState<IClientApplicationForm>(
    container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)
  )

  // SSE подключение
  useEffect(() => {
    const eventSource = new EventSource("/api/server-events")

    eventSource.onmessage = (event) => {
      const inputField = container.resolve<IInputField>(DITokens.InputField.Element)
      inputField.title = { ru: "Поле ввода" + Math.random() } as I8nText
      form.items.push(inputField)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Инициализация формы
  useEffect(() => {}, [])

  new ContainerFactory().register()

  // const form = container.resolve<IClientApplicationForm>(DITokens.ClientApplicationForm.Element)
  form.title = { ru: "Форма" } as I8nText

  const inputField = container.resolve<IInputField>(DITokens.InputField.Element)
  // inputField.title = { ru: "Поле ввода" } as I8nText
  // form.items.push(inputField)

  // const node = container.resolve<IHTMLExportRules<IClientApplicationForm>>(form.HTMLExportRulesToken).export(form)
  // setReactNode(node)

  return (
    <Flex>
      {form.items.map((item) => {
        return (
          <Input key={(item as unknown as IInputField).title?.ru} value={(item as unknown as IInputField).title?.ru} />
        )
      })}
      {/* {showNewButton && <Button type="primary">Новая кнопка</Button>} */}
      {/* {reactNode} */}
    </Flex>
  )
}
