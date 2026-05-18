import { BasicFilter } from "../interfaces/filter";
import { filterExpressionToString } from "./filterExpression";

// Convert a filter object to a string
const filterToString = (filter: BasicFilter): string => {
    return filterExpressionToString(filter).trim();
};

export default filterToString;
