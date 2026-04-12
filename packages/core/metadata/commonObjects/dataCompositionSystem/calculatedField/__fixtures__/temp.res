<package targetNamespace="http://v8.1c.ru/8.1/data-composition-system/schema" elementFormQualified="true" attributeFormQualified="false">
    <import namespace="http://v8.1c.ru/8.1/data-composition-system/settings"/>
    <import namespace="http://v8.1c.ru/8.1/data-composition-system/common"/>
    <import namespace="http://v8.1c.ru/8.1/data-composition-system/core"/>
    <import namespace="http://v8.1c.ru/8.1/data/core"/>
    <import namespace="http://v8.1c.ru/8.1/data-composition-system/area-template"/>
    <property xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="dataCompositionSchema" type="d3p1:DataCompositionSchema"/>
    <objectType name="AvailableValue">
        <property name="value" lowerBound="0" nillable="true"/>
        <property name="presentation" lowerBound="0"/>
    </objectType>
    <objectType name="CalculatedField">
        <property name="dataPath" type="xs:string"/>
        <property name="expression" type="xs:string"/>
        <property name="title" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="useRestriction" type="d4p1:FieldUseRestriction" lowerBound="0"/>
        <property name="presentationExpression" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="orderExpression" type="d4p1:OrderExpression" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="appearance" type="d4p1:Appearance" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="availableValue" type="d4p1:AvailableValue" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data/core" name="valueType" type="d4p1:TypeDescription" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="inputParameters" type="d4p1:InputParameters" lowerBound="0"/>
    </objectType>
    <objectType name="DataCompositionSchema">
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="dataSource" type="d4p1:DataSource" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="dataSet" type="d4p1:DataSet" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="dataSetLink" type="d4p1:DataSetLink" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="calculatedField" type="d4p1:CalculatedField" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="totalField" type="d4p1:TotalField" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="parameter" type="d4p1:Parameter" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="nestedSchema" type="d4p1:NestedDataCompositionSchema" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="template" type="d4p1:TemplateDefinition" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="fieldTemplate" type="d4p1:FieldTemplate" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="groupTemplate" type="d4p1:GroupTemplate" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="groupHeaderTemplate" type="d4p1:GroupTemplate" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="totalFieldsTemplate" type="d4p1:TotalFieldsTemplate" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/settings" name="defaultSettings" type="d4p1:Settings" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/settings" name="settingsVariant" type="d4p1:SettingsVariant" lowerBound="0" upperBound="-1"/>
    </objectType>
    <objectType name="DataSet" abstract="true">
        <property name="name" type="xs:string"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="field" type="d4p1:DataSetField" lowerBound="0" upperBound="-1"/>
    </objectType>
    <objectType name="DataSetField" abstract="true"/>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetFieldField" base="d3p1:DataSetField">
        <property name="dataPath" type="xs:string"/>
        <property name="field" type="xs:string"/>
        <property name="title" lowerBound="0"/>
        <property name="useRestriction" type="d3p1:FieldUseRestriction" lowerBound="0"/>
        <property name="attributeUseRestriction" type="d3p1:FieldUseRestriction" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="role" type="d4p1:DataSetFieldRole" lowerBound="0"/>
        <property name="presentationExpression" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="orderExpression" type="d4p1:OrderExpression" lowerBound="0" upperBound="-1"/>
        <property name="inHierarchyDataSet" type="xs:string" lowerBound="0"/>
        <property name="inHierarchyDataSetParameter" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data/core" name="valueType" type="d4p1:TypeDescription" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="appearance" type="d4p1:Appearance" lowerBound="0"/>
        <property name="availableValue" type="d3p1:AvailableValue" lowerBound="0" upperBound="-1"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="inputParameters" type="d4p1:InputParameters" lowerBound="0"/>
    </objectType>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetFieldFolder" base="d3p1:DataSetField">
        <property name="dataPath" type="xs:string"/>
        <property name="title" lowerBound="0"/>
        <property name="useRestriction" type="d3p1:FieldUseRestriction" lowerBound="0"/>
    </objectType>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetFieldNestedDataSet" base="d3p1:DataSetField">
        <property name="dataPath" type="xs:string"/>
        <property name="field" type="xs:string"/>
        <property name="title" lowerBound="0"/>
    </objectType>
    <objectType name="DataSetLink">
        <property name="sourceDataSet" type="xs:string"/>
        <property name="destinationDataSet" type="xs:string"/>
        <property name="sourceExpression" type="xs:string"/>
        <property name="destinationExpression" type="xs:string"/>
        <property name="parameter" type="xs:string" lowerBound="0"/>
        <property name="parameterListAllowed" type="xs:boolean" lowerBound="0"/>
        <property name="linkConditionExpression" type="xs:string" lowerBound="0"/>
        <property name="startExpression" type="xs:string" lowerBound="0"/>
        <property name="required" type="xs:boolean" lowerBound="0"/>
    </objectType>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetObject" base="d3p1:DataSet">
        <property name="dataSource" type="xs:string"/>
        <property name="objectName" type="xs:string"/>
    </objectType>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetQuery" base="d3p1:DataSet">
        <property name="dataSource" type="xs:string"/>
        <property name="query" type="xs:string"/>
        <property name="autoFillFields" type="xs:boolean" lowerBound="0"/>
        <property name="useQueryGroupIfPossible" type="xs:boolean" lowerBound="0"/>
    </objectType>
    <objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetUnion" base="d3p1:DataSet">
        <property name="item" type="d3p1:DataSet" lowerBound="0" upperBound="-1"/>
    </objectType>
    <objectType name="DataSource">
        <property name="name" type="xs:string"/>
        <property name="dataSourceType" type="xs:string"/>
        <property name="connectionString" type="xs:string" lowerBound="0"/>
    </objectType>
    <objectType name="FieldTemplate">
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="field" type="d4p1:Field"/>
        <property name="template" type="xs:string"/>
    </objectType>
    <objectType name="FieldUseRestriction">
        <property name="field" type="xs:boolean" lowerBound="0"/>
        <property name="condition" type="xs:boolean" lowerBound="0"/>
        <property name="group" type="xs:boolean" lowerBound="0"/>
        <property name="order" type="xs:boolean" lowerBound="0"/>
    </objectType>
    <objectType name="GroupTemplate" ordered="false" sequenced="true">
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="groupField" type="d4p1:Field" lowerBound="0" upperBound="-1"/>
        <property name="groupName" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="templateType" type="d4p1:DataCompositionAreaTemplateType" lowerBound="0" default="Header"/>
        <property name="template" type="xs:string"/>
    </objectType>
    <objectType name="NestedDataCompositionSchema">
        <property name="name" type="xs:string"/>
        <property name="title" lowerBound="0"/>
        <property name="URL" type="xs:string"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="schema" type="d4p1:DataCompositionSchema"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/settings" name="settings" type="d4p1:Settings" lowerBound="0"/>
    </objectType>
    <objectType name="Parameter">
        <property name="name" type="xs:string"/>
        <property name="title" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data/core" name="valueType" type="d4p1:TypeDescription" lowerBound="0"/>
        <property name="value" lowerBound="0" upperBound="-1" nillable="true"/>
        <property name="useRestriction" type="xs:boolean" lowerBound="0"/>
        <property name="expression" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="availableValue" type="d4p1:AvailableValue" lowerBound="0" upperBound="-1"/>
        <property name="valueListAllowed" type="xs:boolean" lowerBound="0"/>
        <property name="availableAsField" type="xs:boolean" lowerBound="0"/>
        <property name="functionalOptionsParameter" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="inputParameters" type="d4p1:InputParameters" lowerBound="0"/>
        <property name="denyIncompleteValues" type="xs:boolean" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="use" type="d4p1:DataCompositionParameterUse" lowerBound="0"/>
    </objectType>
    <objectType name="TemplateDefinition">
        <property name="name" type="xs:string"/>
        <property name="template" nillable="true"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/area-template" name="parameter" type="d4p1:AreaTemplateParameter" lowerBound="0" upperBound="-1"/>
    </objectType>
    <objectType name="TotalField">
        <property name="dataPath" type="xs:string"/>
        <property name="expression" type="xs:string"/>
        <property name="group" type="xs:string" lowerBound="0" upperBound="-1"/>
    </objectType>
    <objectType name="TotalFieldsTemplate">
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="groupField1" type="d4p1:Field" lowerBound="0" upperBound="-1"/>
        <property name="groupName1" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="templateType1" type="d4p1:DataCompositionAreaTemplateType" lowerBound="0" default="Header"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="groupField2" type="d4p1:Field" lowerBound="0" upperBound="-1"/>
        <property name="groupName2" type="xs:string" lowerBound="0"/>
        <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="templateType2" type="d4p1:DataCompositionAreaTemplateType" lowerBound="0" default="Header"/>
        <property name="template" type="xs:string"/>
    </objectType>
</package>