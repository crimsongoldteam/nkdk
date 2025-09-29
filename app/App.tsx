"use client"

import "@ant-design/v5-patch-for-react-19"
import { useState } from "react"
import { Button, Flex } from "antd"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"

export default function App() {
  const [formItems, setFormItems] = useState([{ title: "Поле", value: "Значение" }])

  const addNewItem = () => {
    const randomNumber = Math.floor(Math.random() * 1000)
    setFormItems([...formItems, { title: `Новое поле ${randomNumber}`, value: "" }])
  }

  return (
    <Flex vertical>
      <ClientFormApplication title="Форма" items={formItems} />
      <Button type="primary" onClick={addNewItem}>
        Добавить поле
      </Button>
    </Flex>
  )
}
