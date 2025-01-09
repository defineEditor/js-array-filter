import filterRegex from './filterRegex';
import makeRegexStrict from './makeRegexStrict';
import { operatorLabelsInverse } from './constants';
import { FilterCondition, BasicFilter, Connector, ColumnMetadataParsed, ItemTypeParsed } from '../interfaces/filter';

// Conver filter string to filter object
const stringToFilter = (
    filterStringRaw: string,
    columns: ColumnMetadataParsed[],
): BasicFilter => {
    const colTypes: { [name: string] : ItemTypeParsed } = columns.reduce( (acc, column) => {
        acc[column.name] = column.dataType;
        return acc;
    }, {} as { [name: string] : ItemTypeParsed });
    const result: BasicFilter = { conditions: [], connectors: [] };
    try {
        // Trim leading and trailing spaces;
        const filterString = filterStringRaw.trim();

        // Detailed check: check that proper variables are specified
        const rawFilter = filterRegex.filter.exec(filterString);
        // Remove all undefined conditions (coming from (AND condition) part) and connectors
        const rawFilterUpdated = (rawFilter as string[]).filter(
            (element) =>
                element !== undefined &&
                makeRegexStrict(filterRegex.conditionConnector).test(
                    element,
                ) === false,
        );
        // If there is more than one condition, extract them one by one;
        const rawConditionChecks: string[] = [];
        if (rawFilterUpdated.length >= 3) {
            let rawConditions = filterString;
            let rawConditionCheck =
                filterRegex.conditionExtract.exec(rawConditions);
            const nextConditionConnector = new RegExp(
                `${filterRegex.condition.source}\\s*(${filterRegex.conditionConnector.source})?\\s*.*$`,
                'i',
            );
            const nextConditionCheckRegex = new RegExp(
                `${filterRegex.condition.source}\\s*${filterRegex.conditionConnector.source}?\\s*(.*)$`,
                'i',
            );
            while (rawConditionCheck !== null) {
                rawConditionChecks.push(rawConditionCheck[1]);
                const connector = rawConditions.replace(
                    nextConditionConnector,
                    '$1',
                );
                rawConditions = rawConditions
                    .replace(nextConditionCheckRegex, '$1')
                    .trim();
                rawConditionCheck =
                    filterRegex.conditionExtract.exec(rawConditions);
                if (connector !== '') {
                    result.connectors.push(connector as Connector);
                }
            }
        } else {
            // Only 1 condition is provided;
            rawConditionChecks.push(rawFilterUpdated[1]);
        }
        // Extract variable names
        rawConditionChecks.forEach((rawConditionCheck) => {
            // Default to failed
            let conditionElements = (
                filterRegex.conditionParse.exec(rawConditionCheck) as string[]
            ).slice(1);
            // Remove all undefined elements (come from the (in|notin) vs (eq,ne,...) fork)
            conditionElements = conditionElements.filter(
                (element) => element !== undefined,
            );
            const columnName = conditionElements[0];
            const comparator = conditionElements[1].toLowerCase();
            const rawValue = conditionElements[2];
            let value: FilterCondition['value'] = rawValue;

            let operator: FilterCondition['operator'] = 'eq';

            if (
                Object.prototype.hasOwnProperty.call(
                    operatorLabelsInverse,
                    comparator,
                )
            ) {
                operator = operatorLabelsInverse[comparator];
            }

            let isMultipleValue = false;
            // If multiple values are provided, split them into an array;
            if (['in', 'notin'].includes(comparator)) {
                isMultipleValue = true;
            }

            const colType = colTypes[columnName.toLowerCase()];

            if (value === 'null') {
                value = null;
            } else if (colType === 'number') {
                if (!isMultipleValue) {
                    value = parseFloat(value as string);
                } else if (isMultipleValue) {
                    value = rawValue
                        .trim()
                        .replace(/^\((.*)\)$/, '$1')
                        .split(',')
                        .map((item) => parseFloat(item));
                }
            } else if (colType === 'boolean') {
                value = value.toLowerCase() === 'true';
            } else if (colType === 'string') {
                if (!isMultipleValue) {
                    // Remove quotes
                    value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
                } else if (isMultipleValue) {
                    // Remove brackets, split by comma, remove quotes
                    value = rawValue
                        .trim()
                        .replace(/^\((.*)\)$/, '$1')
                        .split(',')
                        .map((item) =>
                            item.trim().replace(/^(['"])(.*)\1$/, '$2'),
                        );
                }
            }

            const condition: FilterCondition = {
                variable: columnName,
                operator,
                value,
            };

            result.conditions.push(condition);
        });
    } catch (error) {
        return result;
    }
    return result;
};

export default stringToFilter;
