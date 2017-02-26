var asserts  = require("assert"),
    tracer   = require("tracer"),
    RQ       = require("../rq/");

describe('RQ', function(){
    before(function() {
        //disable logger
        this.rq = new RQ({
            logger: tracer.console({
                transport: function (data) {
                    return data;
                }
            })
        });
    });

    describe('makeUuid', function() {
        it ('should be a function', function() {
           asserts.equal( typeof this.rq._makeUuid, 'function')
        });
        it ( 'should have a length like param', function() {
            asserts.equal( this.rq._makeUuid(8).length, 8);
            asserts.equal( this.rq._makeUuid(16).length, 16);
            asserts.equal( this.rq._makeUuid(32).length, 32);
            asserts.equal( this.rq._makeUuid(64).length, 64);
        });
    });

    describe('setConsumerHandler', function() {
        it ('should be a function', function() {
            asserts.equal( typeof this.rq.setConsumerHandler, 'function')
        });
        it ( 'return true only if function in param', function() {
            asserts.equal( this.rq.setConsumerHandler( function() {} ), true);
            asserts.equal( this.rq.setConsumerHandler( 123 ), false);
        });
    });

    describe('setGeneratorHandler', function() {
        it ('should be a function', function() {
            asserts.equal( typeof this.rq.setGeneratorHandler, 'function')
        });
        it ( 'return true only if function in param', function() {
            asserts.equal( this.rq.setGeneratorHandler( function() {} ), true);
            asserts.equal( this.rq.setGeneratorHandler( 123 ), false);
        });
    });

    describe('generatorIsDead', function() {
        it ('should be a function', function() {
            asserts.equal( typeof this.rq._generatorIsDead, 'function')
        });
        it ( 'should correct detect generator timeout', function() {
            //empty data
            asserts.equal( this.rq._generatorIsDead( null ), true);

            //no time
            asserts.equal( this.rq._generatorIsDead({
                uuid: this.rq._uuid
            }), true);

            //check with full data
            asserts.equal( this.rq._generatorIsDead({
                uuid: this.rq._uuid,
                time: new Date().getTime()
            }), false );
        });
    });
});