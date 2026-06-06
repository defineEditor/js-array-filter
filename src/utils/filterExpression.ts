import { BasicFilter, ColumnMetadataParsed, Connector, FilterCondition, ItemTypeParsed, ExpressionNode } from "../interfaces/filter";
import { operatorLabels, operatorLabelsInverse } from "./constants";
import { filterRegex } from "./filterRegex";
import makeRegexStrict from "./makeRegexStrict";

type FlatExpression = {
    conditions: FilterCondition[];
    connectors: Connector[];
    connectorPriorities: number[];
};

type ParserState = {
    input: string;
    position: number;
};

const splitCommaRespectingQuotes = (input: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inSingle = false;
    let inDouble = false;

    for (let index = 0; index < input.length; index++) {
        const character = input[index];
        if (character === '"' && !inSingle) {
            inDouble = !inDouble;
            current += character;
            continue;
        }
        if (character === "'" && !inDouble) {
            inSingle = !inSingle;
            current += character;
            continue;
        }
        if (character === "," && !inSingle && !inDouble) {
            result.push(current.trim());
            current = "";
            continue;
        }
        current += character;
    }

    if (current.trim() !== "") {
        result.push(current.trim());
    }

    return result;
};

const resolveColumnName = (rawColumnName: string, columns: ColumnMetadataParsed[], caseInsensitiveColNames: boolean): string | null => {
    if (caseInsensitiveColNames) {
        const column = columns.find((item) => item.name.toLowerCase() === rawColumnName.toLowerCase());
        return column?.name ?? null;
    }

    return columns.find((item) => item.name === rawColumnName)?.name ?? null;
};

const getColumnTypes = (columns: ColumnMetadataParsed[]): Record<string, ItemTypeParsed> => {
    return columns.reduce(
        (accumulator, column) => {
            accumulator[column.name] = column.dataType;
            return accumulator;
        },
        {} as Record<string, ItemTypeParsed>,
    );
};

