import { BasicFilter, ColumnMetadataParsed } from "../interfaces/filter";
import { parseFilterString } from "./filterExpression";

// Conver filter string to filter object
const stringToFilter = (
    filterStringRaw: string,
    columns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean = true,
): BasicFilter => {
    try {
        return parseFilterString(filterStringRaw, columns, caseInsensitiveColNames);
    } catch (error) {
        return { conditions: [], connectors: [] };
    }
};

export default stringToFilter;
