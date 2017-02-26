'use strict'

class BinCalculator {

    /**
    * @summary Convert binary value to decimal.
    *
    * @param string $value
    * @return number
    */
    binToDec(value = '0') {

        //force convert to string
        if ( typeof value !== 'string' ) {
            value = (value + '')
        }

        for(var i = 0, int = 0; i < value.length; i++) {
            if ( value[i] > 1 ) {
                throw Error('Format error. Only 1 and 0 allow in bit number')
            }

            int = int << 1 | value[i]
        }

        return int
    }

    /**
     * @summary Calculate sum of two bit representation of numbers.
     *
     * @param string $a
     * @param string $b
     * @return number
     */
    sum(a = '0', b = '0') {
        return this.binToDec(a) + this.binToDec(b)
    }
}

module.exports = BinCalculator