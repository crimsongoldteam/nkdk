"use client"

import { useState } from "react"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import { MonacoEditor } from "~/components/monacoEditor/monacoEditor"

export default function App() {
  const [formItems, setFormItems] = useState([{ title: "Поле", value: "Значение" }])

  const addNewItem = () => {
    const randomNumber = Math.floor(Math.random() * 1000)
    setFormItems([...formItems, { title: `Новое поле ${randomNumber}`, value: "" }])
  }

  return (
    <div className="flex flex-column gap-4 p-4">
      <Card title="Форма с полями">
        <ClientFormApplication title="Форма" items={formItems} />
        <Button label="Добавить поле" onClick={addNewItem} className="mt-4" />
      </Card>

      <Card title="Monaco Editor">
        <div className="flex flex-column w-full">
          <MonacoEditor />
        </div>
      </Card>
    </div>
  )
}
