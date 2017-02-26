'use strict'

const CALCULATE_TYPES = {
    plus: 'plus',
    minus: 'minus',
    times: 'multiply',
    dividedBy: 'divide',
}

/**
 * @summary Convert binary value to decimal.
 *
 * @param string $type
 * @param number $value1
 * @param number $value2
 *
 * @return number
 */
let calculate = (type, value1, value2) => {
    switch (type) {
        case CALCULATE_TYPES.plus:
            return value2 + value1
        case CALCULATE_TYPES.minus:
            return value2 - value1
        case CALCULATE_TYPES.times:
            return value2 * value1
        case CALCULATE_TYPES.dividedBy:
            if (value1 === 0) {
                throw new Error('Division by zero')
            } else {
                return value2 / value1
            }
        default:
            throw new Error('Not supported calculation type')
    }
}

let plus = (a) => {
    return function (b) {
        return calculate(CALCULATE_TYPES.plus, a, b)
    }
}

let minus = (a) => {
    return function (b) {
        return calculate(CALCULATE_TYPES.minus, a, b)
    }
}

let times = (a) => {
    return function (b) {
        return calculate(CALCULATE_TYPES.times, a, b)
    }
}

let dividedBy = (a) => {
    return function (b) {
        return calculate(CALCULATE_TYPES.dividedBy, a, b)
    }
}

let num = (operation, value) => {
    if (typeof operation === 'function') {
        return operation(value)
    } else {
        return value
    }
}

let zero = (operation) => num(operation, 0)
let one = (operation) => num(operation, 1)
let two = (operation) => num(operation, 2)
let three = (operation) => num(operation, 3)
let four = (operation) => num(operation, 4)
let five = (operation) => num(operation, 5)
let six = (operation) => num(operation, 6)
let seven = (operation) => num(operation, 7)
let eight = (operation) => num(operation, 8)
let nine = (operation) => num(operation, 9)

module.exports = {
    operations: {
        plus,
        minus,
        times,
        dividedBy
    },
    numbers: {
        zero,
        one,
        two,
        three,
        four,
        five,
        six,
        seven,
        eight,
        nine
    }
}