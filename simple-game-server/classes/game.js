'use strict'

const _ = require('lodash'),
    qTree = require('simple-quadtree'),
    config = require('../config'),
    baseObject = require('./object')

/**
 * Игра!
 */
class Game {
    constructor( io ) {

        //создадим нужные переменные
        this._cache = {
            distance: {}
        }

        this._tree = qTree(0, 0, config.width, config.height);

        this._objectsPool = {}
        this._io = io
        this._uniq = 'id' + (new Date()).getTime()
        this._baseObject = new baseObject()

        this._tickCount = 1
        this._calculationTime = 0
        this._lastFoodGeneratedTime = 0
        this._nextTickTime = 0
        this._tickInProgress = false

        this.init()
    }

    /**
     * Инициализация игры, создадим объекты
     */
    init() {
        for (let i = 0; i < config.initPlayerCount; i++) {
            this.createObject('player')
        }

        for (let i = 0; i < config.initFoodCount; i++) {
            this.createObject('food')
        }
    }

    /**
     * При создании объекта, помещаем его в пул объектов. Пропишем рандомные координаты и скорость для игроков.
     *
     * @param type
     */
    createObject(type) {
        if ( typeof this._objectsPool[type] === 'undefined' ) {
            this._objectsPool[type] = []
        }

        let skipCreate = false;

        if ( skipCreate === false ) {
            let object = this._baseObject.createObject(type)

            if (type === 'player') {
                //генерим рандомную скорость
                object.setXSpeed(this.getRandom(-10, 10))
                object.setYSpeed(this.getRandom(-10, 10))
            }

            object.setId(this._objectsPool[type].length + '_' + (new Date()).getTime() + '_' + Math.random())

            let coords = this.getRandomCoords( object.getRadius(), type === 'player' ? true : false )

            if (coords && coords.x && coords.y) {
                object.setX(coords.x)
                object.setY(coords.y)

                this._tree.put(object)
                this._objectsPool[type][object.getId()] = object
            }
        }
    }

    /**
     * Функция рандома
     *
     * @param min
     * @param max
     * @returns {*}
     */
    getRandom(min, max) {
        var rand = min + Math.random() * (max + 1 - min);
        rand = Math.floor(rand);
        return rand;
    }

    /**
     * Генерация рандомных координат. Сместим начало и конец, чтобы игрок не оказался частично за картой.
     *
     * @param objectRadius
     * @returns {{x: *, y: *}}
     */
    getRandomCoords( objectRadius ) {
        return {
            x: this.getRandom(objectRadius, config.width - objectRadius),
            y: this.getRandom(objectRadius, config.height - objectRadius) 
        }
    }

    /**
     * Рассчет расстояния. Чтобы зря не напрягать проц рассчетами, кэшируем данные.
     */
    getDistanceBetweenObjects( obj1, obj2 ) {
        let diff1 = Math.abs(obj1.getX() - obj2.getX())
        let diff2 = Math.abs(obj1.getY() - obj2.getY())
        let index = diff1 > diff2 ? diff1 + '_' + diff2 : diff2 + '_' + diff1

        if ( !this._cache[index] ) {
            this._cache[index] = Math.ceil(Math.sqrt(Math.pow(diff1, 2) + Math.pow(diff2, 2)))
        }

        return this._cache[index]
    }

