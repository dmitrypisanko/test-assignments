const assert = require('assert')

const {
    extractArguments,
    defaultArguments
} = require('../')

let testFn1 = function () {}
let testFn2 = () => {}
let testFn3 = function (a, b) {}
let testFn4 = (c, d) => {}

function testFn5(c,
                 d, e, f,
                 g, /*h,
                  i, j*/
                 //k,
                 //l
                 arg11) { console.log('test') }

let testFn6 = (
    c,
    d, e, f,
    g, /*h,
     i, j*/
    //k,
    //l
    arg11) => { console.log('test') }

let testFn7 = function(c,
                 d, e, f,
                 g, /*h,
                  i, j*/
                 //k,
                 //l
                 arg11) { console.log('test') }

let testFn8 = function testFn(c,
                       d, e, f,
                       g, /*h,
                        i, j*/
                       //k,
                       //l
                       arg11) { console.log('test') }

let testFn9 = a =>
{}

describe(`#extractArguments()`, () => {
    it('throw error if first argument is not a function', () => {
        assert.throws(() => extractArguments('test'), Error)
        assert.throws(() => extractArguments(null), Error)
    })

    it('empty array for function without arguments. extractArguments(function () {}) === []', () => {
        assert.equal(extractArguments(testFn1).join(','), '')
    })

    it('empty array for arrow function without arguments. extractArguments( () => {}) === []', () => {
        assert.equal(extractArguments(testFn2).join(','), '')
    })

    it("extract from function with simple arguments. extractArguments(function (a, b) {}) === ['a', 'b']", () => {
        assert.equal(extractArguments(testFn3).join(','), 'a,b')
    })

    it("extract from arrow function with simple arguments. extractArguments( (c, d) => {}) === ['c', 'd']", () => {
        assert.equal(extractArguments(testFn4).join(','), 'c,d')
    })

    it("extract from function with arguments, single and multiline comments. extractArguments(testFn5) === ['c', 'd', 'e', 'f', 'g', 'arg11']", () => {
        assert.equal(extractArguments(testFn5).join(','), 'c,d,e,f,g,arg11')
    })

    it("extract from arrow function with arguments, single and multiline comments. extractArguments(testFn6) === ['c', 'd', 'e', 'f', 'g', 'arg11']", () => {
        assert.equal(extractArguments(testFn6).join(','), 'c,d,e,f,g,arg11')
    })

    it("extract from function expression with arguments, single and multiline comments. extractArguments(testFn7) === ['c', 'd', 'e', 'f', 'g', 'arg11']", () => {
        assert.equal(extractArguments(testFn7).join(','), 'c,d,e,f,g,arg11')
    })

    it("extract from named function expression with arguments, single and multiline comments. extractArguments(testFn8) === ['c', 'd', 'e', 'f', 'g', 'arg11']", () => {
        assert.equal(extractArguments(testFn8).join(','), 'c,d,e,f,g,arg11')
    })

    it("extract from arrow function with one argument. extractArguments( a => {} ) === ['a']", () => {
        assert.equal(extractArguments(testFn9).join(','), 'a')
    })
})

describe(`#defaultArguments()`, () => {
    it('throw error if first argument is not a function', () => {
        assert.throws(() => defaultArguments('test'), Error)
        assert.throws(() => defaultArguments(null), Error)
    })

    function add(a, b) {
        return a + b
    }

    let add_ = defaultArguments(add, {b: 9})

    it('add_(10) === 19', () => {
        assert.equal(add_(10), 19)
    })

    it('add_(10,7) === 17', () => {
        assert.equal(add_(10, 7), 17)
    })

    it('add_() === NaN', () => {
        assert.equal(isNaN(add_()), true)
    })

    let add_1 = defaultArguments(add_, {b: 3, a: 2})
    it('add_1(10) === 13', () => {
        assert.equal(add_1(10), 13)
    })

    it('add_1() === 5', () => {
        assert.equal(add_1(), 5)
    })

    let add_2 = defaultArguments(add_, {c: 3})
    it('add_2(10) === NaN', () => {
        assert.equal(isNaN(add_2(10)), true)
    })

    it('add_2(10, 10) === 20', () => {
        assert.equal(add_2(10, 10), 20)
    })
})