export function withKnownXMLDefaults(xml: string, options: { includeCheckBoxType?: boolean } = {}): string {
  const withFormDefaults = withTableDefaults(withoutImplicitFalseFormDefaults(xml))
  const withConditionalDefaults =
    options.includeCheckBoxType === false ? withFormDefaults : withCheckBoxType(withFormDefaults)
  return withIncludeHelpInContents(withAttributeFillValue(withConditionalDefaults))
}

function withoutImplicitFalseFormDefaults(xml: string): string {
  return xml.replace(/\n[\t ]*<AutoCellHeight>false<\/AutoCellHeight>/g, "")
}

function withIncludeHelpInContents(xml: string): string {
  return xml.replace(/<Form\b[\s\S]*?<\/Form>/g, (form) => {
    if (!/<Form\b[^>]*\buuid=/.test(form) || /<IncludeHelpInContents(?:[ />])/.test(form)) return form
    return insertBeforeClosingProperties(form, "<IncludeHelpInContents>false</IncludeHelpInContents>")
  })
}

function withAttributeFillValue(xml: string): string {
  return xml.replace(/<Attribute\b[\s\S]*?<\/Attribute>/g, (attribute, offset: number) => {
    const precedingXML = xml.slice(0, offset)
    const insideTabularSection =
      precedingXML.lastIndexOf("<TabularSection") > precedingXML.lastIndexOf("</TabularSection>")
    if (insideTabularSection || /<FillValue(?:[ />])/.test(attribute)) return attribute
    return insertBeforeClosingProperties(attribute, '<FillValue xsi:nil="true"/>')
  })
}

function insertBeforeClosingProperties(block: string, element: string): string {
  return block.replace(/\n([\t ]*)<\/Properties>/, `\n$1\t${element}\n$1</Properties>`)
}

function withCheckBoxType(xml: string): string {
  return xml.replace(/<CheckBoxField\b[\s\S]*?<\/CheckBoxField>/g, (field) => {
    if (/<CheckBoxType(?:[ />])/.test(field) || /<ThreeState>true<\/ThreeState>/.test(field)) return field

    const closing = field.match(/\n([\t ]*)<\/CheckBoxField>$/)
    if (closing === null) return field
    const fieldIndent = closing[1] ?? ""
    const childIndent = `${fieldIndent}\t`
    const laterElement = new RegExp(
      `\n${escapeRegExp(childIndent)}<(?:ContextMenu|ExtendedTooltip|Events)(?:[ />])`
    )
    const insertion = `\n${childIndent}<CheckBoxType>Auto</CheckBoxType>`
    const laterIndex = field.search(laterElement)

    if (laterIndex >= 0) return `${field.slice(0, laterIndex)}${insertion}${field.slice(laterIndex)}`
    return field.replace(`\n${fieldIndent}</CheckBoxField>`, `${insertion}\n${fieldIndent}</CheckBoxField>`)
  })
}

function withTableDefaults(xml: string): string {
  return xml.replace(/<Table\b[\s\S]*?<\/Table>/g, (table) => {
    const closing = table.match(/\n([\t ]*)<\/Table>$/)
    if (closing === null) return table
    const tableIndent = closing[1] ?? ""
    const childIndent = `${tableIndent}\t`
    const escapedChildIndent = escapeRegExp(childIndent)

    const periodPattern = new RegExp(`\\n${escapedChildIndent}<Period>[\\s\\S]*?\\n${escapedChildIndent}</Period>`)
    const topLevelParentPattern = new RegExp(`\\n${escapedChildIndent}<TopLevelParent\\b[^>]*/>`)
    const rowFilterPattern = new RegExp(`\\n${escapedChildIndent}<RowFilter\\b[^>]*/>`)
    const period = table.match(periodPattern)?.[0] ?? canonicalPeriod(childIndent)
    const topLevelParent =
      table.match(topLevelParentPattern)?.[0] ?? `\n${childIndent}<TopLevelParent xsi:nil="true"/>`
    const rowFilter = table.match(rowFilterPattern)?.[0] ?? `\n${childIndent}<RowFilter xsi:nil="true"/>`
    const withoutDefaults = table
      .replace(periodPattern, "")
      .replace(topLevelParentPattern, "")
      .replace(rowFilterPattern, "")

    return withoutDefaults.replace(
      `\n${tableIndent}</Table>`,
      `${period}${topLevelParent}${rowFilter}\n${tableIndent}</Table>`
    )
  })
}

function canonicalPeriod(indent: string): string {
  return `
${indent}<Period>
${indent}\t<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
${indent}\t<v8:startDate>0001-01-01T00:00:00</v8:startDate>
${indent}\t<v8:endDate>0001-01-01T00:00:00</v8:endDate>
${indent}</Period>`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
