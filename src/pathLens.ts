import * as lenses from './lenses';

export type PathRoot = object | object[];
export type PathSegment = IAttributeSegment | IArrayIndexSegment | IVariableIndexSegment;

export interface IPath<TRoot extends PathRoot, TValue> extends Array<PathSegment> {
    readonly _rootType?: TRoot;
    readonly _valueType?: TValue;
}
export interface IAttributeSegment extends IPrintable { attribute: string; }
export interface IArrayIndexSegment extends IPrintable { index: number; }
export interface IVariableIndexSegment extends IPrintable { variableIndexPosition: number; }
export interface IPrintable { toString(): string; }

export function pathFromExpression<TRoot extends PathRoot, TValue>(expression: (obj: TRoot, ...variableIndexes: (number | string)[]) => TValue)
    : IPath<TRoot, TValue> {
    const pathExpression = extractPathExpression(expression);
    const rawSegments = pathExpression.split('.');
    return skipPathRoot(rawSegments.reduce(pathSegmentsFromString, []));
}

export function lensFromPath<TRoot extends PathRoot, TValue>(path: IPath<TRoot, TValue>, variableIndexValues?: (number | string)[])
    : lenses.ILens<TRoot, TValue, TValue> {
    validateVariableIndexesInPathSatisfied(path, variableIndexValues);
    const pathSegments = path.map(s => resolveSegment(s, variableIndexValues!));
    return lenses.compose(pathSegments.map(lensForPathSegment));
}

export function objectKey(numberIndex: number): string {
    return numberIndex.toString();
}

export function prettifyPath(path: IPath<any, any>): string {
    return path.map(s => s.toString()).join('.');
}

function validateVariableIndexesInPathSatisfied(path: IPath<any, any>, variableIndexValues?: (number | string)[]) {
    const numberOfVariableIndexSegments = path.filter(s => isVariableIndexSegment(s)).length;
    const pathContainsVariableIndexes = numberOfVariableIndexSegments > 0;

    if (!pathContainsVariableIndexes) {
        return;
    }

    if (!variableIndexValues || variableIndexValues.length === 0) {
        throw new Error('The path contains variable indexes however no values for the indexes were passed in the second argument.');
    }

    if (variableIndexValues && variableIndexValues.length !== numberOfVariableIndexSegments) {
        throw new Error(
            `The path contains ${numberOfVariableIndexSegments} variable index(es) ` +
            `however ${variableIndexValues.length} value(s) for the indexes were passed in the second argument.`);
    }
}

const pathExpressionMatcher = /\s*([^;}]+);?/mi;
function extractPathExpression(expression: Function): string {
    const pathMatch = pathExpressionMatcher.exec(expression.toString());
    const pathExpression = pathMatch && pathMatch[1];
    if (!pathExpression) {
        throw new Error(`Could not extract path expression from "${expression.toString()}".`);
    }
    return pathExpression;
}

function skipPathRoot(path: PathSegment[]): PathSegment[] {
    return path.splice(1);
}

const indexerMatcher = /(\w+)(?:\[(\w+)\])/m;
function pathSegmentsFromString(segments: PathSegment[], nextRawSegment: string): PathSegment[] {
    const indexerMatch = indexerMatcher.exec(nextRawSegment);
    if (!indexerMatch) {
        return segments.concat(attributeSegment(extractAttributeName(nextRawSegment)));
    }

    const attribute = indexerMatch[1];
    const index = indexerMatch[2];

    if (isVariableIndex(index)) {
        // TODO Store last index position in reduced value instead of finding it on each pass
        const nextVariableIndexPosition = findNextVariableIndexPosition(segments);
        return segments.concat(attributeSegment(attribute), variableIndexSegment(nextVariableIndexPosition));
    }

    return segments.concat(attributeSegment(attribute), arrayIndexSegment(Number(index)));
}

function attributeSegment(attribute: string): IAttributeSegment {
    return {
        attribute,
        toString: () => attribute
    };
}

function variableIndexSegment(indexPosition: number): IVariableIndexSegment {
    return {
        variableIndexPosition: indexPosition,
        toString: () => `[$${indexPosition}]`
    };
}

function findNextVariableIndexPosition(segments: PathSegment[]): number {
    return segments.filter(isVariableIndexSegment).length;
}

function arrayIndexSegment(index: number): IArrayIndexSegment {
    return {
        index,
        toString: () => `[${index}]`
    };
}

const attributeMatcher = /\w+/;
function extractAttributeName(name: string) {
    const nameMatch = attributeMatcher.exec(name);
    const attributeName = nameMatch && nameMatch[0];
    if (!attributeName) {
        throw new Error(`Could not extract attribute name from "${name}".`);
    }
    return attributeName;
}

function isVariableIndex(index: string): boolean {
    return isNaN(parseInt(index));
}

function lensForPathSegment(segment: PathSegment): lenses.ILens<any, any, any> {
    if (isAttributeSegment(segment)) {
        return lenses.fallbackFor(lenses.attributeLens(segment.attribute), undefined, {});
    } else if (isArrayIndexSegment(segment)) {
        return lenses.fallbackFor(lenses.arrayIndexLens(segment.index), undefined, []);
    }

    throw new Error(`Encountered unsupported path segment ${JSON.stringify(segment)}`);
}

function isAttributeSegment(segment: PathSegment): segment is IAttributeSegment {
    return 'attribute' in segment;
}

function isArrayIndexSegment(segment: PathSegment): segment is IArrayIndexSegment {
    return 'index' in segment;
}

function isVariableIndexSegment(segment: PathSegment): segment is IVariableIndexSegment {
    return 'variableIndexPosition' in segment;
}

function resolveSegment(segment: PathSegment, variableIndexValues: (number | string)[]): PathSegment {
    if (isVariableIndexSegment(segment)) {
        const variableIndexValue = variableIndexValues[segment.variableIndexPosition];
        if (typeof variableIndexValue === 'number') {
            return arrayIndexSegment(variableIndexValue);
        } else {
            return attributeSegment(<string>variableIndexValue);
        }
    }

    return segment;
}
