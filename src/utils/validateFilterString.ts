import { ColumnMetadataParsed } from "../interfaces/filter";
import { parseFilterString } from "./filterExpression";

// Validate filter string
const validateFilterString = (
    filterStringRaw: string,
    parsedColumns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean = true,
) => {
    try {
        parseFilterString(filterStringRaw, parsedColumns, caseInsensitiveColNames);
        return true;
    } catch (error) {
        return false;
    }
};

export default validateFilterString;
