"""Check declarative property conversions on immutable e2e XML."""
import argparse
from collections import Counter
import copy
import hashlib
import io
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from datetime import datetime
from pathlib import Path
import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", required=True, type=Path)
mode = parser.add_mutually_exclusive_group()
mode.add_argument("--choices", action="store_true")
mode.add_argument("--minmax", action="store_true")
mode.add_argument("--dates", action="store_true")
mode.add_argument("--calendar-records", action="store_true")
mode.add_argument("--collections", action="store_true")
mode.add_argument("--purposes", action="store_true")
mode.add_argument("--qnames", action="store_true")
mode.add_argument("--root-paths", action="store_true")
mode.add_argument("--member-paths", action="store_true")
mode.add_argument("--field-paths", action="store_true")
mode.add_argument("--terminal-paths", action="store_true")
mode.add_argument("--object-segments", action="store_true")
mode.add_argument("--object-paths", action="store_true")
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
binary = root / "rust/target/debug/nkdk"
xsi_type = "{http://www.w3.org/2001/XMLSchema-instance}type"
xs = "http://www.w3.org/2001/XMLSchema"
core = "http://v8.1c.ru/8.1/data/core"
enum_tables = json.loads((root / "tests/migration/system-enumeration-tables.json").read_text()) if args.calendar_records else None

path_tables = json.loads((root / "tests/migration/metadata-path-lexicons.json").read_text())["tables"] if args.root_paths or (args.member_paths or args.field_paths) or args.terminal_paths or (args.object_segments or args.object_paths) else []
path_roots, path_members, path_objects, path_attributes = ({row["xml"]: row["yaml"] for row in path_tables[index]["values"]} if path_tables else {} for index in (0, 1, 2, 3))
path_virtual_tables = {row["xml"]: row["yaml"] for row in path_tables[4]["values"]} if path_tables else {}
uncovered = Counter()

def scoped_document(source):
    stack, pending, scopes = [], {}, {}
    events = ET.iterparse(io.BytesIO(source), events=("start-ns", "start", "end"))
    for event, value in events:
        if event == "start-ns":
            prefix, uri = value
            pending[prefix or ""] = uri
        elif event == "start":
            scope = dict(stack[-1] if stack else {"xml": "http://www.w3.org/XML/1998/namespace"})
            scope.update(pending)
            pending.clear()
            stack.append(scope)
            if value.tag.split("}")[-1] in ("Value", "XDTOValueType", "XDTOReturningValueType"):
                scopes[value] = scope
        else:
            stack.pop()
    return events.root, scopes

def shape(source):
    namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(source), events=("start-ns",)))
    tree, scopes = scoped_document(source) if args.qnames else (ET.fromstring(source), {})
    def node(element):
        attributes = []
        for key, value in element.attrib.items():
            if key == xsi_type:
                prefix, local = value.split(":", 1)
                value = "{" + namespaces[prefix] + "}" + local
            attributes.append((key, value))
        text = (element.text or "") if not len(element) else ""
        if args.qnames and element.tag.split("}")[-1] == "Value" and text:
            prefix, local = text.split(":", 1) if ":" in text else ("", text)
            text = (scopes[element].get(prefix, ""), local)
        return element.tag, sorted(attributes), text, [node(child) for child in element]
    return node(tree)

