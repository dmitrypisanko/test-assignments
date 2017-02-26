const assert = require('assert')

const {
    timeToMinutes,
    findAppointment
} = require('../lib')

let schedules = [
    [['09:00', '11:30'], ['13:30', '16:00'], ['16:00', '17:30'], ['17:45', '19:00']],
    [['09:15', '12:00'], ['14:00', '16:30'], ['17:00', '17:30']],
    [['11:30', '12:15'], ['15:00', '16:30'], ['17:45', '19:00']]
]

let schedules2 = [
    [['09:15', '11:46'],['12:27', '14:14']],
    [['09:05', '11:50'],['15:19', '17:00']],
    [['09:24', '12:02']]
]

describe('#timeToMinutes()', () => {
    let errors = ['24:12', '24:', '12:12:12', 'h12h:m12', '18:m12', '-12:00', '07:63']

    for(let item of errors ) {
        it(`timeToMinutes('${item}') === Error`, () => {
            assert.throws(() => timeToMinutes(item), Error)
        })
    }

    it("timeToMinutes('08:15', 9*60) === Error", () => {
        assert.throws(() => timeToMinutes('08:15', 9*60), Error)
    })

    it("timeToMinutes('0:25') === 25", () => {
        assert.equal(timeToMinutes('0:25'), 25)
    })

    it("timeToMinutes('09:15') === 555", () => {
        assert.equal(timeToMinutes('9:15'), 555)
    })

    it("timeToMinutes('10:15', 9*60) === 75", () => {
        assert.equal(timeToMinutes('10:15', 9*60), 75)
    })
})

describe('#findAppointment()', () => {
    it("findAppointment(schedules, 60) === '12:15'", () => {
        assert.equal(findAppointment(schedules, 60), '12:15')
    })

    it("findAppointment(schedules, 75) === '12:15'", () => {
        assert.equal(findAppointment(schedules, 75), '12:15')
    })

    it("findAppointment(schedules, 76) === null", () => {
        assert.equal(findAppointment(schedules, 76), null)
    })

    it("findAppointment(schedules, 1000) === null", () => {
        assert.equal(findAppointment(schedules, 1000), null)
    })

    it("findAppointment(schedules2, 5) === '09:00'", () => {
        assert.equal(findAppointment(schedules2, 5), '09:00')
    })

    it("findAppointment(schedules2, 15) === '12:02'", () => {
        assert.equal(findAppointment(schedules2, 15), '12:02')
    })

    it("findAppointment(schedules2, 30) === '14:14'", () => {
        assert.equal(findAppointment(schedules2, 30), '14:14')
    })
})