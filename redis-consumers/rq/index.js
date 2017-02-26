'use strict';

/**
 * Dependencies.
 */
var _ = require('underscore'),
    ee = require('events').EventEmitter,
    redis = require('redis'),
    tracer = require('tracer'),
    async = require('async');

/**
 * Initilization
 */
function RQ(options) {
    this._options = options || {};
    this._queueName = this._options.queueName || 'queue';
    this._errorQueueName = this._options.errorQueueName || 'errors';
    this._generatorPingHashName = this._options.generatorPingHashName || 'gPing';
    this._checkGeneratorInterval = this._options.checkGeneratorInterval || 500;
    this._generatorInterval = this._options.generatorInterval || 500;
    this._generatorTimeout = this._options.generatorTimeout || 1000;
    this._consumerInterval = this._options.consumerInterval || 100;
    this._debug = this._options.debug || false;

    this._generatorHandler = false;
    this._consumerHandler = false;
    this._lastPong = new Date().getTime();
    this._timeDataChanged = new Date().getTime();
    this._uuid = this._makeUuid(16);

    this._logger = this._options.logger || tracer.colorConsole();

    this._errorLogger = tracer.console({
        format: ["{{timestamp}} {{message}}"],
        dateformat: "dd/mm/yyyy HH:MM:ss.L",
        transport: function (data) {
            return data;
        }
    });

    this._redisClient = redis.createClient(this._options.redis || {});

    var self = this;

    this._redisClient.on('connect', function () {
        self.emit('log', 'Connection to redis establish. Ready to go!', 'info');

        if (this._disconnected === true) {
            //give it time
            setTimeout(function () {
                self.emit('start');
            }, 1000);
        } else {
            //give it time
            setTimeout(function () {
                self.emit('connect');
            }, 1000);
        }

        this._disconnected = false;
    });

    this._redisClient.on('error', function (err) {
        self.emit('error', err.toString());
    });

    this._redisClient.on('reconnecting', function (data) {

        if (this._disconnected === false) {
            self.emit('stop');
        }

        this._disconnected = true;

        if (data.attempt > ( self._options.redis && self._options.redis.max_attempts ? self._options.redis.max_attempts : 10 )) {
            self.emit('criticalError', 'Redis server is not available. Shutdown.');
        }
    });
}

/**
 * Inherit from EventEmitter
 */
RQ.prototype.__proto__ = ee.prototype;

/**
 * Set handler function for generator
 */
RQ.prototype.setGeneratorHandler = function (fn) {
    if (_.isFunction(fn)) {
        this._generatorHandler = fn;

        return true;
    } else {
        return false;
    }
}

/**
 * Set handler function for consumer
 */
RQ.prototype.setConsumerHandler = function (fn) {
    if (_.isFunction(fn)) {
        this._consumerHandler = fn;
        return true;
    } else {
        return false;
    }
}

/**
 * Errors put to additional queue
 */
RQ.prototype._eventHandler = function (err, data) {
    if (err) {
        var self = this;

        var errorMsg = 'Error processing message#' + data;
        var parsedMsg = this._errorLogger.log('[' + self._uuid + '] ' + errorMsg);

        this._redisClient.rpush([this._errorQueueName, parsedMsg.output], function (err, response) {
            if (err) {
                self.emit('error', err);
            } else {
                if ( self._debug === true ) {
                    self.emit('log', errorMsg, 'warn');
                }
            }
        });
    }
}

/**
 * Display data from error queue and trim it
 */
RQ.prototype.showErrorsStat = function () {
    var self = this;

    self._redisClient.lrange(self._errorQueueName, 0, -1, function (err, data) {
        if (err) {
            self.emit('error', err);
        } else {

            _.each(data, function (item) {
                console.log(item);
            });

            self._redisClient.del(self._errorQueueName, function (err, response) {
                if (err) {
                    self.emit('error', err);
                }

                self.emit('log', 'Trim errors log', 'debug');
            });

            //exit after stdout is empty
            process.stdout.once('drain', function () {
                process.exit(0);
            });
        }
    });
}

/**
 * Uuid generator for app identification
 */
RQ.prototype._makeUuid = function (len) {
    var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        uuid = '';

    for (var i = 0; i < len; i++) {
        uuid += str[Math.floor(Math.random() * str.length)];
    }
    return uuid;
}

/**
 * Check dead generator or not
 */
RQ.prototype._generatorIsDead = function (data) {
    var self = this,
        now = new Date().getTime();

    if ( data && data.time ) {
        if (self._lastPong && self._lastPong != data.time) {
            self._timeDataChanged = now;
        }

        self._lastPong = data.time;
    }

    var diff = now - self._timeDataChanged;

    //The King is dead. Long live the King! Dips on generator position!
    if (data == null || !data.time || ( self._timeDataChanged && diff > self._generatorTimeout && diff > data.heartbeatInterval )) {
        return true;
    } else {
        return false;
    }
}

/**
 * Listener to start process after connection to Redis
 */