rows = []
with tempfile.TemporaryDirectory(prefix="nkdk-typed-e2e-") as temporary:
    directory = Path(temporary)
    for source in sorted((root / "e2e/fixtures/xml").rglob("*.xml")):
        original = source.read_bytes()
        namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(original), events=("start-ns",)))
        tree, scopes = scoped_document(original) if args.qnames else (ET.fromstring(original), {})
        parents = {child: parent for parent in tree.iter() for child in parent} if args.minmax or args.qnames or (args.object_segments or args.object_paths) or (args.collections or args.purposes) else {}
        for index, element in enumerate(tree.iter()):
            kind = element.get(xsi_type, "")
            if (args.object_segments or args.object_paths):
                parts = (element.text or "").split(".")
                parent = parents.get(element)
                context = (parent.tag.split("}")[-1] if parent is not None else "", element.tag.split("}")[-1])
                if len(element) or len(parts) < 4 or len(parts) % 2 or parts[0] not in path_roots:
                    continue
                if context not in (("Content", "Item"), ("Content", "Object"), ("Settings", "MainTable")) or any(kind not in path_objects for kind in parts[2::2]):
                    uncovered["other nested path contract"] += 1
                    continue
                projected_text = ".".join(parts[2:])
                expected_path = ".".join(token for kind, name in zip(parts[2::2], parts[3::2]) for token in (path_objects[kind], name))
                entry, key, physical = "migration.metadata-object-segments", "Путь", "Value"
                if args.object_paths:
                    projected_text = element.text or ""
                    expected_path = ".".join([path_roots[parts[0]], parts[1], expected_path])
                    entry = "migration.metadata-object-chain-path"
            elif args.terminal_paths:
                parts = (element.text or "").split(".")
                if len(element) or len(parts) != 3 or parts[0] not in path_roots:
                    continue
                prefix, owner, terminal = parts
                if terminal == "EmptyRef":
                    entry, translated = "migration.metadata-value-path", "ПустаяСсылка"
                elif (element.tag.split("}")[-1] == "FillValue" and kind.split(":")[-1] == "DesignTimeRef") or element.tag.split("}")[-1] == "CalculationType":
                    entry, translated = "migration.metadata-value-path", terminal
                elif element.tag.split("}")[-1] == "MainTable" and terminal in path_virtual_tables:
                    entry, translated = "migration.metadata-table-path", path_virtual_tables[terminal]
                elif element.tag.split("}")[-1] == "MainTable" and terminal.startswith("Base") and len(terminal) > 4:
                    entry, translated = "migration.metadata-table-path", "База" + terminal[4:]
                else:
                    uncovered["other three-segment profile"] += 1
                    continue
                expected_path = f"{path_roots[prefix]}.{owner}.{translated}"
                key, physical = "Путь", "Value"
            elif args.field_paths:
                parts = (element.text or "").split(".")
                if len(element) or len(parts) < 4 or len(parts) % 2 or parts[0] not in path_roots:
                    continue
                segments = list(zip(parts[2::2], parts[3::2]))
                if any(member not in path_members for member, _ in segments):
                    uncovered["other rooted chain profile"] += 1
                    continue
                expected_path = ".".join([path_roots[parts[0]], parts[1], *(
                    token for member, name in segments for token in (
                        path_members[member], path_attributes.get(name, name) if member == "StandardAttribute" else name
                    )
                )])
                entry, key, physical = "migration.metadata-field-chain-path", "Путь", "Value"
            elif (args.member_paths or args.field_paths):
                parts = (element.text or "").split(".")
                if len(element) or len(parts) != 4 or parts[0] not in path_roots:
                    continue
                prefix, owner, member, name = parts
                if prefix == "Enum" and member == "EnumValue":
                    profile, expected_path = "enum-value", f"Перечисление.{owner}.{name}"
                elif member == "StandardAttribute":
                    profile = "standard-attribute"
                    expected_path = f"{path_roots[prefix]}.{owner}.СтандартныйРеквизит.{path_attributes.get(name, name)}"
                elif member in path_members and member != "StandardAttribute":
                    profile = "member"
                    expected_path = f"{path_roots[prefix]}.{owner}.{path_members[member]}.{name}"
                elif member in path_objects:
                    profile = "object"
                    expected_path = f"{path_roots[prefix]}.{owner}.{path_objects[member]}.{name}"
                else:
                    uncovered["other four-segment profile"] += 1
                    continue
                entry = "migration.metadata-structural-path" if profile in ("member", "object") else f"migration.metadata-{profile}-path"
                key, physical = "Путь", "Value"
            elif args.root_paths:
                parts = (element.text or "").split(".")
                if len(element) or len(parts) != 2 or parts[0] not in path_roots:
                    continue
                entry, key, physical = "migration.metadata-root-path", "Путь", "Value"
            elif args.qnames:
                md = "{http://v8.1c.ru/8.3/MDClasses}"
                parent = parents.get(element)
                grandparent = parents.get(parent)
                if parent is None or grandparent is None or parent.tag != md + "Properties" or (grandparent.tag, element.tag) not in ((md + "Operation", md + "XDTOReturningValueType"), (md + "Parameter", md + "XDTOValueType")):
                    continue
                entry, key, physical = "migration.xdto-type-name-metadata", "Тип", md + "Value"
                namespaces = scopes[element]
            elif (args.collections or args.purposes):
                parent = parents.get(element)
                grandparent = parents.get(parent)
                lf = "{http://v8.1c.ru/8.3/xcf/logform}"
                ep = "{http://v8.1c.ru/8.3/xcf/extrnprops}"
                md = "{http://v8.1c.ru/8.3/MDClasses}"
                if args.purposes:
                    if element.tag.split("}")[-1] != "UsePurposes":
                        continue
                    entry = "migration.use-purposes" if grandparent is not None and grandparent.tag == md + "CommonForm" else "migration.use-purposes-default"
                elif grandparent is not None and parent.tag == md + "Properties" and grandparent.tag == md + "WebSocketClient" and element.tag == md + "Headers":
                    entry = "migration.web-socket-client-headers-default"
                elif grandparent is not None and parent.tag == md + "Properties" and grandparent.tag == md + "WebService" and element.tag == md + "XDTOPackages":
                    entry = "migration.xdto-packages-default"
                elif parent is not None and parent.tag == ep + "AdditionalIndex" and element.tag in (ep + "IndexedFields", ep + "AdditionalFields"):
                    entry = "migration.index-field-default" if element.tag == ep + "AdditionalFields" else "migration.index-field"
                elif parent is not None and parent.tag == lf + "Attribute" and element.tag in (lf + "UseAlways", lf + "Save"):
                    entry = "migration.fields-list"
                elif grandparent is not None and parent.tag == md + "Properties" and grandparent.tag == md + "Table" and "ExternalDataSources" in source.parts and element.tag in (md + "KeyFields", md + "InputByString", md + "DataLockFields"):
                    entry = "migration.fields-list-readable-default"
                else:
                    continue
                key, physical = ("НазначенияИспользования" if args.purposes else "Headers" if "web-socket-client-headers" in entry else "List"), "Value"
            elif args.calendar_records:
                prefix, _, local = kind.partition(":")
                if namespaces.get(prefix) != core or local not in ("StandardBeginningDate", "StandardPeriod"):
                    continue
                entry = "migration.standard-beginning-date" if local == "StandardBeginningDate" else "migration.standard-period"
                key, physical = "Значение", "Value"
            elif args.minmax:
                parent = parents.get(element)
                grandparent = parents.get(parent)
                local = element.tag.split("}")[-1]
                if parent is None or local not in ("MinValue", "MaxValue"):
                    continue
                if parent.tag == "{http://v8.1c.ru/8.3/xcf/logform}InputField":
                    entry = "migration.min-max-value"
                elif parent.tag == "{http://v8.1c.ru/8.3/xcf/readable}StandardAttribute":
                    entry = "migration.min-max-value-default"
                elif parent.tag == "{http://v8.1c.ru/8.3/MDClasses}Properties" and grandparent is not None and grandparent.tag in {
                    "{http://v8.1c.ru/8.3/MDClasses}" + name for name in
                    ("Constant", "CommonAttribute", "Attribute", "Field", "Dimension", "Resource", "AddressingAttribute", "AccountingFlag", "ExtDimensionAccountingFlag")
                }:
                    entry = "migration.min-max-value-text-default"
                else:
                    continue
                assert not len(element), source
                key, physical = "Значение", "Value"
            elif args.dates:
                if len(element) or kind != "xs:dateTime":
                    continue
                default = element.tag in {"{http://v8.1c.ru/8.1/data-composition-system/settings}" + name for name in ("periodAdditionBegin", "periodAdditionEnd")}
                entry = "migration.date-time-default" if default else "migration.typed-date-time"
                key, physical = "Сумма", "Amount"
            elif args.choices:
                if element.tag == "{http://v8.1c.ru/8.3/xcf/predef}Code" and source.name == "Predefined.xml":
                    entry = "migration.predefined-code"
                elif element.tag in ("{http://v8.1c.ru/8.3/xcf/logform}ReportResult", "{http://v8.1c.ru/8.3/xcf/logform}DetailsData") and source.name == "Form.xml":
                    entry = "migration.string-or-number"
                else:
                    continue
                assert not len(element), source
                key, physical = "Значение", "Value"
            else:
                if len(element) or kind not in ("xs:decimal", "xs:string", "xs:dateTime"):
                    continue
                entry = {"xs:decimal":"migration.typed-number","xs:string":"migration.typed-string","xs:dateTime":"migration.typed-date-time"}[kind]
                key, physical = "Сумма", "Amount"
            if kind and not (args.object_segments or args.object_paths) and not args.terminal_paths and not (args.member_paths or args.field_paths) and not args.root_paths and not args.calendar_records and not args.qnames and not (args.collections or args.purposes):
                assert namespaces.get(kind.split(":")[0]) == xs, source
            wrapper = ET.Element("Root", {"xmlns:" + prefix: uri for prefix, uri in namespaces.items() if prefix and not (args.collections or args.purposes) and uri in ((xs, core) if args.calendar_records else (xs,))})
            if args.qnames:
                wrapper = ET.Element(md + "Root")
            value = copy.deepcopy(element)
            if (args.object_segments or args.object_paths):
                value.text = projected_text
            value.tag = physical
            value.tail = None
            wrapper.append(value)
            if args.qnames or args.root_paths or (args.member_paths or args.field_paths) or args.terminal_paths or (args.object_segments or args.object_paths) or (args.collections or args.purposes):
                emitted = dict(value for _, value in ET.iterparse(io.BytesIO(ET.tostring(wrapper)), events=("start-ns",)))
                for prefix, uri in namespaces.items():
                    if prefix and prefix not in emitted:
                        wrapper.set("xmlns:" + prefix, uri)
                    elif args.qnames and not prefix:
                        wrapper.set("xmlns", uri)
            input_xml = ET.tostring(wrapper, encoding="utf-8")
            (directory / "input.xml").write_bytes(input_xml)
            commands = [
                ["convert-file", "--direction", "xml-to-yaml", "--input", str(directory / "input.xml"), "--output", str(directory / "value.yaml")],
                ["validate-file", "--input", str(directory / "value.yaml")],
                ["convert-file", "--direction", "yaml-to-xml", "--input", str(directory / "value.yaml"), "--output", str(directory / "restored.xml")],
            ]
            for command in commands:
                result = subprocess.run([str(binary), *command, "--entry", entry], capture_output=True, text=True)
                assert result.returncode == 0, f"{source}:{index}: {result.stderr}"
            assert shape(input_xml) == shape((directory / "restored.xml").read_bytes()), (source, index)
            document = yaml.compose((directory / "value.yaml").read_text())
            assert document is None or isinstance(document, yaml.MappingNode)
            semantic = next((v for k, v in (document.value if document else []) if k.value in (key, physical.split("}")[-1])), None)
            if semantic is not None and semantic.tag == "!xml/raw":
                semantic = next((v for k, v in semantic.value if k.value == "$значение"), None)
            expected = element.text or ""
            if args.minmax and entry.endswith("-default") and not expected and element.attrib == {"{http://www.w3.org/2001/XMLSchema-instance}nil": "true"}:
                assert document is None or not document.value, (source, index, "Ordinary nil must not have an anomaly")
            if (args.member_paths or args.field_paths) or args.terminal_paths or (args.object_segments or args.object_paths):
                assert isinstance(semantic, yaml.ScalarNode) and semantic.value == expected_path, (source, index)
            elif args.root_paths:
                prefix, name = expected.split(".", 1)
                assert isinstance(semantic, yaml.ScalarNode) and semantic.value == path_roots[prefix] + "." + name, (source, index)
            elif args.qnames:
                assert isinstance(semantic, yaml.MappingNode), (source, index)
                prefix, local = expected.split(":", 1) if ":" in expected else ("", expected)
                assert {k.value:v.value for k,v in semantic.value} == {"ПространствоИмен": namespaces.get(prefix, ""), "Имя": local}, (source, index)
            elif (args.collections or args.purposes):
                expected = [child.text or "" for child in element]
                if args.purposes:
                    if expected == ["PlatformApplication"] and entry.endswith("-default"):
                        assert semantic is None, (source, index)
                    else:
                        shortcuts = {("MobilePlatformApplication",): "МобильноеПриложение", ("PlatformApplication", "MobilePlatformApplication"): "ПлатформаИМобильноеПриложение"}
                        if tuple(expected) in shortcuts:
                            assert isinstance(semantic, yaml.ScalarNode) and semantic.value == shortcuts[tuple(expected)], (source,index)
                        else:
                            assert isinstance(semantic, yaml.SequenceNode) and [child.value for child in semantic.value] == expected, (source,index)
                elif "xdto-packages" in entry:
                    expected = [child.find("{http://v8.1c.ru/8.3/xcf/readable}Value").text or "" for child in element]
                if args.purposes:
                    pass
                elif "web-socket-client-headers" in entry and expected:
                    expected = [[node.find("{" + core + "}" + name).text or "" for name in ("Key", "Value")] for node in (child.find("{http://v8.1c.ru/8.3/xcf/readable}Value") for child in element)]
                    assert isinstance(semantic, yaml.SequenceNode), (source,index)
                    actual = [[v.value for k,v in row.value] for row in semantic.value]
                    assert actual == expected, (source,index,actual,expected)
                elif expected:
                    assert isinstance(semantic, yaml.SequenceNode), (source, index)
                    assert [child.value for child in semantic.value] == expected, (source, index)
                    assert all(child.tag == "tag:yaml.org,2002:str" for child in semantic.value)
                else:
                    assert semantic is None, (source, index)
            elif args.calendar_records:
                assert isinstance(semantic, yaml.MappingNode) and semantic.tag == "tag:yaml.org,2002:map", (source,index)
                actual = {k.value:v.value for k,v in semantic.value}
                table = next(row for row in enum_tables["entries"] if row["name"] == local + "Variant")
                variant = element.find("{" + core + "}variant").text
                expected = {"Вариант": next(value["yaml"] for value in table["values"] if value["meaning"] == variant)}
                for field, label in [("date","Дата"),("startDate","ДатаНачала"),("endDate","ДатаОкончания")]:
                    child=element.find("{" + core + "}" + field)
                    if child is not None:
                        date=datetime.fromisoformat(child.text)
                        expected[label]=f"{date.day:02}.{date.month:02}.{date.year:04} {date.hour:02}:{date.minute:02}:{date.second:02}"
                assert actual == expected, (source,index,actual,expected)
            elif (args.choices or args.minmax) and not expected:
                assert semantic is None, (source,index)
            elif (kind == "xs:string" and not args.minmax) or (args.choices and kind not in ("xs:decimal", "xs:integer", "xs:float", "xs:double")):
                assert isinstance(semantic, yaml.ScalarNode) and semantic.tag == "tag:yaml.org,2002:str" and semantic.value == expected, (source, index)
            elif args.dates and entry == "migration.date-time-default" and expected == "0001-01-01T00:00:00":
                assert semantic is None, (source, index)
                assert document is None or not document.value, (source, index, "Ordinary calendar default must be omitted")
            elif kind == "xs:dateTime":
                try:
                    date = datetime.fromisoformat(expected)
                except ValueError:
                    date = None
                if date is None:
                    assert semantic is None, (source,index)
                else:
                    clock = f"{date.day:02}.{date.month:02}.{date.year:04}"
                    if date.hour or date.minute or date.second:
                        clock += f" {date.hour:02}:{date.minute:02}"
                    assert isinstance(semantic,yaml.ScalarNode) and semantic.value==clock, (source,index)
            else:
                try:
                    number = Decimal(expected.replace(",", ".") if args.minmax else expected)
                except InvalidOperation:
                    number = None
                if number is not None and number.is_finite():
                    assert isinstance(semantic, yaml.ScalarNode) and semantic.tag in ("tag:yaml.org,2002:int", "tag:yaml.org,2002:float") and Decimal(semantic.value) == number, (source, index)
                else:
                    assert semantic is None, (source, index)
            rows.append({"source": str(source.relative_to(root)), "sha256": hashlib.sha256(original).hexdigest(), "occurrence": index, "type": kind, "entry": entry, "verified": True})
        assert source.read_bytes() == original
assert rows, "An empty selection is not success"
scope = "Complete member-chain spelling (property projection only)" if args.field_paths else "Complete object path spelling (property projection only)" if args.object_paths else "Object segment suffixes (root and owner excluded from projection)" if (args.object_segments or args.object_paths) else "Terminal path profiles (property projection only)" if args.terminal_paths else "Fixed member path profiles (property projection only)" if (args.member_paths or args.field_paths) else "Explicit two-segment root path candidates (property projection only)" if args.root_paths else "QName properties" if args.qnames else "UsePurposes collections" if args.purposes else "Text collections" if (args.collections or args.purposes) else "Calendar records" if args.calendar_records else "Calendar profiles" if args.dates else "MinMaxValue profiles" if args.minmax else ("Scalar choice properties" if args.choices else "Typed scalar leaf properties")
args.output.write_text(json.dumps({"scope": scope + "; not whole-project conversion or performance", "verified": len(rows), "notCovered": dict(uncovered), "cases": rows}, ensure_ascii=False, indent=2) + "\n")
print(f"Verified {len(rows)} {scope}")
