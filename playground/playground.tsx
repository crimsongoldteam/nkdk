import { ConfigProvider, Input, Splitter } from "antd"
import { useState } from "react"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import type { TClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { parse } from "~/lib/parser/parser"
// import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
// import type { TClientApplicationForm } from "~/lib"
// import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
// import type { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
// import { parseClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/parse"
// import "~/lib/metadata/forms/elements/exportToXML"
// import "~/lib/metadata/forms/elements/importFromXML"
// import "~/lib/metadata/forms/elements/rules"
// import { parseElement } from "~/lib/parser/elementsParser/parse"
// import { detectTreeNodes } from "~/lib/parser/treeParser/detectTree"
// import { parseTree } from "~/lib/parser/treeParser/parseTree"

// Парсим все корневые элементы
// const childItems = detectedNodes.map(parseElementRecursive)

// return {
//     ...form,
//     childItems,
//   }
// }

export const Playground = () => {
  const [text, setText] = useState<string>("")
  const [form, setForm] = useState<TClientApplicationForm>({
    elementType: ZElementType.enum.Form,
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
          <Input.TextArea
            id="text-input"
            style={{ height: "100%" }}
            value={text}
            onChange={(e) => changeText(e.target.value)}
          />
        </Splitter.Panel>
        <Splitter.Panel>
          <ClientFormApplication title={""} childItems={form.childItems} />
        </Splitter.Panel>
      </Splitter>
    </ConfigProvider>
  )
}
