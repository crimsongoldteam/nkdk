"use client"

import "@ant-design/v5-patch-for-react-19"
import { useState } from "react"
import { Button, Flex, Card, Space } from "antd"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import { MonacoEditor } from "~/components/monacoEditor/monacoEditor"

export default function App() {
  const [formItems, setFormItems] = useState([{ title: "Поле", value: "Значение" }])

  const addNewItem = () => {
    const randomNumber = Math.floor(Math.random() * 1000)
    setFormItems([...formItems, { title: `Новое поле ${randomNumber}`, value: "" }])
  }

  return (
    <Flex vertical gap={16} style={{ padding: "20px" }}>
      <Card title="Форма с полями">
        <ClientFormApplication title="Форма" items={formItems} />
        <Button type="primary" onClick={addNewItem} style={{ marginTop: "16px" }}>
          Добавить поле
        </Button>
      </Card>

      <Card title="Monaco Editor">
        <Space direction="vertical" style={{ width: "100%" }}>
          <MonacoEditor />
        </Space>
      </Card>
    </Flex>
  )
}
