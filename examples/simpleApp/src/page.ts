import * as b from 'bobril';
import * as lenticular from 'lenticular.ts';

interface IState {
    list: IListState;
}

interface IListState {
    items: IItem[];
}

interface IItem {
    name: string;
    attributes?: string[];
}

const state: IState = {
    list: {
        items: [
            { name: 'First Item Name' },
            { name: 'Second Item Name', attributes: ['Attribute 1', 'Attribute 2'] }
        ]
    }
};

function exerciseExampleLenses() {
    const nameOfItemAtIndex = lenticular.pathFromExpression((s: IState, i) => s.list.items[i].name);
    exerciseLens(nameOfItemAtIndex, [1], 'UPDATED SECOND ITEM NAME');

    const attributesOfItemAtIndex = lenticular.pathFromExpression((s: IState, i) => s.list.items[i].attributes);
    exerciseLens(attributesOfItemAtIndex, [1], ['UPDATED ATTRIBUTE 1', 'UPDATED ATTRIBUTE 2'],
        (attrs: string[]) => attrs.concat('ATTRIBUTE 3'));

    const attributeAtIndexOfItemAtIndex = lenticular.pathFromExpression((s: IState, i, j) => s.list.items[i].attributes[j]);
    exerciseLens(attributeAtIndexOfItemAtIndex, [1, 0], 'UPDATED ATTRIBUTE 1');

    const missingAttributesOfMissingItem = lenticular.pathFromExpression((s: IState) => s.list.items[2].attributes);
    exerciseLens(missingAttributesOfMissingItem, [], ['ATTRIBUTE 1']);

    const propertyAtMissingPath = lenticular.pathFromExpression(s => s.missingProperty.anotherMissingProperty.target);
    exerciseLens(propertyAtMissingPath, [], 'TARGET VALUE');
}

function exerciseLens(pathExpression, variableIndexes: number[], valueToSet, valueModifier: (v) => any = (v => v + '_MODIFIED')) {
    const lens = lenticular.lensFromPath(pathExpression, variableIndexes);

    console.groupCollapsed('Lens for path ' + lenticular.prettifyPath(pathExpression));
    console.log('Variable indexes: ', variableIndexes);

    console.log('A: get() = ', lens.get(state));

    const setResult = lens.set(state, valueToSet);
    console.log(`B: set(${valueToSet}) = `, setResult);
    console.log('B: get() = ', lens.get(setResult));

    const modifyResult = lens.modify(state, valueModifier);
    console.log(`C: modify(${valueModifier}) = `, modifyResult);
    console.log('C: get() = ', lens.get(modifyResult));

    console.groupEnd();
}

function printState() {
    console.log('Input State (immutable)', state);
}

export const page = b.createComponent({
    init() {
        printState();
        exerciseExampleLenses();
        printState();
    },

    render(ctx: b.IBobrilCtx, me: b.IBobrilNode) {
        me.children = 'See console output...';
    }
});