RQ.prototype.on('start', function () {
    var self = this;

    if (!this._consumerHandler) {
        this.emit('criticalError', 'Cannot proceed without consumer handler.');
    }

    if (!this._generatorHandler) {
        this.emit('criticalError', 'Cannot proceed without generator handler.');
    }

    //check types of all used keys
    async.parallel([
        function (callback) {
            self._redisClient.type(self._queueName, function (err, data) {
                if ( err ) {
                    callback(err);
                } else {
                    if (data != 'list' && data != 'none') {
                        self.emit('criticalError', 'Type of [' + self._queueName + '] key should be a list');
                    } else {
                        callback(null);
                    }
                }
            });
        },
        function (callback) {
            self._redisClient.type(self._errorQueueName, function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    if (data != 'list' && data != 'none') {
                        self.emit('criticalError', 'Type of [' + self._errorQueueName + '] key should be a list');
                    } else {
                        callback(null);
                    }
                }
            });
        },
        function (callback) {
            self._redisClient.type(self._generatorPingHashName, function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    if (data != 'hash' && data != 'none') {
                        self.emit('criticalError', 'Type of [' + self._generatorPingHashName + '] key should be a hash');
                    } else {
                        callback(null);
                    }
                }
            });
        }
    ], function ( err, results ) {
        if ( err ) {
            self.emit('criticalError', err);
        } else {
            self.emit('startConsumer');
        }
    });
});

/**
 * Global stop if connection is lost
 */
RQ.prototype.on('stop', function () {
    clearInterval(this._generatorIntervalId);
    clearInterval(this._consumerIntervalId);
    clearInterval(this._checkExclusiveIntervalId);
    clearInterval(this._checkGeneratorIntervalId);
});

/**
 * Start generator job. Add messages to work queue and check another generator is online
 */
RQ.prototype.on('startGenerator', function () {

    var self = this;

    //Iterator for generate data
    self._generatorIntervalId = setInterval(function () {
        var message = self._generatorHandler();

        // if in debug mode, die after 1M messages
        if (this._debug === true && message === 1000000) {
            process.exit();
        }

        self._redisClient.rpush([self._queueName, message], function (err, data) {
            if (err) {
                self.emit('error', err);
            } else {

                //send to log some data in debug mode
                if (self._debug === true && parseInt(message) % 100 == 0) {
                    self.emit('log', 'Send message to queue: ' + message, 'debug');
                }

                self._redisClient.hmset([self._generatorPingHashName, "uuid", self._uuid, "time", new Date().getTime(), "heartbeatInterval", self._generatorInterval]);
            }
        });
    }, self._generatorInterval);

    //Iterator for check exclusive generator
    self._checkExclusiveIntervalId = setInterval(function () {
        self._redisClient.hgetall(self._generatorPingHashName, function (err, data) {
            if (err) {
                self.emit('error', err);
            } else {
                //Somebody took our place. Ok, i'll give up
                if (self._generatorIsDead(data) === false && data && data.uuid != self._uuid) {
                    clearInterval(self._generatorIntervalId);
                    clearInterval(self._checkExclusiveIntervalId);

                    self.emit('log', 'Switch to consumer mode. New generator: [' + data.uuid + ']', 'info');
                    self.emit('startConsumer');
                }
            }
        });

    }, self._checkGeneratorInterval);
});

/**
 * Start consumer job. Get and parse messages from work queue and check if generator is online. If not, take his place
 */
RQ.prototype.on('startConsumer', function () {

    var self = this;

    self._checkGeneratorIntervalId = setInterval(function () {
        self._redisClient.hgetall(self._generatorPingHashName, function (err, data) {
            if (err) {
                self.emit('error', err);
            } else {
                if (self._generatorIsDead(data) === true) {

                    clearInterval(self._checkGeneratorIntervalId);
                    clearInterval(self._consumerIntervalId);

                    self.emit('startGenerator');
                    self.emit('log', 'Switch to generator mode', 'info');
                }
            }
        });
    }, self._checkGeneratorInterval);

    self._consumerIntervalId = setInterval(function () {
        self._redisClient.llen(self._queueName, function (err, res) {
            self._redisClient.lpop(self._queueName, function (err, data) {
                if (err) {
                    self.emit('error', err);
                } else if (data != null) {
                    self._consumerHandler(data, function (err, data) {
                        self._eventHandler(err, data);
                    });
                }
            });
        });
    }, self._consumerInterval);
});

/**
 * Listener for critical errors. Log it and terminate process
 */
RQ.prototype.on('criticalError', function (err) {
    this._logger.error(err);
    process.exit();
});

/**
 * Listener for errors. Just in case
 */
RQ.prototype.on('error', function (err) {
    this.emit('log', err, 'error');
});

/**
 * Listener for log event.
 */
RQ.prototype.on('log', function (msg) {
    var type = !arguments[1] ? 'log' : arguments[1];
    this._logger[type]('[' + this._uuid + '] ' + msg);
});

module.exports = RQ;