const parseLiteralValue = (rawValue: string, columnType: ItemTypeParsed, isMultipleValue: boolean): FilterCondition["value"] => {
    if (rawValue === "null") {
        return null;
    }

    if (columnType === "number") {
        if (!isMultipleValue) {
            const parsedValue = Number(rawValue);
            if (Number.isNaN(parsedValue)) {
                throw new Error(`Invalid numeric value ${rawValue}`);
            }
            return parsedValue;
        }

        const items = rawValue.trim().replace(/^\((.*)\)$/s, "$1");
        return items === ""
            ? []
            : items.split(",").map((item) => {
                  const parsedValue = Number(item.trim());
                  if (Number.isNaN(parsedValue)) {
                      throw new Error(`Invalid numeric value ${item.trim()}`);
                  }
                  return parsedValue;
              });
    }

    if (columnType === "boolean") {
        const normalized = rawValue.toLowerCase();
        if (!["true", "false"].includes(normalized)) {
            throw new Error(`Invalid boolean value ${rawValue}`);
        }
        return normalized === "true";
    }

    if (!isMultipleValue) {
        const match = rawValue.match(/^(["'])(.*)\1$/s);
        if (match === null) {
            throw new Error(`Invalid string value ${rawValue}`);
        }
        const quote = match[1];
        const value = match[2];
        const escapedQuote = quote === '"' ? '\\\\"' : "\\\\'";
        return value.replace(new RegExp(escapedQuote, "g"), quote);
    }

    const items = rawValue.trim().replace(/^\((.*)\)$/s, "$1");
    if (items === "") {
        return [];
    }

    return splitCommaRespectingQuotes(items).map((item) => {
        const match = item.match(/^(["'])(.*)\1$/s);
        if (match === null) {
            throw new Error(`Invalid string value ${item}`);
        }
        const quote = match[1];
        const value = match[2];
        const escapedQuote = quote === '"' ? '\\\\"' : "\\\\'";
        return value.replace(new RegExp(escapedQuote, "g"), quote);
    });
};

export const parseConditionString = (
    rawCondition: string,
    columns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean,
): FilterCondition => {
    const trimmedCondition = rawCondition.trim();
    const columnTypes = getColumnTypes(columns);
    const functionMatch = makeRegexStrict(filterRegex.conditionFunctionParse).exec(trimmedCondition);

    if (functionMatch !== null) {
        const rawVariable = functionMatch[2];
        const variable = resolveColumnName(rawVariable, columns, caseInsensitiveColNames);
        if (variable === null) {
            throw new Error(`Variable ${rawVariable} not found`);
        }

        return {
            variable,
            operator: functionMatch[1] as FilterCondition["operator"],
            value: null,
            isFunction: true,
        };
    }

    const comparatorMatch = makeRegexStrict(filterRegex.conditionComparatorParse).exec(trimmedCondition);
    if (comparatorMatch === null) {
        throw new Error(`Invalid condition ${trimmedCondition}`);
    }

    const rawVariable = comparatorMatch[1];
    const variable = resolveColumnName(rawVariable, columns, caseInsensitiveColNames);
    if (variable === null) {
        throw new Error(`Variable ${rawVariable} not found`);
    }

    const rawComparator = (comparatorMatch[2] ?? comparatorMatch[4]).toLowerCase();
    const rawValue = comparatorMatch[3] ?? comparatorMatch[5];

    const operator = operatorLabelsInverse[rawComparator];
    const isMultipleValue = ["in", "notin"].includes(operator);
    const columnType = columnTypes[variable];
    const compareVariable =
        !isMultipleValue && rawValue !== "null" && !/^(["']).*\1$/s.test(rawValue)
            ? resolveColumnName(rawValue, columns, caseInsensitiveColNames)
            : null;

    if (compareVariable !== null) {
        if (columnTypes[compareVariable] !== columnType) {
            throw new Error(`Variable ${compareVariable} type does not match ${variable}`);
        }

        return {
            variable,
            operator,
            value: null,
            compareVariable,
        };
    }

    return {
        variable,
        operator,
        value: parseLiteralValue(rawValue, columnType, isMultipleValue),
    };
};

const skipWhitespace = (state: ParserState): void => {
    while (state.position < state.input.length && /\s/.test(state.input[state.position])) {
        state.position += 1;
    }
};

const readConditionText = (state: ParserState): string => {
    const start = state.position;
    let nestedDepth = 0;
    let inSingle = false;
    let inDouble = false;
    let previousCharWasEscape = false;

    while (state.position < state.input.length) {
        const character = state.input[state.position];

        if (character === '"' && !inSingle && !previousCharWasEscape) {
            inDouble = !inDouble;
            state.position += 1;
            continue;
        }

        if (character === "'" && !inDouble && !previousCharWasEscape) {
            inSingle = !inSingle;
            state.position += 1;
            continue;
        }

        if (!inSingle && !inDouble) {
            if (character === "(") {
                nestedDepth += 1;
                state.position += 1;
                continue;
            }

            if (character === ")") {
                if (nestedDepth === 0) {
                    break;
                }
                nestedDepth -= 1;
                state.position += 1;
                continue;
            }

            if (nestedDepth === 0 && /\s/.test(character)) {
                let cursor = state.position;
                while (cursor < state.input.length && /\s/.test(state.input[cursor])) {
                    cursor += 1;
                }

                const connectorMatch = state.input.slice(cursor).match(/^(and|or)\b/i);
                if (connectorMatch !== null) {
                    const afterConnector = cursor + connectorMatch[1].length;
                    if (afterConnector === state.input.length || /\s|\)/.test(state.input[afterConnector])) {
                        break;
                    }
                }
            }
        }

        if (character === "\\" && !previousCharWasEscape) {
            previousCharWasEscape = true;
        } else {
            previousCharWasEscape = false;
        }
        state.position += 1;
    }

    const conditionText = state.input.slice(start, state.position).trim();
    if (conditionText === "") {
        throw new Error("Expected condition");
    }

    return conditionText;
};

const combineFlatExpressions = (
    left: FlatExpression,
    connector: Connector,
    priority: number,
    right: FlatExpression,
): FlatExpression => {
    return {
        conditions: [...left.conditions, ...right.conditions],
        connectors: [...left.connectors, connector, ...right.connectors],
        connectorPriorities: [...left.connectorPriorities, priority, ...right.connectorPriorities],
    };
};

const parseTerm = (
    state: ParserState,
    columns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean,
    nestingLevel: number,
): FlatExpression => {
    skipWhitespace(state);
    if (state.position >= state.input.length) {
        throw new Error("Unexpected end of filter string");
    }

    if (state.input[state.position] === "(") {
        state.position += 1;
        const expression = parseExpression(state, columns, caseInsensitiveColNames, nestingLevel + 1);
        skipWhitespace(state);
        if (state.input[state.position] !== ")") {
            throw new Error("Missing closing parenthesis");
        }
        state.position += 1;
        return expression;
    }

    return {
        conditions: [parseConditionString(readConditionText(state), columns, caseInsensitiveColNames)],
        connectors: [],
        connectorPriorities: [],
    };
};

const parseExpression = (
    state: ParserState,
    columns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean,
    nestingLevel: number,
): FlatExpression => {
    let expression = parseTerm(state, columns, caseInsensitiveColNames, nestingLevel);

    while (state.position < state.input.length) {
        skipWhitespace(state);
        if (state.position >= state.input.length || state.input[state.position] === ")") {
            break;
        }

        const connectorMatch = state.input.slice(state.position).match(/^(and|or)\b/i);
        if (connectorMatch === null) {
            throw new Error(`Unexpected token near ${state.input.slice(state.position)}`);
        }

        state.position += connectorMatch[1].length;
        const connector = connectorMatch[1].toLowerCase() as Connector;
        const right = parseTerm(state, columns, caseInsensitiveColNames, nestingLevel);
        expression = combineFlatExpressions(expression, connector, nestingLevel, right);
    }

    return expression;
};

const normalizeConnectorPriorities = (connectorPriorities: number[]): number[] | undefined => {
    if (connectorPriorities.length === 0) {
        return undefined;
    }

    const minPriority = Math.min(...connectorPriorities);
    const normalizedPriorities = connectorPriorities.map((priority) => priority - minPriority);
    return normalizedPriorities.every((priority) => priority === normalizedPriorities[0]) ? undefined : normalizedPriorities;
};

export const parseFilterString = (
    filterStringRaw: string,
    columns: ColumnMetadataParsed[],
    caseInsensitiveColNames: boolean,
): BasicFilter => {
    const filterString = filterStringRaw.trim();
    if (filterString === "") {
        return { conditions: [], connectors: [] };
    }

    const state: ParserState = { input: filterString, position: 0 };
    const parsedExpression = parseExpression(state, columns, caseInsensitiveColNames, 0);
    skipWhitespace(state);
    if (state.position !== state.input.length) {
        throw new Error(`Unexpected token near ${state.input.slice(state.position)}`);
    }

    const connectorPriorities = normalizeConnectorPriorities(parsedExpression.connectorPriorities);

    return {
        conditions: parsedExpression.conditions,
        connectors: parsedExpression.connectors,
        ...(connectorPriorities !== undefined && { connectorPriorities }),
    };
};

export const buildExpressionTree = (
    filter: Pick<BasicFilter, "conditions" | "connectors" | "connectorPriorities">,
): ExpressionNode | null => {
    const { conditions, connectors } = filter;
    if (conditions.length === 0) {
        return null;
    }

    if (conditions.length - 1 !== connectors.length) {
        throw new Error("Number of logical connectors must be equal to the number of conditions minus one");
    }

    const connectorPriorities = filter.connectorPriorities ?? new Array(connectors.length).fill(0);
    if (connectorPriorities.length !== connectors.length) {
        throw new Error("Number of connector priorities must be equal to the number of connectors");
    }

    const operandStack: ExpressionNode[] = [];
    const operatorStack: Array<{ connector: Connector; priority: number }> = [];

    const reduceTopOperator = (): void => {
        const operator = operatorStack.pop() as { connector: Connector; priority: number };
        const right = operandStack.pop() as ExpressionNode;
        const left = operandStack.pop() as ExpressionNode;

        operandStack.push({
            type: "connector",
            connector: operator.connector,
            priority: operator.priority,
            left,
            right,
        });
    };

    conditions.forEach((condition, index) => {
        operandStack.push({ type: "condition", condition, conditionIndex: index });

        if (index >= connectors.length) {
            return;
        }

        const currentOperator = {
            connector: connectors[index],
            priority: connectorPriorities[index],
        };

        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].priority >= currentOperator.priority) {
            reduceTopOperator();
        }

        operatorStack.push(currentOperator);
    });

    while (operatorStack.length > 0) {
        reduceTopOperator();
    }

    return operandStack[0];
};

export const conditionToString = (condition: FilterCondition): string => {
    const { compareVariable, isFunction, operator, value, variable } = condition;

    if (isFunction) {
        return `${operator}(${variable})`;
    }

    const comparator = Object.prototype.hasOwnProperty.call(operatorLabels, operator) ? operatorLabels[operator] : operator;
    let valueString = compareVariable ?? "";

    if (compareVariable === undefined) {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                valueString = "()";
            } else if (typeof value[0] === "string") {
                const escapedValues = value.map((v) => (v as string).replace(/"/g, '\\"'));
                valueString = `("${escapedValues.join('", "')}")`;
            } else {
                valueString = `(${value.join(", ")})`;
            }
        } else if (typeof value === "string") {
            // Escape double quotes in the string value
            const escapedValue = value.replace(/"/g, '\\"');
            valueString = `"${escapedValue}"`;
        } else {
            valueString = String(value);
        }
    }

    return `${variable} ${comparator} ${valueString}`;
};

const expressionToString = (node: ExpressionNode, parentPriority?: number): string => {
    if (node.type === "condition") {
        return conditionToString(node.condition);
    }

    const leftString = expressionToString(node.left, node.priority);
    const rightString = expressionToString(node.right, node.priority);
    const expressionString = `${leftString} ${node.connector} ${rightString}`;

    if (parentPriority !== undefined && node.priority !== parentPriority) {
        return `(${expressionString})`;
    }

    return expressionString;
};

export const filterExpressionToString = (filter: Pick<BasicFilter, "conditions" | "connectors" | "connectorPriorities">): string => {
    const expressionTree = buildExpressionTree(filter);
    if (expressionTree === null) {
        return "";
    }

    return expressionToString(expressionTree);
};
