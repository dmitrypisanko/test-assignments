'use strict';

var   _ = require('underscore'),
    tracer = require('tracer'),
    RQ  = require('./rq/'),

    options = {
        redis: {
            //disable offline queue to see errors after reconnection, either way service just stuck. Not sure it's node_redis bug or not
            enable_offline_queue: false
        },
        queueName: 'ott.workQueue',
        errorQueueName: 'ott.errors',
        generatorPingHashName: 'gPing',
        checkGeneratorInterval: 1000,
        generatorInterval: 1,
        generatorTimeout: 2000,
        consumerInterval: 1,
        debug: true,
        logger: tracer.colorConsole({
            format: ["{{timestamp}} <{{title}}> {{message}}"],
            dateformat: "dd/mm/yyyy HH:MM:ss.L"
        })
    };

var rq  = new RQ(options);

if (_.size(process.argv) >= 2 && process.argv[2] == 'getErrors') {
    rq.on('connect', function () {
       rq.showErrorsStat();
    });
} else {
    rq.setGeneratorHandler(function getMessage() {
        this.cnt = this.cnt || 0;
        return this.cnt++;
    });

    rq.setConsumerHandler(function eventHandler(msg, callback) {
        function onComplete() {
            var error = Math.random() > 0.85;
            callback(error, msg);
        }

        //processing takes time...
        setTimeout(onComplete, Math.floor(Math.random() * 1000));
    });

    rq.on('connect', function () {
        rq.emit('start');
    });
}
