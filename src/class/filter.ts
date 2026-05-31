import {
    ItemDataArray,
    BasicFilter,
    ColumnFormat,
    ParsedFilter,
    ColumnMetadata,
    ColumnMetadataParsed,
    ItemTypeParsed,
    ExpressionNode,
    FilterCondition,
} from "../interfaces/filter";
import { buildExpressionTree, filterExpressionToString, parseFilterString } from "../utils/filterExpression";
import stringToFilter from "../utils/stringToFilter";

type RowEvaluator = (row: ItemDataArray) => boolean;

class Filter {
    private parsedFilter: ParsedFilter;
    private expressionTree: ExpressionNode | null;
    private rowEvaluator: RowEvaluator;
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
        this.rowEvaluator = this.buildRowEvaluator();
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
        this.rowEvaluator = this.buildRowEvaluator();
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

    private buildStringConditionEvaluator = (
        condition: FilterCondition,
        variableIndex: number,
        compareVariableIndex: number | null | undefined,
        caseInsensitive: boolean,
    ): RowEvaluator => {
        const hasCompareVariable = compareVariableIndex !== null && compareVariableIndex !== undefined;
        const operator = condition.operator;

        if (operator === "missing") {
            return (row) => row[variableIndex] === null || row[variableIndex] === "";
        }

        if (operator === "notMissing") {
            return (row) => row[variableIndex] !== null && row[variableIndex] !== "";
        }

        if (!hasCompareVariable) {
            if (operator === "regex") {
                const regex = new RegExp(condition.value as string, caseInsensitive ? "i" : "");
                return (row) => {
                    const value = row[variableIndex];
                    return value !== null && regex.test(value as string);
                };
            }

            if (operator === "in" || operator === "notin") {
                const values = caseInsensitive
                    ? (condition.value as string[]).map((item) => item.toLowerCase())
                    : (condition.value as string[]);
                return (row) => {
                    const value = row[variableIndex];
                    if (value === null) {
                        return operator === "notin";
                    }
                    const contains = values.includes(caseInsensitive ? (value as string).toLowerCase() : (value as string));
                    return operator === "in" ? contains : !contains;
                };
            }

            const constantValue =
                typeof condition.value === "string" && caseInsensitive ? condition.value.toLowerCase() : condition.value;

            switch (operator) {
                case "eq":
                    return (row) => {
                        const value = row[variableIndex];
                        return caseInsensitive && value !== null && constantValue !== null
                            ? (value as string).toLowerCase() === constantValue
                            : value === condition.value;
                    };
                case "ne":
                    return (row) => {
                        const value = row[variableIndex];
                        return caseInsensitive && value !== null && constantValue !== null
                            ? (value as string).toLowerCase() !== constantValue
                            : value !== condition.value;
                    };
                case "starts":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)).startsWith(
                            constantValue as string,
                        );
                    };
                case "ends":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)).endsWith(
                            constantValue as string,
                        );
                    };
                case "contains":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)).includes(
                            constantValue as string,
                        );
                    };
                case "notcontains":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return !(caseInsensitive ? (value as string).toLowerCase() : (value as string)).includes(
                            constantValue as string,
                        );
                    };
                case "lt":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)) < (constantValue as string);
                    };
                case "le":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)) <= (constantValue as string);
                    };
                case "gt":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)) > (constantValue as string);
                    };
                case "ge":
                    return (row) => {
                        const value = row[variableIndex];
                        if (value === null || constantValue === null) {
                            return false;
                        }
                        return (caseInsensitive ? (value as string).toLowerCase() : (value as string)) >= (constantValue as string);
                    };
                default:
                    return () => {
                        throw new Error(`Unknown operator ${condition.operator} for type string`);
                    };
            }
        }

        switch (operator) {
            case "eq":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (caseInsensitive && value !== null && compareValue !== null) {
                        return (value as string).toLowerCase() === (compareValue as string).toLowerCase();
                    }
                    return value === compareValue;
                };
            case "ne":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (caseInsensitive && value !== null && compareValue !== null) {
                        return (value as string).toLowerCase() !== (compareValue as string).toLowerCase();
                    }
                    return value !== compareValue;
                };
            case "starts":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue.startsWith(normalizedCompareValue);
                };
            case "ends":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue.endsWith(normalizedCompareValue);
                };
            case "contains":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue.includes(normalizedCompareValue);
                };
            case "notcontains":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return !normalizedValue.includes(normalizedCompareValue);
                };
            case "regex":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    return new RegExp(compareValue as string, caseInsensitive ? "i" : "").test(value as string);
                };
            case "lt":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue < normalizedCompareValue;
                };
            case "le":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue <= normalizedCompareValue;
                };
            case "gt":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue > normalizedCompareValue;
                };
            case "ge":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    if (value === null || compareValue === null) {
                        return false;
                    }
                    const normalizedValue = caseInsensitive ? (value as string).toLowerCase() : (value as string);
                    const normalizedCompareValue = caseInsensitive ? (compareValue as string).toLowerCase() : (compareValue as string);
                    return normalizedValue >= normalizedCompareValue;
                };
            default:
                return () => {
                    throw new Error(`Unknown operator ${condition.operator} for type string`);
                };
        }
    };

    private buildNumberConditionEvaluator = (
        condition: FilterCondition,
        variableIndex: number,
        compareVariableIndex: number | null | undefined,
    ): RowEvaluator => {
        const hasCompareVariable = compareVariableIndex !== null && compareVariableIndex !== undefined;
        const operator = condition.operator;

        if (operator === "missing") {
            return (row) => row[variableIndex] === null || row[variableIndex] === "";
        }

        if (operator === "notMissing") {
            return (row) => row[variableIndex] !== null && row[variableIndex] !== "";
        }

        if (operator === "in" || operator === "notin") {
            const values = condition.value as number[];
            return (row) => {
                const value = row[variableIndex];
                const contains = values.includes(value as number);
                return operator === "in" ? contains : !contains;
            };
        }

        if (!hasCompareVariable) {
            const constantValue = condition.value as number | null;
            switch (operator) {
                case "eq":
                    return (row) => row[variableIndex] === constantValue;
                case "ne":
                    return (row) => row[variableIndex] !== constantValue;
                case "lt":
                    return (row) =>
                        row[variableIndex] !== null && constantValue !== null && (row[variableIndex] as number) < constantValue;
                case "le":
                    return (row) =>
                        row[variableIndex] !== null && constantValue !== null && (row[variableIndex] as number) <= constantValue;
                case "gt":
                    return (row) =>
                        row[variableIndex] !== null && constantValue !== null && (row[variableIndex] as number) > constantValue;
                case "ge":
                    return (row) =>
                        row[variableIndex] !== null && constantValue !== null && (row[variableIndex] as number) >= constantValue;
                default:
                    return () => {
                        throw new Error(`Unknown operator ${condition.operator} for type number`);
                    };
            }
        }

        switch (operator) {
            case "eq":
                return (row) => row[variableIndex] === row[compareVariableIndex];
            case "ne":
                return (row) => row[variableIndex] !== row[compareVariableIndex];
            case "lt":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    return value !== null && compareValue !== null && (value as number) < (compareValue as number);
                };
            case "le":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    return value !== null && compareValue !== null && (value as number) <= (compareValue as number);
                };
            case "gt":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    return value !== null && compareValue !== null && (value as number) > (compareValue as number);
                };
            case "ge":
                return (row) => {
                    const value = row[variableIndex];
                    const compareValue = row[compareVariableIndex];
                    return value !== null && compareValue !== null && (value as number) >= (compareValue as number);
                };
            default:
                return () => {
                    throw new Error(`Unknown operator ${condition.operator} for type number`);
                };
        }
    };

    private buildBooleanConditionEvaluator = (
        condition: FilterCondition,
        variableIndex: number,
        compareVariableIndex: number | null | undefined,
    ): RowEvaluator => {
        const hasCompareVariable = compareVariableIndex !== null && compareVariableIndex !== undefined;
        const operator = condition.operator;

        switch (operator) {
            case "missing":
                return (row) => row[variableIndex] === null || row[variableIndex] === "";
            case "notMissing":
                return (row) => row[variableIndex] !== null && row[variableIndex] !== "";
            case "eq":
                return hasCompareVariable
                    ? (row) => row[variableIndex] === row[compareVariableIndex]
                    : (row) => row[variableIndex] === condition.value;
            case "ne":
                return hasCompareVariable
                    ? (row) => row[variableIndex] !== row[compareVariableIndex]
                    : (row) => row[variableIndex] !== condition.value;
            default:
                return () => {
                    throw new Error(`Unknown operator ${condition.operator} for type boolean`);
                };
        }
    };

    private buildConditionEvaluator = (conditionIndex: number): RowEvaluator => {
        const { conditions, compareVariableIndeces, options, variableIndeces, variableTypes } = this.parsedFilter;
        const condition = conditions[conditionIndex];
        const variableIndex = variableIndeces[conditionIndex];
        const compareVariableIndex = compareVariableIndeces?.[conditionIndex];
        const type = variableTypes[variableIndex];

        if (type === "string") {
            return this.buildStringConditionEvaluator(
                condition,
                variableIndex,
                compareVariableIndex,
                options?.caseInsensitive === true,
            );
        }

        if (type === "number") {
            return this.buildNumberConditionEvaluator(condition, variableIndex, compareVariableIndex);
        }

        return this.buildBooleanConditionEvaluator(condition, variableIndex, compareVariableIndex);
    };

    private buildExpressionEvaluator = (node: ExpressionNode, conditionEvaluators: RowEvaluator[]): RowEvaluator => {
        if (node.type === "condition") {
            return conditionEvaluators[node.conditionIndex];
        }

        const leftEvaluator = this.buildExpressionEvaluator(node.left, conditionEvaluators);
        const rightEvaluator = this.buildExpressionEvaluator(node.right, conditionEvaluators);
        if (node.connector === "and") {
            return (row) => leftEvaluator(row) && rightEvaluator(row);
        }
        if (node.connector === "or") {
            return (row) => leftEvaluator(row) || rightEvaluator(row);
        }

        return () => {
            throw new Error(`Unknown connector ${node.connector}`);
        };
    };

    private buildRowEvaluator = (): RowEvaluator => {
        if (this.expressionTree === null) {
            return () => true;
        }

        const conditionEvaluators = this.parsedFilter.conditions.map((_, conditionIndex) =>
            this.buildConditionEvaluator(conditionIndex),
        );
        return this.buildExpressionEvaluator(this.expressionTree, conditionEvaluators);
    };

    /**
     * Filter row
     * @param row - Row data.
     * @return True if the row passes the filter, false otherwise.
     */
    public filterRow = (row: ItemDataArray): boolean => {
        return this.rowEvaluator(row);
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
        const basicFilter: BasicFilter = {
            conditions: this.parsedFilter.conditions,
            connectors: this.parsedFilter.connectors,
        };
        if (this.parsedFilter.connectorPriorities !== undefined) {
            basicFilter.connectorPriorities = this.parsedFilter.connectorPriorities;
        }
        if (this.parsedFilter.options !== undefined) {
            basicFilter.options = this.parsedFilter.options;
        }
        return basicFilter;
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
