"""Print independent owner projections from immutable cf e2e XML and resources."""
import json
import io
from copy import deepcopy
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[3]
md = "{http://v8.1c.ru/8.3/MDClasses}"
xr = "{http://v8.1c.ru/8.3/xcf/readable}"
ET.register_namespace("xr", xr[1:-1])
ET.register_namespace("v8", "http://v8.1c.ru/8.1/data/core")
configuration = root / "e2e/fixtures/xml/cf"
languages = {path.stem: ET.parse(path).getroot().findtext(md + "Language/" + md + "Properties/" + md + "LanguageCode") for path in (configuration / "Languages").glob("*.xml")}
default_language = ET.parse(configuration / "Configuration.xml").getroot().findtext(md + "Configuration/" + md + "Properties/" + md + "DefaultLanguage").removeprefix("Language.")
journal_base_labels = dict(zip("Name Synonym Comment UseStandardCommands RegisteredDocuments IncludeHelpInContents ListPresentation ExtendedListPresentation Explanation".split(), "Имя Синоним Комментарий ИспользоватьСтандартныеКоманды РегистрируемыеДокументы ВключатьСправкуВСодержание ПредставлениеСписка РасширенноеПредставлениеСписка Пояснение".split()))
document_base_labels = {'Name': 'Имя', 'Synonym': 'Синоним', 'Comment': 'Комментарий', 'UseStandardCommands': 'ИспользоватьСтандартныеКоманды', 'NumberType': 'ТипНомера', 'NumberLength': 'ДлинаНомера', 'InputByString': 'ВводПоСтроке', 'NumberAllowedLength': 'ДопустимаяДлинаНомера', 'NumberPeriodicity': 'ПериодичностьНомера', 'CheckUnique': 'КонтрольУникальности', 'Autonumbering': 'Автонумерация', 'CreateOnInput': 'СозданиеПриВводе', 'SearchStringModeOnInputByString': 'СпособПоискаСтрокиПриВводеПоСтроке', 'FullTextSearchOnInputByString': 'ПолнотекстовыйПоискПриВводеПоСтроке', 'ChoiceDataGetModeOnInputByString': 'РежимПолученияДанныхВыбораПриВводеПоСтроке', 'Posting': 'Проведение', 'RealTimePosting': 'ОперативноеПроведение', 'RegisterRecordsDeletion': 'УдалениеДвижений', 'RegisterRecordsWritingOnPost': 'ЗаписьДвиженийПриПроведении', 'SequenceFilling': 'ЗаполнениеПоследовательностей', 'PostInPrivilegedMode': 'ПривилегированныйРежимПриПроведении', 'UnpostInPrivilegedMode': 'ПривилегированныйРежимПриОтменеПроведения', 'IncludeHelpInContents': 'ВключатьСправкуВСодержание', 'DataLockControlMode': 'РежимУправленияБлокировкойДанных', 'FullTextSearch': 'ПолнотекстовыйПоиск', 'ObjectPresentation': 'ПредставлениеОбъекта', 'ExtendedObjectPresentation': 'РасширенноеПредставлениеОбъекта', 'ListPresentation': 'ПредставлениеСписка', 'ExtendedListPresentation': 'РасширенноеПредставлениеСписка', 'Explanation': 'Пояснение', 'ChoiceHistoryOnInput': 'ИсторияВыбораПриВводе', 'DataHistory': 'ИсторияДанных', 'UpdateDataHistoryImmediatelyAfterWrite': 'ОбновлятьИсториюДанныхСразуПослеЗаписи', 'ExecuteAfterWriteDataHistoryVersionProcessing': 'ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных'}
def yaml_subset(source, labels):
    return select_yaml(source.read_text().splitlines(), labels)


def select_yaml(lines, labels):
    blocks = {}
    key = None
    for line in lines:
        if line and not line.startswith(" "):
            key = line.split(":", 1)[0]
            blocks[key] = []
        if key in labels:
            blocks[key].append(line)
    return "\n".join("\n".join(lines) for key, lines in blocks.items() if key in labels)

