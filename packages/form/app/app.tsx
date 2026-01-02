import { ConfigProvider } from "antd"
import { useEffect, useState } from "react"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import "~/metadata/forms/elements/button/registration"
import { importClientApplicationFormFromXML } from "~/metadata/forms/elements/clientApplicationForm/importFromXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "~/metadata/forms/elements/clientApplicationForm/types"
import "~/metadata/forms/elements/inputField/registration"
import "~/metadata/forms/elements/labelDecoration/registration"
import "~/metadata/forms/elements/page/registration"
import "~/metadata/forms/elements/pages/registration"
import "~/metadata/forms/elements/pictureDecoration/registration"
import "~/metadata/forms/elements/usualGroup/registration"
import xmlImport from "~/xml/export/exporter"

const context = {
  defaultLanguage: "ru",
}

export const App = () => {
  const [form, setForm] = useState<ClientApplicationForm | null>(null)

  // Обновляем ref при изменении form
  useEffect(() => {
    // Загружаем XML файл через fetch вместо readFileSync
    fetch("/lib/tempTest/Form.xml")
      .then((response) => response.text())
      .then((originalContent) => {
        const importedXml = xmlImport<ClientApplicationFormXML>(originalContent)
        const importedForm = importClientApplicationFormFromXML(context, importedXml)
        setForm(importedForm)
      })
  }, [])

  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     console.log("event", event)
  //     if (event.data && event.data.type === "parse-xml-form") {
  //       const xmlData = xmlImport<ClientApplicationFormXML>(event.data.payload.xml)
  //       const form = importClientApplicationFormFromXML(xmlData)
  //       setNameMapping(createNameIdMapping(form))

  //       const formattedContent = formatClientApplicationForm(form, {})

  //       window.parent.postMessage({ type: "parse-xml-form-response", payload: { content: formattedContent } }, "*")
  //       setForm(form)
  //     }

  //     if (event.data && event.data.type === "change-text") {
  //       const text = event.data.payload.text
  //       const form = parseText(text)
  //       setForm(form)
  //     }

  //     if (event.data && event.data.type === "request-xml-form") {
  //       console.log("request-xml-form received, form:", formRef.current)
  //       if (!formRef.current) {
  //         console.log("Form is null, cannot export")
  //         return
  //       }

  //       if (!nameMappingRef.current) {
  //         console.log("Name mapping is null, cannot update")
  //         return
  //       }

  //       updateNameIdMapping(nameMappingRef.current, formRef.current)
  //       const formXml = exportClientApplicationFormToXML(formRef.current)
  //       const text = xmlExport(formXml)
  //       window.parent.postMessage({ type: "request-xml-form-response", payload: { content: text } }, "*")
  //     }
  //   }

  //   window.addEventListener("message", handleMessage)

  //   if (window.parent !== window) {
  //     window.parent.postMessage({ ready: true }, "*")
  //   }

  //   return () => {
  //     window.removeEventListener("message", handleMessage)
  //   }
  // }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: "#F2BD27",
          borderRadius: 6,
        },
      }}
    >
      {<main className="app-main">{form && <ClientFormApplication {...form} />}</main>}
    </ConfigProvider>
  )
}
