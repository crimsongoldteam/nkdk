<xs:complexType name="Order">
    <xs:annotation>
        <xs:documentation>Порядок</xs:documentation>
    </xs:annotation>
    <xs:sequence>
        <xs:element name="item" type="tns:OrderItem" minOccurs="0" maxOccurs="unbounded">
            <xs:annotation>
                <xs:documentation>Элемент порядка</xs:documentation>
            </xs:annotation>
        </xs:element>
        <xs:element name="viewMode" type="tns:DataCompositionSettingsItemViewMode" maxOccurs="1" minOccurs="0">
            <xs:annotation>
                <xs:documentation>Режим отображения</xs:documentation>
            </xs:annotation>
        </xs:element>
        <xs:element name="userSettingID" type="xs:string" maxOccurs="1" minOccurs="0">
            <xs:annotation>
                <xs:documentation>Идентификатор выделенной настройки</xs:documentation>
            </xs:annotation>
        </xs:element>
        <xs:element name="userSettingPresentation" type="xs:anyType" maxOccurs="1" minOccurs="0">
            <xs:annotation>
                <xs:documentation>Представление выделенной настройки</xs:documentation>
            </xs:annotation>
        </xs:element>
    </xs:sequence>
</xs:complexType>
<xs:complexType name="OrderItem" abstract="true">
    <xs:annotation>
        <xs:documentation>Элемент порядка</xs:documentation>
    </xs:annotation>
</xs:complexType>
<xs:complexType name="OrderItemField">
    <xs:annotation>
        <xs:documentation>Элемент порядка поле</xs:documentation>
    </xs:annotation>
    <xs:complexContent>
        <xs:extension base="tns:OrderItem">
            <xs:sequence>
                <xs:element name="use" type="xs:boolean"
                    minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>
                            Элемент порядка используется.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
                <xs:element name="field" type="dcscore:Field">
                    <xs:annotation>
                        <xs:documentation>
                            Поле упорядочивания.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
                <xs:element name="orderType"
                            type="dcscore:DataCompositionSortDirection" minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>
                            Тип упорядочивания.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
                <xs:element name="autoOrder"
                            type="xs:boolean"
                            minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>
                            Автоупорядочивание. Значение по умолчанию - Истина.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
                <xs:element name="distinctNullValues"
                            type="xs:boolean"
                            minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>
                            ВыделенныеЗначенияNull . Значение по умолчанию - Ложь.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
                <xs:element name="viewMode" type="tns:DataCompositionSettingsItemViewMode" maxOccurs="1" minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>Режим отображения</xs:documentation>
                    </xs:annotation>
                </xs:element>
            </xs:sequence>
            <xs:attribute name="iID" type="xs:decimal" default="0" use="optional"/>
        </xs:extension>
    </xs:complexContent>
</xs:complexType>
<xs:complexType name="OrderItemAuto">
    <xs:annotation>
        <xs:documentation>Элемент порядка авто</xs:documentation>
    </xs:annotation>
    <xs:complexContent>
        <xs:extension base="tns:OrderItem">
            <xs:sequence>
                <xs:element name="use" type="xs:boolean"
                    minOccurs="0">
                    <xs:annotation>
                        <xs:documentation>
                            Элемент порядка используется.
                        </xs:documentation>
                    </xs:annotation>
                </xs:element>
            </xs:sequence>
            <xs:attribute name="iID" type="xs:decimal" default="0" use="optional"/>
        </xs:extension>
    </xs:complexContent>
</xs:complexType>