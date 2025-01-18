import {
    ItemDataArray,
    BasicFilter,
    ColumnFormat,
    ParsedFilter,
    Connector,
    ColumnMetadata,
    ColumnMetadataParsed,
    ItemTypeParsed,
} from "../interfaces/filter";
import filterToString from "../utils/filterToString";
import stringToFilter from "../utils/stringToFilter";
import validateFilterString from "../utils/validateFilterString";

class Filter {
    private parsedFilter: ParsedFilter;
    private parsedColumns: ColumnMetadataParsed[];
    private dataTypeFormat: "dataset-json1.1" | "xpt" | "parsed";
    private caseInsensitiveColNames: boolean;

    constructor(
        dataTypeFormat: ColumnFormat,
        columns: ColumnMetadata[],
        filter: BasicFilter | string,
        options: { caseInsensitiveColNames: boolean } = { caseInsensitiveColNames: true }
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
        options: { caseInsensitiveColNames: boolean } = { caseInsensitiveColNames: true }
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
            const basicFilter = stringToFilter(filter, this.parsedColumns);
            this.parsedFilter = this.parse(basicFilter, parsedColumns);
        } else {
            this.parsedFilter = this.parse(filter, parsedColumns);
        }
    };

    /**
     * Parse columns - convert column types to standard types
     * @param columns - Column metadata.
     * @return Parsed columns object with standard data types.
     */
    public parseColumns = (
        dataTypeFormat: ColumnFormat,
        columns: ColumnMetadata[]
    ): ColumnMetadataParsed[] => {
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
        const variableIndeces: number[] = [];
        filter.conditions.forEach((condition) => {
            const index = columns.findIndex((column) => {
                if (this.caseInsensitiveColNames) {
                    return column.name.toLowerCase() === condition.variable.toLowerCase();
                } else {
                    return column.name === condition.variable;

                }
            }
            );
            if (index !== -1) {
                variableIndeces.push(index);
            } else {
                throw new Error(`Variable ${condition.variable} not found`);
            }
        });

        // Check the number of connectors corresponds to the number of variables;
        if (filter.conditions.length > 0 && filter.conditions.length - 1 !== filter.connectors.length) {
            throw new Error("Number of logical connectors must be equal to the number of conditions minus one");
        }

        const onlyAndConnectors = filter.connectors.every((connector) => connector === "and");
        const onlyOrConnectors = filter.connectors.every((connector) => connector === "or");

        const variableTypes: ItemTypeParsed[] = columns.map((column) => column.dataType);

        return {
            ...filter,
            variableIndeces,
            onlyAndConnectors,
            onlyOrConnectors,
            variableTypes,
        };
    };

    /**
     * Filter row
     * @param row - Row data.
     * @return True if the row passes the filter, false otherwise.
     */
    public filterRow = (row: ItemDataArray): boolean => {
        const { conditions, variableIndeces, variableTypes, connectors, onlyAndConnectors, onlyOrConnectors, options } =
            this.parsedFilter;
        let result = false;
        let lastConnector: Connector = "and";
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            let value = row[variableIndeces[i]];
            let condValue = condition.value;
            const type = variableTypes[variableIndeces[i]];
            let conditionResult = false;
            if (type === "string" && options?.caseInsensitive === true && value !== null && condValue !== null) {
                value = (value as string).toLowerCase();
                if (condition.operator !== "regex" && !["in", "notin"].includes(condition.operator)) {
                    condValue = (condition.value as string).toLowerCase();
                } else if (["in", "notin"].includes(condition.operator)) {
                    condValue = (condition.value as string[]).map((item) => item.toLowerCase());
                }
            }
            // Common operators
            switch (condition.operator) {
                case "eq":
                    conditionResult = value === condValue;
                    break;
                case "ne":
                    conditionResult = value !== condValue;
                    break;
                case "in":
                    conditionResult = (condValue as unknown as (string | number)[]).includes(value as string | number);
                    break;
                case "notin":
                    conditionResult = !(condValue as unknown as (string | number)[]).includes(value as string | number);
                    break;
                case "missing":
                    conditionResult = (value === null || value === '');
                    break;
                case "notMissing":
                    conditionResult = (value !== null && value !== '');
                    break;
                default:
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
                                conditionResult = new RegExp(condValue as string, options?.caseInsensitive ? "i" : "").test(
                                    value as string
                                );
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
                                throw new Error(`Unknown operator ${condition.operator}`);
                        }
                    } else if (type === "number" && value !== null && condValue !== null) {
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
                                throw new Error(`Unknown operator ${condition.operator}`);
                        }
                    }
            }
            if (i === 0) {
                result = conditionResult;
            } else {
                if (lastConnector === "and") {
                    result = result && conditionResult;
                } else if (lastConnector === "or") {
                    result = result || conditionResult;
                } else {
                    throw new Error(`Unknown connector ${lastConnector}`);
                }
            }
            lastConnector = connectors[i];
            if (onlyAndConnectors && result === false) {
                // In case all connectors are "and" and the result is false, there is no need to check the rest of the conditions
                break;
            }
            if (onlyOrConnectors && result === true) {
                // The same for "or" with true result
                break;
            }
        }
        return result;
    };

    /**
     * Filter dataframe (array of rows)
     * @param data - Dataframe.
     * @return Filtered dataframe.
     */
    public filterDataframe = (data: ItemDataArray[]): ItemDataArray[] => {
        return data.filter((row) => this.filterRow(row));
    }

    /**
     * Validate filter string
     * @param filterString - Filter string.
     * @returns True if the filter string is valid, false otherwise.
     */
    public validateFilterString = (filterString: string): boolean => {
        try {
            return validateFilterString(filterString, this.parsedColumns, this.caseInsensitiveColNames);
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
            options: this.parsedFilter.options,
        };
    };

    /**
     * Convert filter object to string
     * @param filter - Optional filter string.
     * @returns Filter string.
     */
    public toString = (filter?: BasicFilter): string => {
        return filterToString(filter !== undefined ? filter : this.parsedFilter);
    };
}

export default Filter;
