'use strict'

/**
 * @summary Get arguments for function.
 *
 * @param function $fn
 *
 * @return array
 */
function extractArguments(fn) {
    if (typeof fn !== 'function') {
        throw new Error('First argument must be a function!')
    }

    let description = fn.toString()

    description = description
        .replace(/\/\*[^\*]*\*\//gm, '') // remove multi line comments
        .replace(/\/\/[\/]*.*$/gm, '')  // remove single line comments

    //get arguments from ()
    let check = description.match(/\(([^\(\)]+?)\)/i)

    let checkArrowFnOneArgument = description.replace(/\s/gi, '').match(/^([^\(\)]+)\=\>[^\{]*\{/m)

    if ( checkArrowFnOneArgument && Array.isArray(checkArrowFnOneArgument) ) {
        return [ checkArrowFnOneArgument[0].split("=>")[0] ]
    } else {
        if (check && check[1]) {
            let args = check[1]
                .replace(/[()]/gi, '')
                .replace(/\s/gi, '')
                .split(',')

            if (args.length === 1 && args[0] === '') {
                return []
            } else {
                return args
            }
        } else {
            return []
        }
    }
}

/**
 * @summary Set default arguments for function
 *
 * @param function $fn
 * @param object $defaultValues
 *
 * @return function
 */
function defaultArguments(fn, defaultValues) {

    if (typeof fn !== 'function') {
        throw new Error('First argument must be a function!')
    }

    let returnFn = function () {
        let params = extractArguments(returnFn.originalFn)
        let args = [].slice.call(arguments);

        for (let index in params) {
            if (!args[index] && defaultValues[params[index]]) {
                args[index] = defaultValues[params[index]]
            }
        }

        return returnFn.originalFn.apply(null, args)
    }

    returnFn.originalFn = typeof fn.originalFn === 'function' ? fn.originalFn : fn

    return returnFn
}

module.exports = {
    extractArguments,
    defaultArguments
}