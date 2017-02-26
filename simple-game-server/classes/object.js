'use strict'

const config = require('../config')

//заранее просчитаем базовый радиус еды и игроков. Округляем, так как субпиксельнаят очность нам не нужна
const defaultFoodRadius = Math.round(Math.sqrt(config.initFoodWeight/Math.PI))
const defaultPlayerRadius = Math.round(Math.sqrt(config.initPlayerWeight/Math.PI))

/**
 * Базовый класс объектов
 */
class BaseObject {
    constructor() {
        this.radius = null
        this._xSpeed = null
        this._ySpeed = null
        this._x = null
        this._y = null

        //параметры для квадродерева
        this.id = null
        this.x = null
        this.y = null
        this.w = null
        this.h = null
    }

    getId() {
        return this.id
    }

    setId( value ) {
        this.id =  value
    }

    getXSpeed() {
        return this._xSpeed
    }

    setXSpeed( value ) {
        this._xSpeed =  value
    }

    getYSpeed() {
        return this._ySpeed
    }

    setYSpeed( value ) {
        this._ySpeed =  value
    }

    getRadius() {
        return this.radius
    }

    setRadius( value ) {
        this.w = this.h = value*2
        this.radius =  value
    }

    getX() {
        return this._x
    }

    setX( value ) {
        this._x =  value

        //сместим координату для дерева
        this.x = value - this.getRadius()
    }

    getY() {
        return this._y
    }

    setY( value ) {
        this._y =  value

        //сместим координату для дерева
        this.y = value - this.getRadius()
    }
    
    reverseXSpeed() {
        this.setXSpeed(-1*this.getXSpeed())
    }

    reverseYSpeed() {
        this.setYSpeed(-1*this.getYSpeed())
    }

    /**
     * Тип генерируется из класса
     *
     * @returns {string}
     */
    getType() {
        return this.constructor.name.toLowerCase()
    }

    /**
     * Создание объектов разного типа
     *
     * @param type
     * @returns {BaseObject}
     */
    createObject( type ) {
        if ( type === 'food' ) {
            return new Food()
        } else {
            return new Player()
        }
    }

    getWeight() {
        return this.weight
    }

    /**
     * Так как радиус напрямую зависит от веса, при изменении веса игрока пересчитаем и его
     *
     * @param weight
     */
    setWeight(weight) {
        this.weight = weight

        //если принудительно передали радиус не будем его считать. немного оптимизируем инициализацию
        if ( arguments[1] ) {
            this.setRadius(arguments[1])
        } else {
            this.setRadius(Math.round(Math.sqrt(weight/Math.PI)))
        }
    }
    
    /**
     * Передвинем объект
     */
    move() {
        let borderX, borderY = false
        //около границы, поменяем направление
        if (
            this.getX() + this.getXSpeed() + this.getRadius() >= config.width ||
            this.getX() + this.getXSpeed() - this.getRadius() <= 0
        ) {
            this.setX( this.getX() + this.getXSpeed() + this.getRadius() >= config.width ? config.width - this.getRadius() : this.getRadius() )

            this.reverseXSpeed()
            borderX = true
        }

        if (
            this.getY() + this.getYSpeed() + this.getRadius() >= config.height ||
            this.getY() + this.getYSpeed() - this.getRadius() <= 0
        ) {
            this.setY( this.getY() + this.getYSpeed() + this.getRadius() >= config.height ? config.height - this.getRadius() : this.getRadius() )
            this.reverseYSpeed()

            borderY = true
        }

        if ( !borderX  ) {
            this.setX( this.getX() + this.getXSpeed() )
        }

        if ( !borderY ) {
            this.setY( this.getY() + this.getYSpeed() )
        }
    }

    /**
     * Вывод лога для объекта
     */
    info() {
        console.log(this.getX(), this.getY(), this.getRadius(), this.getXSpeed(), this.getYSpeed() )
    }
}

/**
 * Еда
 */
class Food extends BaseObject  {
    constructor() {
        super()
        this.setWeight(config.initFoodWeight, defaultFoodRadius)
    }
}

/**
 * Игрок
 */
class Player extends BaseObject {
    constructor() {
        super()
        this.setWeight(config.initPlayerWeight, defaultPlayerRadius)
    }
}

module.exports = BaseObject