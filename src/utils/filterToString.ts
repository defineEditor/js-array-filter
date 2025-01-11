import { BasicFilter } from "../interfaces/filter";
import { operatorLabels } from "./constants";

// Convert a filter object to a string
const filterToString = (filter: BasicFilter): string => {
    const { conditions, connectors } = filter;
    let filterString = "";

    conditions.forEach((condition, index) => {
        const { variable, operator, value, isFunction } = condition;
        let valueString = "";

        if (isFunction) {
            filterString += `${operator}(${variable})`;
        } else {
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    valueString = "()";
                } else if (typeof value[0] === "string") {
                    valueString = `("${value.join('", "')}")`;
                } else {
                    valueString = `(${value.join(", ")})`;
                }
            } else if (typeof value === "string") {
                valueString = `"${value}"`;
            } else {
                valueString = String(value);
            }

            let comparator = "eq";
            if (Object.prototype.hasOwnProperty.call(operatorLabels, operator)) {
                comparator = operatorLabels[operator];
            }

            filterString += `${variable} ${comparator} ${valueString}`;
        }

        if (index < connectors.length) {
            filterString += ` ${connectors[index]} `;
        }
    });

    return filterString.trim();
};

export default filterToString;
