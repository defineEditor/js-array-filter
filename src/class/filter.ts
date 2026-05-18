import {
    ItemDataArray,
    BasicFilter,
    ColumnFormat,
    ParsedFilter,
    ColumnMetadata,
    ColumnMetadataParsed,
    ItemTypeParsed,
    ExpressionNode,
} from "../interfaces/filter";
import { buildExpressionTree, filterExpressionToString, parseFilterString } from "../utils/filterExpression";
import stringToFilter from "../utils/stringToFilter";

class Filter {
    private parsedFilter: ParsedFilter;
    private expressionTree: ExpressionNode | null;
    private parsedColumns: ColumnMetadataParsed[];
    private dataTypeFormat: "dataset-json1.1" | "xpt" | "parsed";
    private caseInsensitiveColNames: boolean;

    constructor(
        dataTypeFormat: ColumnFormat,
        columns: ColumnMetadata[],
        filter: BasicFilter | string,
        options: { caseInsensitiveColNames: boolean } = { caseInsensitiveColNames: true },
    ) {
        this.caseInsensitiveColNames = options.caseInsensitiveColNames;
        // Column Format
        if (["dataset-json1.1", "xpt", "parsed"].indexOf(dataTypeFormat) === -1) {
            throw new Error(`Unknown column format ${dataTypeFormat}, supported formats are: json, xpt, parsed`);
        } else {
            this.dataTypeFormat = dataTypeFormat;
        }

        // Parse columns
        this.parsedColumns = this.parseColumns(dataTypeFormat, columns);

        // Parse filter
        if (typeof filter === "string") {
            const basicFilter = stringToFilter(filter, this.parsedColumns, this.caseInsensitiveColNames);
            this.parsedFilter = this.parse(basicFilter, this.parsedColumns);
        } else {
            this.parsedFilter = this.parse(filter, this.parsedColumns);
        }
        this.expressionTree = buildExpressionTree(this.parsedFilter);
    }

    /**
     * Update filter
     * @param filter - Filter object.
     * @param columns - Column metadata.
     * @return Parsed filter object with variable indeces added.
     */

    public update = (
        filter: BasicFilter | string,
        columns?: Array<ColumnMetadata>,
        options: { caseInsensitiveColNames: boolean } = { caseInsensitiveColNames: true },
    ): void => {
        this.caseInsensitiveColNames = options.caseInsensitiveColNames;
        let parsedColumns: ColumnMetadataParsed[];
        if (columns !== undefined) {
            this.parsedColumns = this.parseColumns(this.dataTypeFormat, columns);
            parsedColumns = this.parsedColumns;
        } else {
            parsedColumns = this.parsedColumns;
        }
        if (typeof filter === "string") {
            const basicFilter = stringToFilter(filter, this.parsedColumns, this.caseInsensitiveColNames);
            this.parsedFilter = this.parse(basicFilter, parsedColumns);
        } else {
            this.parsedFilter = this.parse(filter, parsedColumns);
        }
        this.expressionTree = buildExpressionTree(this.parsedFilter);
    };

    /**
     * Parse columns - convert column types to standard types
     * @param columns - Column metadata.
     * @return Parsed columns object with standard data types.
     */
    public parseColumns = (dataTypeFormat: ColumnFormat, columns: ColumnMetadata[]): ColumnMetadataParsed[] => {
        let result: ColumnMetadataParsed[] = [];
        if (dataTypeFormat === "parsed") {
            result = columns as ColumnMetadataParsed[];
        } else if (dataTypeFormat === "dataset-json1.1") {
            columns.forEach((column) => {
                if (["string", "date", "decimal", "datetime", "time", "URI"].includes(column.dataType)) {
                    result.push({ name: column.name, dataType: "string" });
                } else if (["integer", "float", "double"].includes(column.dataType)) {
                    result.push({ name: column.name, dataType: "number" });
                } else if (column.dataType === "boolean") {
                    result.push({ name: column.name, dataType: "boolean" });
                } else {
                    throw new Error(`Unknown variable type ${column.dataType} for variable ${column.name}`);
                }
            });
        } else if (dataTypeFormat === "xpt") {
            columns.forEach((column) => {
                if (["Char"].includes(column.dataType)) {
                    result.push({ name: column.name, dataType: "string" });
                } else if (["Num"].includes(column.dataType)) {
                    result.push({ name: column.name, dataType: "number" });
                } else {
                    throw new Error(`Unknown variable type ${column.dataType} for variable ${column.name}`);
                }
            });
        }

        return result;
    };

