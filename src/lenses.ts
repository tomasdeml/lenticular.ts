import { shallowCopy } from './shallowCopy';

export interface ILens<TObj, TInValue, TOutValue> {
    get: ILensGetter<TObj, TOutValue>;
    set: ILensSetter<TObj, TInValue>;
    modify: ILensModifier<TObj, TInValue, TOutValue>;
}

export interface ILensGetter<TObj, TValue> {
    (obj: TObj): TValue;
}

export interface ILensSetter<TObj, TValue> {
    (obj: TObj, value: TValue): TObj;
}

export interface ILensModifier<TObj, TInValue, TOutValue> {
    (obj: TObj, func: (value: TOutValue) => TInValue): TObj;
}

export function attributeLens(name: string): ILens<any, any, any> {
    return newLens(
        (obj) => obj[name],
        (obj, val) => {
            if (Array.isArray(obj)) {
                throw new Error(`Expected value ${obj} not to be an array as it is being accessed by a string key. Try using a numeric key if you want to treat the value as an array.`);
            }
            const newObj = shallowCopy(obj);
            newObj[name] = val;
            return newObj;
        }
    );
}

export function arrayIndexLens(index: number): ILens<any, any, any> {
    return newLens(
        (arr) => arr[index],
        (arr: any[], val) => {
            if (!Array.isArray(arr)) {
                throw new Error(`Expected value ${arr} to be an array as it is being accessed by a numeric key. Try using a string key if want to treat the value as an object.`);
            }
            const newArr = arr.slice();
            newArr[index] = val;
            return newArr;
        }
    );
}

export function fallbackFor<TObj, TInValue, TOutValue>(lens: ILens<TObj, TInValue, TOutValue>, getterFallbackValue: TOutValue, setterFallbackValue: TObj): ILens<TObj, TInValue, TOutValue> {
    return newLens(
        (obj: TObj) => !!obj ? lens.get(obj) : getterFallbackValue,
        (obj: TObj, value: TInValue) => lens.set(obj || setterFallbackValue, value));
}

export function compose(lenses: ILens<any, any, any>[]): ILens<any, any, any> {
    return lenses.reduce((lens1, lens2) =>
        newLens(
            (obj) => {
                const nextObj = lens1.get(obj);
                return lens2.get(nextObj);
            },
            (obj, val) => {
                const parentObj = lens1.get(obj);
                const newParentObj = lens2.set(parentObj, val);
                return lens1.set(obj, newParentObj);
            }
        ),
        rootLens);
}

const rootLens = newLens(
    (obj) => obj,
    (obj, val) => val
);

function newLens<TObj, TInValue, TOutValue>(getter: ILensGetter<TObj, TOutValue>, setter: ILensSetter<TObj, TInValue>): ILens<TObj, TInValue, TOutValue> {
    return {
        get: getter,
        set: setter,
        modify: (obj, func) => setter(obj, func(getter(obj)))
    };
}
