const assert = require('assert'),
    BitCalculator = require('../')

let bitCalculator = new BitCalculator()
let randomTestsNumber = 5

describe('BitCalculator', () => {
    describe('#binToDec() - Convert binary value to decimal', () => {

        for (let i = 1; i <= randomTestsNumber; i++) {
            let randomNumber = Math.round(Math.random() * 10)

            //five tests with random numbers
            it(`Random test #${i}. bitCalculator.binToDec('${randomNumber.toString(2)}') === ${randomNumber}`, () => {
                assert.equal(bitCalculator.binToDec(randomNumber.toString(2)), randomNumber)
            })
        }

        it('Throw error for non valid binary number 102', () => {
            //check error
            assert.throws(() => bitCalculator.binToDec('102'), Error)
        })

        it('Check default param 0', () => {
            assert.equal(bitCalculator.binToDec(), 0)
        })
    })

    describe('#sum()', () => {
        for (let i = 1; i <= randomTestsNumber; i++) {
            let randomNumber1 = Math.round(Math.random() * 10)
            let randomNumber2 = Math.round(Math.random() * 10)

            //five tests with random numbers
            it(`Random test #${i}. bitCalculator.sum('${randomNumber1.toString(2)}', '${randomNumber2.toString(2)}') === ${randomNumber1 + randomNumber2}`, () => {
                assert.equal(randomNumber1 + randomNumber2, bitCalculator.sum(randomNumber1.toString(2), randomNumber2.toString(2)))
            })
        }

        it(`bitCalculator.sum('10', '10') === 4`, () => {
            assert.equal(bitCalculator.sum('10', '10'), 4)
        })

        it(`bitCalculator.sum('10', '0') === 2`, () => {
            assert.equal(bitCalculator.sum('10', '0'), 2)
        })

        it(`bitCalculator.sum('101', '10') === 7`, () => {
            assert.equal(bitCalculator.sum('101', '10'), 7)
        })
    })
})