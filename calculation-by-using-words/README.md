# Calculation by using words
* There must be a function for each number from 0 ('zero') to 9 ('nine')
* There must be a function for each of the following mathematical operations:
  * plus
  * minus
  * times
  * dividedBy
* Each calculation consist of exactly one operation and two numbers
* The most outer function represents the left operand, the most inner function represents the right operand

## Examples
```js
console.assert(seven(times(five())) === 35)
console.assert(four(plus(nine())) === 13)
console.assert(eight(minus(three())) === 5)
console.assert(six(dividedBy(two())) === 3)