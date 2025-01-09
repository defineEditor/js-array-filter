export type StringOperator = 'in' | 'notin' | 'eq' | 'ne' | 'starts' | 'ends' | 'contains' | 'notcontains' | 'regex';
export type DateOperator = 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'notin' | 'eq' | 'ne' |
    'starts' | 'ends' | 'contains' | 'notcontains' | 'regex';
export type NumberOperator = 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'notin' | 'eq' | 'ne';
export type BooleanOperator = 'eq' | 'ne';

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

export type ColumnFormat = 'json' | 'xpt' | 'parsed';

export type ItemDataArray = Array<string | number | boolean | null >;

export type ColumnMetadataDatasetJson = { name: string, dataType: ItemTypeDatasetJson}
export type ColumnMetadataXpt = { name: string, dataType: ItemTypeXpt}
export type ColumnMetadataParsed = { name: string, dataType: ItemTypeParsed}

export type ColumnMetadata = ColumnMetadataDatasetJson | ColumnMetadataXpt | ColumnMetadataParsed;

export type Connector = 'and' | 'or';

export interface FilterCondition {
    variable: string;
    operator: StringOperator | DateOperator | NumberOperator | BooleanOperator;
    value: string | number | boolean | null | string[] | number[];
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