const filterRegex = {
    variable: /\w+/,
    variableParse: /(\w+)/,
    itemString: /["][^"]*?["]|['][^']*?[']|null/i,
    itemNumber: /[^'",][^,\s]*|null/i,
    itemBoolean: /True|False|null/i,
    item: / /,
    itemParse: / /,
    itemMultiple: / /,
    itemMultipleParse: / /,
    comparatorBoolean: /(?:=|!=)/,
    comparatorNumeric: /(?:=|!=|<=|>=|<|>)/,
    comparatorString: /(?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=)/,
    comparatorSingle: /(?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=)/,
    comparatorSingleParse: /((?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=))/,
    comparatorMultiple: /(?:in|notin)/,
    comparatorMultipleParse: /(in|notin)/,
    function: /(?:missing|notMissing)/,
    functionParse: /(missing|notMissing)/,
    condition: / /,
    conditionExtract: / /,
    conditionFunction: / /,
    conditionFunctionParse: / /,
    conditionComparator: / /,
    conditionComparatorParse: / /,
    conditionParse: / /,
    conditionConnector: /(?:and|or)/,
    filter: / /,
};

filterRegex.item = new RegExp(
    `(?:${filterRegex.itemString.source}|${filterRegex.itemNumber.source}|${filterRegex.itemBoolean.source})`,
    'i',
);

filterRegex.itemParse = new RegExp(`(${filterRegex.item.source})`, 'i');

filterRegex.itemMultiple = new RegExp(
    `\\(\\s*${filterRegex.item.source}\\s*(?:,\\s*${filterRegex.item.source})*\\s*\\)`,
    'i',
);

filterRegex.itemMultipleParse = new RegExp(
    `(${filterRegex.itemMultiple.source})`,
    'i',
);

filterRegex.conditionFunction = new RegExp(
    `${filterRegex.function.source}\\s*\\(\\s*${filterRegex.variable.source}\\s*\\)`,
    'i',
);

filterRegex.conditionFunctionParse = new RegExp(
    `${filterRegex.functionParse.source}\\s*\\(\\s*${filterRegex.variableParse.source}\\s*\\)`,
    'i',
);

filterRegex.conditionComparator = new RegExp(
    `${filterRegex.variable.source}\\s*(?:${
        filterRegex.comparatorSingle.source
    }\\s*${
        filterRegex.item.source
    }|${filterRegex.comparatorMultiple.source}\\s+${
        filterRegex.itemMultiple.source
    })`,
    'i',
);

filterRegex.conditionComparatorParse = new RegExp(
    `${filterRegex.variableParse.source}\\s*(?:${
        filterRegex.comparatorSingleParse.source
    }\\s*${
        filterRegex.itemParse.source
    }|${filterRegex.comparatorMultipleParse.source}\\s+${
        filterRegex.itemMultipleParse.source
    })`,
    'i',
);

filterRegex.condition = new RegExp(
    `(?:${filterRegex.conditionFunction.source}|${filterRegex.conditionComparator.source})`,
    'i',
);

filterRegex.conditionParse = new RegExp(
    `(?:${filterRegex.conditionFunctionParse.source}|${filterRegex.conditionComparatorParse.source})`,
    'i',
);

filterRegex.conditionExtract = new RegExp(
    `(${filterRegex.condition.source})`,
    'i',
);


filterRegex.filter = new RegExp(
    `^(${filterRegex.condition.source})((?:\\s+${filterRegex.conditionConnector.source}\\s+${filterRegex.condition.source}))*$`,
    'i',
);

export default filterRegex;
