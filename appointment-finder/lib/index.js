'use strict'

/**
 * @summary Convert string time ( 18:23 ) to minutes. Offset value if base value is present ( optional )
 *
 * @param string $time
 * @param number $base
 *
 * @return number
 */
let timeToMinutes = ( time, base = 0 ) => {
    let parts = time.toString().split(":")

    if ( parts.length !== 2 ) {
        throw new Error('Time not valid')
    } else if ( isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1])) ) {
        throw new Error('Time not valid')
    } else {
        let hours = !parts[0] ? 0 : parseInt(parts[0])
        let minutes = !parts[1] ? 0 : parseInt(parts[1])

        if ( hours < 0 || hours > 23 ) {
            throw new Error('Time not valid')
        } else if ( minutes < 0 || minutes > 59 ) {
            throw new Error('Time not valid')
        } else {
            let totalMinutes = hours*60 + minutes

            if ( totalMinutes < base ) {
                throw new Error('Base should be less then time')
            } else {
                return totalMinutes - base
            }
        }
    }
}

/**
 * @summary Found time for appointment
 *
 * @param array $schedules
 * @param number $duration
 * @param string $workPeriodStart optional
 * @param string $base optional
 *
 * @return string|null
 */
let findAppointment = function(schedules, duration, workPeriodStart = '09:00', workPeriodEnd = '19:00') {

    let freeTime = 0
    let baseOffset = timeToMinutes(workPeriodStart)
    let busyTable = new Array(timeToMinutes(workPeriodEnd, baseOffset)).join().split(",").map(item => 0)

    for( let personSchedule of schedules ) {
        for(let time of personSchedule ) {
            if ( !Array.isArray(time) || time.length !== 2) {
                throw new Error('Not valid time period')
            } else {
                for(let i = timeToMinutes(time[0], baseOffset); i < timeToMinutes(time[1], baseOffset);i++ ) {
                    busyTable[i] = 1
                }
            }
        }
    }

    for( let i=0;i<busyTable.length;i++ ) {
        if ( !busyTable[i] ) {
            freeTime++

            if ( freeTime >= duration ) {
                let time = (i - duration) + baseOffset + 1

                let hours = Math.floor(time/60)
                let minutes = time - hours*60

                return `${hours <= 9 ? '0' + hours : hours}:${minutes <= 9 ? '0' + minutes : minutes}`
            }
        } else {
            freeTime = 0
        }
    }

    return null
}

module.exports = {
    timeToMinutes,
    findAppointment
}