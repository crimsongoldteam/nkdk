"""Check declared xs:string/xs:decimal leaf properties on immutable e2e XML."""
import argparse
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
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
binary = root / "rust/target/debug/nkdk"
xsi_type = "{http://www.w3.org/2001/XMLSchema-instance}type"
xs = "http://www.w3.org/2001/XMLSchema"
core = "http://v8.1c.ru/8.1/data/core"
enum_tables = json.loads((root / "tests/migration/system-enumeration-tables.json").read_text()) if args.calendar_records else None

def shape(source):
    namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(source), events=("start-ns",)))
    def node(element):
        attributes = []
        for key, value in element.attrib.items():
            if key == xsi_type:
                prefix, local = value.split(":", 1)
                value = "{" + namespaces[prefix] + "}" + local
            attributes.append((key, value))
        return element.tag, sorted(attributes), (element.text or "") if not len(element) else "", [node(child) for child in element]
    return node(ET.fromstring(source))

rows = []
with tempfile.TemporaryDirectory(prefix="nkdk-typed-e2e-") as temporary:
    directory = Path(temporary)
    for source in sorted((root / "e2e/fixtures/xml").rglob("*.xml")):
        original = source.read_bytes()
        namespaces = dict(value for _, value in ET.iterparse(io.BytesIO(original), events=("start-ns",)))
        tree = ET.fromstring(original)
        parents = {child: parent for parent in tree.iter() for child in parent} if args.minmax else {}
        for index, element in enumerate(tree.iter()):
            kind = element.get(xsi_type, "")
            if args.calendar_records:
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
            if kind and not args.calendar_records:
                assert namespaces.get(kind.split(":")[0]) == xs, source
            wrapper = ET.Element("Root", {"xmlns:" + prefix: uri for prefix, uri in namespaces.items() if prefix and uri in ((xs, core) if args.calendar_records else (xs,))})
            value = copy.deepcopy(element)
            value.tag = physical
            value.tail = None
            wrapper.append(value)
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
            semantic = next((v for k, v in (document.value if document else []) if k.value in (key, physical)), None)
            if semantic is not None and semantic.tag == "!xml/raw":
                semantic = next((v for k, v in semantic.value if k.value == "$значение"), None)
            expected = element.text or ""
            if args.minmax and entry.endswith("-default") and not expected and element.attrib == {"{http://www.w3.org/2001/XMLSchema-instance}nil": "true"}:
                assert document is None or not document.value, (source, index, "Ordinary nil must not have an anomaly")
            if args.calendar_records:
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
scope = "Calendar records" if args.calendar_records else "Calendar profiles" if args.dates else "MinMaxValue profiles" if args.minmax else ("Scalar choice properties" if args.choices else "Typed scalar leaf properties")
args.output.write_text(json.dumps({"scope": scope + "; not whole-project conversion or performance", "verified": len(rows), "cases": rows}, ensure_ascii=False, indent=2) + "\n")
print(f"Verified {len(rows)} {scope}")
