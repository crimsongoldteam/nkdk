import { ConfigProvider, Splitter } from "antd"
import { useState } from "react"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import type { ClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"
import { parse } from "~/lib/parser/parser"
import { MonacoEditor } from "~/playground/components/monacoEditor/monacoEditor"

export const Playground = () => {
  const [text, setText] = useState<string>("")
  const [form, setForm] = useState<ClientApplicationForm>({
    elementType: FormElementType.Form,
    childItems: [],
  })

  const changeText = (newText: string) => {
    setText(newText)
    const parsedForm = parse(newText)
    setForm(parsedForm)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#F2BD27",
          borderRadius: 6,
        },
      }}
    >
      <Splitter style={{ width: "100%" }}>
        <Splitter.Panel>
          <MonacoEditor value={text} onChange={(value) => changeText(value || "")} />
        </Splitter.Panel>
        <Splitter.Panel>
          <ClientFormApplication {...form} />
        </Splitter.Panel>
      </Splitter>
    </ConfigProvider>
  )
}
