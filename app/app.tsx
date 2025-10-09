import { useState, useEffect, useRef } from "react"
import { ClientFormApplication } from "~/components/clientFormApplication/clientFormApplication"
import {
  exportClientApplicationFormToXML,
  importClientApplicationFormFromXML,
  TClientApplicationForm,
  TClientApplicationFormXML,
  xmlImport,
  xmlExport,
} from "~/lib"
import { formatClientApplicationForm } from "~/lib/metadata/forms/elements/сlientApplicationForm/format"
import { ConfigProvider } from "antd"
import { parseText } from "~/lib/parser"
import { createNameIdMapping, updateNameIdMapping, type TNameIdMapping } from "~/lib/xml/import/nameIdMapping"

export default function App() {
  const [form, setForm] = useState<TClientApplicationForm | null>(null)
  const [nameMapping, setNameMapping] = useState<TNameIdMapping | null>(null)
  const formRef = useRef<TClientApplicationForm | null>(null)
  const nameMappingRef = useRef<TNameIdMapping | null>(null)

  // Обновляем ref при изменении form
  useEffect(() => {
    formRef.current = form
    nameMappingRef.current = nameMapping
  }, [form, nameMapping])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("event", event)
      if (event.data && event.data.type === "parse-xml-form") {
        const xmlData = xmlImport<TClientApplicationFormXML>(event.data.payload.xml)
        const form = importClientApplicationFormFromXML(xmlData)
        setNameMapping(createNameIdMapping(form))

        const formattedContent = formatClientApplicationForm(form, {})

        window.parent.postMessage({ type: "parse-xml-form-response", payload: { content: formattedContent } }, "*")
        setForm(form)
      }

      if (event.data && event.data.type === "change-text") {
        const text = event.data.payload.text
        const form = parseText(text)
        setForm(form)
      }

      if (event.data && event.data.type === "request-xml-form") {
        console.log("request-xml-form received, form:", formRef.current)
        if (!formRef.current) {
          console.log("Form is null, cannot export")
          return
        }

        if (!nameMappingRef.current) {
          console.log("Name mapping is null, cannot update")
          return
        }

        updateNameIdMapping(nameMappingRef.current, formRef.current)
        const formXml = exportClientApplicationFormToXML(formRef.current)
        const text = xmlExport(formXml)
        window.parent.postMessage({ type: "request-xml-form-response", payload: { content: text } }, "*")
      }
    }

    window.addEventListener("message", handleMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ ready: true }, "*")
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

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
      <main className="app-main">
        <ClientFormApplication
          title={typeof form?.title === "string" ? form.title : form?.title?.ru || ""}
          items={
            form?.items?.map((item) => ({
              ...item,
              title: typeof item.title === "string" ? item.title : item.title?.ru || "",
            })) || []
          }
        />
      </main>
    </ConfigProvider>
  )
}
