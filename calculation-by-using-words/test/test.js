const assert = require('assert'),
    lib = require('../')

const {
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
} = lib.numbers

const {
    plus,
    minus,
    times,
    dividedBy,
} = lib.operations


let num = 0
for ( let key in lib.numbers ) {
    let fn = lib.numbers[key]
    describe(`#${fn.name}()`, () => {
        let index = num
        it(`Check default value. ${fn.name}() === ${index}`, () => {
            assert.equal(fn(), index )
        })
    })
    num++
}

describe(`#calculate()`, () => {
    it('seven(times(five())) === 35', () => {
        assert.equal(seven(times(five())), 35 )
    })

    it('four(plus(nine())) === 13', () => {
        assert.equal(four(plus(nine())), 13 )
    })

    it('eight(minus(three())) === 5', () => {
        assert.equal(eight(minus(three())), 5 )
    })

    it('six(dividedBy(two())) === 3', () => {
        assert.equal(six(dividedBy(two())), 3 )
    })

    it('division by zero. throw error', () => {
        assert.throws(() => five(dividedBy(zero())), Error)
    })
})