    /**
     * Parse filter
     * @param filter - Filter object.
     * @param columns - Column metadata.
     * @return Parsed filter object with variable indeces added.
     */
    private parse = (filter: BasicFilter, columns: ColumnMetadataParsed[]): ParsedFilter => {
        const getColumnIndex = (variableName: string): number => {
            return columns.findIndex((column) => {
                if (this.caseInsensitiveColNames) {
                    return column.name.toLowerCase() === variableName.toLowerCase();
                }

                return column.name === variableName;
            });
        };

        const variableIndeces = filter.conditions.map((condition) => {
            const index = getColumnIndex(condition.variable);
            if (index === -1) {
                throw new Error(`Variable ${condition.variable} not found`);
            }
            return index;
        });

        // Check the number of connectors corresponds to the number of variables;
        if (filter.conditions.length > 0 && filter.conditions.length - 1 !== filter.connectors.length) {
            throw new Error("Number of logical connectors must be equal to the number of conditions minus one");
        }

        if (filter.connectorPriorities !== undefined && filter.connectorPriorities.length !== filter.connectors.length) {
            throw new Error("Number of connector priorities must be equal to the number of connectors");
        }

        const compareVariableIndeces = filter.conditions.some((condition) => condition.compareVariable !== undefined)
            ? filter.conditions.map((condition, conditionIndex) => {
                  if (condition.compareVariable === undefined) {
                      return null;
                  }
                  if (condition.value !== null) {
                      throw new Error("Condition value must be null when compareVariable is specified");
                  }

                  const index = getColumnIndex(condition.compareVariable);
                  if (index === -1) {
                      throw new Error(`Variable ${condition.compareVariable} not found`);
                  }

                  if (columns[index].dataType !== columns[variableIndeces[conditionIndex]].dataType) {
                      throw new Error(`Variable ${condition.compareVariable} type does not match ${condition.variable}`);
                  }

                  return index;
              })
            : undefined;

        const variableTypes: ItemTypeParsed[] = columns.map((column) => column.dataType);

        return {
            ...filter,
            variableIndeces,
            compareVariableIndeces,
            variableTypes,
        };
    };

