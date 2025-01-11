export type StringOperator = 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'notin' | 'eq' | 'ne' |
    'starts' | 'ends' | 'contains' | 'notcontains' | 'regex' | 'notMissing' | 'missing';
export type NumberOperator = 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'notin' | 'eq' | 'ne' | 'notMissing' | 'missing';
export type BooleanOperator = 'eq' | 'ne' | 'notMissing' | 'missing';

export type ItemTypeDatasetJson =
    | 'string'
    | 'integer'
    | 'float'
    | 'double'
    | 'decimal'
    | 'boolean'
    | 'date'
    | 'time'
    | 'datetime'
    | 'URI'
    ;

export type ItemTypeXpt =
    | 'string'
    | 'number'
    ;

export type ItemTypeParsed =
    | 'string'
    | 'number'
    | 'boolean'
    ;

export type ColumnFormat = 'dataset-json1.1' | 'xpt' | 'parsed';

export type ItemDataArray = Array<string | number | boolean | null >;

export type ColumnMetadataDatasetJson = { name: string, dataType: ItemTypeDatasetJson}
export type ColumnMetadataXpt = { name: string, dataType: ItemTypeXpt}
export type ColumnMetadataParsed = { name: string, dataType: ItemTypeParsed}

export type ColumnMetadata = ColumnMetadataDatasetJson | ColumnMetadataXpt | ColumnMetadataParsed;

export type Connector = 'and' | 'or';

export interface FilterCondition {
    variable: string;
    operator: StringOperator | NumberOperator | BooleanOperator;
    value: string | number | boolean | null | string[] | number[];
    isFunction?: boolean;
}

export interface BasicFilter {
    conditions: FilterCondition[];
    connectors: Connector[];
    options?: {
        caseInsensitive: boolean;
    };
}

export interface ParsedFilter extends BasicFilter {
    variableIndeces: number[];
    variableTypes: string[];
    onlyAndConnectors: boolean;
    onlyOrConnectors: boolean;
}