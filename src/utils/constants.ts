import { FilterCondition } from '../interfaces/filter';

type OperatorLabels = {
    [key in FilterCondition['operator']]: string;
};

export const operatorLabels: OperatorLabels = {
    eq: '=',
    ne: '!=',
    lt: '<',
    le: '<=',
    gt: '>',
    ge: '>=',
    in: 'in',
    notin: 'notin',
    contains: '?',
    notcontains: '!?',
    starts: '=:',
    ends: ':=',
    regex: '=~',
    notMissing: 'notMissing',
    missing: 'missing',
};

export const operatorHumanFriendlyLabels: OperatorLabels = {
    eq: '=',
    ne: '!=',
    lt: '<',
    le: '<=',
    gt: '>',
    ge: '>=',
    in: 'in',
    notin: 'not in',
    contains: 'contains',
    notcontains: 'not contains',
    starts: 'starts with',
    ends: 'ends with',
    regex: 'regex',
    notMissing: 'not missing',
    missing: 'missing',
};

export const stringOperators = Object.keys(operatorLabels);

export const numberOperators = [
    'eq',
    'ne',
    'lt',
    'le',
    'gt',
    'ge',
    'in',
    'notin',
    'notMissing',
    'missing',
];
export const booleanOperators = ['eq', 'ne', 'notMissing', 'missing'];

export const operatorLabelsInverse: {
    [name: string]: FilterCondition['operator'];
} = Object.fromEntries(
    Object.entries(operatorLabels).map(([key, value]) => [
        value,
        key as FilterCondition['operator'],
    ]),
);