    private evaluateCondition = (conditionIndex: number, row: ItemDataArray): boolean => {
        const { conditions, compareVariableIndeces, options, variableIndeces, variableTypes } = this.parsedFilter;
        const condition = conditions[conditionIndex];
        const variableIndex = variableIndeces[conditionIndex];
        const type = variableTypes[variableIndex];
        let value = row[variableIndex];
        let condValue: string | number | boolean | null | string[] | number[] =
            compareVariableIndeces?.[conditionIndex] !== null && compareVariableIndeces?.[conditionIndex] !== undefined
                ? row[compareVariableIndeces[conditionIndex] as number]
                : condition.value;
        let conditionResult = false;

        if (type === "string" && options?.caseInsensitive === true && value !== null && condValue !== null) {
            value = (value as string).toLowerCase();
            if (Array.isArray(condValue)) {
                condValue = (condValue as string[]).map((item) => item.toLowerCase());
            } else if (condition.operator !== "regex") {
                condValue = (condValue as string).toLowerCase();
            }
        }

        switch (condition.operator) {
            case "eq":
                return value === condValue;
            case "ne":
                return value !== condValue;
            case "in":
                return (condValue as Array<string | number>).includes(value as string | number);
            case "notin":
                return !(condValue as Array<string | number>).includes(value as string | number);
            case "missing":
                return value === null || value === "";
            case "notMissing":
                return value !== null && value !== "";
            default:
                break;
        }

        if (type === "string" && value !== null && condValue !== null) {
            switch (condition.operator) {
                case "starts":
                    conditionResult = (value as string).startsWith(condValue as string);
                    break;
                case "ends":
                    conditionResult = (value as string).endsWith(condValue as string);
                    break;
                case "contains":
                    conditionResult = (value as string).includes(condValue as string);
                    break;
                case "notcontains":
                    conditionResult = !(value as string).includes(condValue as string);
                    break;
                case "regex":
                    conditionResult = new RegExp(condValue as string, options?.caseInsensitive ? "i" : "").test(value as string);
                    break;
                case "lt":
                    conditionResult = value < condValue;
                    break;
                case "le":
                    conditionResult = value <= condValue;
                    break;
                case "gt":
                    conditionResult = value > condValue;
                    break;
                case "ge":
                    conditionResult = value >= condValue;
                    break;
                default:
                    throw new Error(`Unknown operator ${condition.operator} for type ${type}`);
            }
            return conditionResult;
        }

        if (type === "number" && value !== null && condValue !== null) {
            switch (condition.operator) {
                case "lt":
                    conditionResult = value < condValue;
                    break;
                case "le":
                    conditionResult = value <= condValue;
                    break;
                case "gt":
                    conditionResult = value > condValue;
                    break;
                case "ge":
                    conditionResult = value >= condValue;
                    break;
                default:
                    throw new Error(`Unknown operator ${condition.operator} for type ${type}`);
            }
            return conditionResult;
        }

        throw new Error(`Unknown operator ${condition.operator} for type ${type}`);
    };

    private evaluateExpressionNode = (node: ExpressionNode, row: ItemDataArray): boolean => {
        if (node.type === "condition") {
            return this.evaluateCondition(node.conditionIndex, row);
        }

        const leftResult = this.evaluateExpressionNode(node.left, row);
        if (node.connector === "and") {
            return leftResult && this.evaluateExpressionNode(node.right, row);
        }
        if (node.connector === "or") {
            return leftResult || this.evaluateExpressionNode(node.right, row);
        }

        throw new Error(`Unknown connector ${node.connector}`);
    };

    /**
     * Filter row
     * @param row - Row data.
     * @return True if the row passes the filter, false otherwise.
     */
    public filterRow = (row: ItemDataArray): boolean => {
        if (this.expressionTree === null) {
            return true;
        }

        return this.evaluateExpressionNode(this.expressionTree, row);
    };

    /**
     * Filter dataframe (array of rows)
     * @param data - Dataframe.
     * @return Filtered dataframe.
     */
    public filterDataframe = (data: ItemDataArray[]): ItemDataArray[] => {
        return data.filter((row) => this.filterRow(row));
    };

    /**
     * Validate filter string
     * @param filterString - Filter string.
     * @returns True if the filter string is valid, false otherwise.
     */
    public validateFilterString = (filterString: string): boolean => {
        try {
            parseFilterString(filterString, this.parsedColumns, this.caseInsensitiveColNames);
            return true;
        } catch (error) {
            return false;
        }
    };

    /**
     * Convert filter to basic filter object
     * @param filterString - Filter string.
     * @returns Filter object.
     */
    public toBasicFilter = (): BasicFilter => {
        return {
            conditions: this.parsedFilter.conditions,
            connectors: this.parsedFilter.connectors,
            connectorPriorities: this.parsedFilter.connectorPriorities,
            options: this.parsedFilter.options,
        };
    };

    /**
     * Convert filter object to string
     * @param filter - Optional filter string.
     * @returns Filter string.
     */
    public toString = (filter?: BasicFilter): string => {
        return filterExpressionToString(filter !== undefined ? filter : this.parsedFilter).trim();
    };
}

export default Filter;