object_labels = {"Numerator": "Нумератор", "BasedOn": "ВводитсяНаОсновании", "RegisterRecords": "Движения"}
rows = []
for kind in ("Document", "DocumentJournal"):
    base_labels = journal_base_labels if kind == "DocumentJournal" else document_base_labels
    for source in sorted((root / "e2e/fixtures/xml/cf" / f"{kind}s").glob("*.xml")):
        owner = ET.parse(source).getroot().find(md + kind)
        items = []
        for item in owner.find(md + "InternalInfo"):
            assert item.tag == xr + "GeneratedType", (source, item.tag)
            items.append({
                "name": item.attrib["name"],
                "shortName": item.attrib["name"].split(".")[0],
                "category": item.attrib["category"],
                "typeId": item.findtext(xr + "TypeId"),
                "valueId": item.findtext(xr + "ValueId"),
            })
        projection = ET.Element(md + "MetaDataObject")
        projected_owner = ET.SubElement(projection, md + kind)
        projected_owner.append(owner.find(md + "InternalInfo"))
        child_projection = ET.Element(md + "MetaDataObject")
        child_owner = ET.SubElement(child_projection, md + kind)
        child_objects = owner.find(md + "ChildObjects")
        projected_children = ET.SubElement(child_owner, md + "ChildObjects") if child_objects is not None else None
        if projected_children is not None:
            projected_children.extend(child for child in child_objects if child.tag in (md + "Form", md + "Template"))
        resources = {}
        for field, folder in (("forms", "Forms"), ("templates", "Templates")):
            resources[field] = [path.stem for path in sorted(source.with_suffix("").joinpath(folder).glob("*.xml"))]
        form_labels = [("DefaultForm", "ОсновнаяФорма"), ("AuxiliaryForm", "ДополнительнаяФорма")] if kind == "DocumentJournal" else [
            ("DefaultObjectForm", "ОсновнаяФормаОбъекта"), ("DefaultListForm", "ОсновнаяФормаСписка"), ("DefaultChoiceForm", "ОсновнаяФормаДляВыбора"),
            ("AuxiliaryObjectForm", "ДополнительнаяФормаОбъекта"), ("AuxiliaryListForm", "ДополнительнаяФормаСписка"), ("AuxiliaryChoiceForm", "ДополнительнаяФормаДляВыбора")]
        form_projection = ET.Element(md + "MetaDataObject")
        form_owner = ET.SubElement(form_projection, md + kind)
        form_properties = ET.SubElement(form_owner, md + "Properties")
        original_properties = owner.find(md + "Properties")
        owner_path = kind + "." + original_properties.findtext(md + "Name")
        form_yaml = []
        for xml_name, label in form_labels:
            node = original_properties.find(md + xml_name)
            assert node is not None, (source, xml_name)
            form_properties.append(node)
            if node.text:
                prefix, name = node.text.split(".Form.", 1)
                assert prefix == owner_path, (source, node.text)
                form_yaml.append(label + ": " + name)
        assembly = ET.Element(md + "MetaDataObject", ET.parse(source).getroot().attrib)
        assembly_owner = ET.SubElement(assembly, md + kind, {"uuid": owner.attrib["uuid"]})
        assembly_owner.append(owner.find(md + "InternalInfo"))
        assembly_owner.append(form_properties)
        if projected_children is not None:
            assembly_owner.append(projected_children)
        base = {}
        if original_properties is not None:
            base_projection = ET.Element(md + "MetaDataObject")
            base_owner = ET.SubElement(base_projection, md + kind)
            base_properties = ET.SubElement(base_owner, md + "Properties")
            base_properties.extend(node for node in original_properties if node.tag.removeprefix(md) in base_labels)
            yaml_source = root / "e2e/fixtures/nkdk/cf" / ("ЖурналДокументов" if kind == "DocumentJournal" else "Документ") / source.stem / "Свойства.yaml"
            selected_yaml = yaml_subset(yaml_source, base_labels.values())
            assembly_properties = ET.Element(md + "Properties")
            supported = set(base_labels) | {name for name, _ in form_labels}
            if kind == "Document":
                supported.update(object_labels)
            assembly_properties.extend(node for node in original_properties if node.tag.removeprefix(md) in supported)
            assembly_owner.remove(form_properties)
            assembly_owner.insert(1, assembly_properties)
            base = {"basePropertiesXml": ET.tostring(base_projection, encoding="unicode"),
                    "basePropertiesYaml": selected_yaml,
                    "defaultLanguage": languages[default_language], "registeredLanguages": sorted(languages.values())}
        if kind == "Document":
            object_projection = ET.Element(md + "MetaDataObject")
            object_owner = ET.SubElement(object_projection, md + kind)
            object_properties = ET.SubElement(object_owner, md + "Properties")
            object_properties.extend(node for node in original_properties if node.tag.removeprefix(md) in object_labels)
            base["registerRecords"] = [item.text for item in original_properties.find(md + "RegisterRecords")]
            base["objectLinksXml"] = ET.tostring(object_projection, encoding="unicode")
            base["objectLinksYaml"] = yaml_subset(yaml_source, object_labels.values())
        if kind == "Document" and not rows:
            variants = []
            for number_type, length, invalid in [("String", "50", False), ("String", "51", True), ("Number", "38", False), ("Number", "39", True), ("Number", "0", False), ("Number", "-1", True), ("Number", "9007199254740993", True)]:
                variant = deepcopy(base_projection)
                properties = variant.find(md + kind + "/" + md + "Properties")
                properties.find(md + "NumberType").text = number_type
                properties.find(md + "NumberLength").text = length
                variants.append({"type": number_type, "length": length, "invalid": invalid, "xml": ET.tostring(variant, encoding="unicode")})
            base["numberLengthCases"] = variants
        commands = []
        command_labels = dict(zip("Name Synonym Comment Group ParameterUseMode ModifiesData Representation ToolTip Shortcut OnMainServerUnavalableBehavior".split(), "Имя Синоним Комментарий Группа РежимИспользованияПараметра ИзменяетДанные Отображение Подсказка СочетаниеКлавиш ПоведениеПриНедоступностиОсновногоСервера".split()))
        for child in child_objects if child_objects is not None else []:
            if child.tag != md + "Command":
                continue
            name = child.findtext(md + "Properties/" + md + "Name")
            projected = ET.Element(md + "Command", child.attrib)
            props = ET.SubElement(projected, md + "Properties")
            props.extend(node for node in child.find(md + "Properties") if node.tag.removeprefix(md) in command_labels)
            lines = yaml_source.read_text().splitlines()
            section = lines.index("Команды:")
            start = lines.index("  " + name + ":", section) + 1
            selected = []
            for line in lines[start:]:
                if line and not line.startswith("    "):
                    break
                selected.append(line[4:])
            commands.append({"name": name, "identity": child.attrib["uuid"], "xml": ET.tostring(projected, encoding="unicode"), "yaml": select_yaml(selected, command_labels.values())})
        form_headers = []
        header_labels = dict(zip("Name Synonym Comment FormType IncludeHelpInContents UsePurposes".split(), "Имя Синоним Комментарий ТипФормы ВключатьСправкуВСодержание НазначенияИспользования".split()))
        for form_source in sorted(source.with_suffix("").joinpath("Forms").glob("*.xml")):
            original = form_source.read_bytes()
            document = ET.fromstring(original)
            form = document.find(md + "Form")
            projected = ET.Element(md + "MetaDataObject", document.attrib)
            projected_form = ET.SubElement(projected, md + "Form", form.attrib)
            props = ET.SubElement(projected_form, md + "Properties")
            props.extend(node for node in form.find(md + "Properties") if node.tag.removeprefix(md) in header_labels)
            serialized = ET.tostring(projected, encoding="unicode")
            values = [value for node in projected.iter() for value in node.attrib.values()]
            for _, (prefix, uri) in ET.iterparse(io.BytesIO(original), events=("start-ns",)):
                if prefix and any(value.startswith(prefix + ":") for value in values) and f"xmlns:{prefix}=" not in serialized:
                    projected.set("xmlns:" + prefix, uri)
            expected = yaml_source.parent / "Формы" / form_source.stem / "Форма.yaml"
            form_headers.append({"source": str(form_source.relative_to(root)), "name": form_source.stem, "identity": form.attrib["uuid"], "xml": ET.tostring(projected, encoding="unicode"), "yaml": yaml_subset(expected, header_labels.values())})
            assert form_source.read_bytes() == original
        base["formHeaders"] = form_headers
        base["commands"] = commands
        rows.append({**base, "source": str(source.relative_to(root)), "kind": kind,
                     "owner": owner.attrib["uuid"], "items": items,
                     "name": owner.findtext(md + "Properties/" + md + "Name"),
                     "xml": ET.tostring(projection, encoding="unicode"),
                     "formLinksXml": ET.tostring(form_projection, encoding="unicode"),
                     "formLinksYaml": "\n".join(form_yaml),
                     "ownerPath": owner_path,
                     "assemblyXml": ET.tostring(assembly, encoding="unicode"),
                     "childNamesXml": ET.tostring(child_projection, encoding="unicode"),
                     "resources": resources,
                     "childNames": {field: [child.text or "" for child in child_objects if child.tag == md + tag] if child_objects is not None else [] for field, tag in (("forms", "Form"), ("templates", "Template"))}})
print(json.dumps(rows, ensure_ascii=False, indent=2))
