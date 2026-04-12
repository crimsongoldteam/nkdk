<xs:complexType name="Parameter">
<xs:annotation>
    <xs:documentation>Параметр</xs:documentation>
</xs:annotation>
<xs:sequence>
    <xs:element name="name" type="xs:string">
    <xs:annotation>
        <xs:documentation>Имя параметра</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="title" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Заголовок параметра. Может быть xs:string или core:LocalStringType</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="valueType" type="core:TypeDescription" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Тип значения параметра</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="value" minOccurs="0" type="xs:anyType" nillable="true" maxOccurs="unbounded">
    <xs:annotation>
        <xs:documentation>Значение параметра по умолчанию</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="useRestriction" type="xs:boolean" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Запрет использования.</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="expression" type="xs:string" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Выражение, по которому вычисляется значение параметра</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="availableValue" type="tns:AvailableValue" maxOccurs="unbounded" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Доступное значение</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="valueListAllowed" type="xs:boolean" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>
        В качестве знаения параметра можно использовать список значений
        </xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="availableAsField" type="xs:boolean" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Параметр будет доступен как поле.</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="functionalOptionsParameter" type="xs:string" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Имя параметра функциональной опции</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="inputParameters" type="dcscore:InputParameters" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Параметры ввода.</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="denyIncompleteValues" type="xs:boolean" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Запрет незаполненных значений. По умолчанию false.</xs:documentation>
    </xs:annotation>
    </xs:element>
    <xs:element name="use" type="dcscore:DataCompositionParameterUse" maxOccurs="1" minOccurs="0">
    <xs:annotation>
        <xs:documentation>Использование. По умолчанию Auto.</xs:documentation>
    </xs:annotation>
    </xs:element>
</xs:sequence>
</xs:complexType>