    /**
     * Перемещение объектов со скоростью. Добавление в список отрисовки. Генерация чсписка ячеек дял проверки
     */
    moveObjects() {
        //двигаем только игроков
        let type = 'player'
        for (let id in this.getObjectsPool()[type]) {
            let obj = this.getObjectsPool()[type][id]
            if (obj.getXSpeed() || obj.getYSpeed()) {
                this._tree.remove(obj)
                obj.move()
                this._tree.put(obj)
            }
        }

        //кэш для обработанных объектов
        let checked = {}
        for (let id in this.getObjectsPool()['player']) {
            let obj1 = this.getObjectsPool()['player'][id]

            let res = this._tree.get(obj1)

            res.forEach(obj2 => {
                if (obj2.getId() !== obj1.getId() && !checked[obj2.getId() + '_' + obj1.getId()] && !checked[obj1.getId() + '_' + obj2.getId()]) {

                    let distance = this.getDistanceBetweenObjects(obj1, obj2)
                    let minDistance = obj1.getRadius() + obj2.getRadius()

                    //есть контакт
                    if (distance < minDistance) {

                        if (obj1.getType() === 'food' || obj2.getType() === 'food') {
                            if (obj1.getType() === 'food') {
                                delete this.getObjectsPool()[obj1.getType()][obj1.getId()]
                                this._tree.remove(obj1)
                            } else {
                                delete this.getObjectsPool()[obj2.getType()][obj2.getId()]
                                this._tree.remove(obj2)
                            }

                            //увеличим игрока
                            if (obj1.getType() === 'food') {
                                obj2.setWeight(obj2.getWeight() + obj1.getWeight())

                                this._tree.update(obj2, 'id', {
                                    w: obj2.w,
                                    h: obj2.h
                                })
                            } else {
                                obj1.setWeight(obj1.getWeight() + obj2.getWeight())

                                this._tree.update(obj1, 'id', {
                                    w: obj1.w,
                                    h: obj1.h
                                })
                            }
                        } else {
                            let dx = obj2.getX() - obj1.getX()
                            let dy = obj2.getY() - obj1.getY()

                            //посчичаем удар
                            let angle = Math.atan2(dy, dx),
                                ax = obj1.getX() - obj2.getX() + Math.cos(angle) * minDistance,
                                ay = obj1.getY() - obj2.getY() + Math.sin(angle) * minDistance;

                            obj1.setXSpeed(obj1.getXSpeed() - ax)
                            obj1.setYSpeed(obj1.getYSpeed() - ay)
                            obj2.setXSpeed(obj2.getXSpeed() + ax)
                            obj2.setYSpeed(obj2.getYSpeed() + ay)

                            //шары проникают друг в друга, потому надо их раздвинуть
                            let diff = ((obj1.getRadius() + obj2.getRadius()) - distance) / 2

                            //считаем коэффициенты
                            let p1 = diff * dx / distance,
                                p2 = diff * dy / distance

                            this._tree.remove(obj1)
                            this._tree.remove(obj2)

                            //развигаем
                            obj1.setX(obj1.getX() - p1)
                            obj1.setY(obj1.getY() - p2)
                            obj2.setX(obj2.getX() + p1)
                            obj2.setY(obj2.getY() + p2)

                            this._tree.put(obj1)
                            this._tree.put(obj2)
                        }
                    }

                    //запомним что уже эти объекты обработали
                    checked[obj1.getId() + '_' + obj2.getId()] = true
                    checked[obj1.getId() + '_' + obj2.getId()] = true
                }
            })
        }
    }

    /**
     * Логика итерации
     */
    tick() {
        let start = (new Date()).getTime()

        if ( (start - this._lastFoodGeneratedTime) >= config.generateFoodInterval ) {
            for (let i = 0; i < config.generateFoodCount; i++) {
                this.createObject('food')
            }

            this._lastFoodGeneratedTime = start
        }

        if ( start >= this._nextTickTime && this._tickInProgress === false ) {
            this._tickCount++
            this._tickInProgress = true

            this.moveObjects()

            //визуальная часть нужна было для проверки что логика верна
            let response = []
            Object.keys(this.getObjectsPool()).forEach(type => {
                for( let id in this.getObjectsPool()[type] ) {
                    let obj = this.getObjectsPool()[type][id]

                    response.push({
                        x: parseInt(obj.getX()),
                        y: parseInt(obj.getY()),
                        t: obj.getType() === 'food' ? 'f' : 'p',
                        r: parseInt(obj.getRadius())
                    })
                }
            })

            this._io.broadcast('message', response)

            //количество времени занявший тик
            let workTime = (new Date()).getTime() - start

            //время следующего тика
            this._nextTickTime = (new Date()).getTime() + ( workTime >= config.tickInterval ? 0 : config.tickInterval - workTime )

            //console.log(this._tickCount, start, workTime + ' ms', this._nextTickTime ) //,

            this._calculationTime += workTime

            if ( this._tickCount%100 === 0 ) {
                console.log(`${this._tickCount}|Avg time of last 100 ticks ${this._calculationTime/100}ms. Food count: ${Object.keys(_.get(this.getObjectsPool(), 'food', {})).length}`)
                this._calculationTime = 0
            }

            //пометим, что тик закончился
            this._tickInProgress = false
        }

    }

    getObjectsPool() {
        return this._objectsPool
    }

    /**
     * Уничтожение объекта
     *
     * @param obj
     */
    destroyObject(obj) {
        //удалим объект из пула
        delete this.getObjectsPool()[obj.getType()][obj.getId()]
    }

    /**
     * Старт игры
     */
    start() {
        setInterval( this.tick.bind(this), 1 )
    }
}

module.exports = Game