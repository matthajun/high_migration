const httpcall = require('./httpCall');
const winston = require('../config/winston')(module);
const setTime = require('../utils/setDateTime');
const db = require('../models');
const confirmutils = require('./confirmutils');

module.exports.highrankPush = async function(value) {
    let confirmCode = confirmutils.makeConfirmCode(value.tableData);
    value.confirm_code = confirmCode;

    let result = {};

    httpcall.Call('post', process.env.BUMUN_ADDRESS, value, async function (err, res) {
        if(value.tableName.indexOf('ai_op') === -1) {
            if(Array.isArray(value.tableData)) {
                for (tableData of value.tableData) {
                    let data = {
                        date_time: setTime.setDateTimeforHistory(),
                        tableName: value.tableName,
                        tableData: JSON.stringify(tableData)
                    };
                    await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
                }
            }
            else {
                let data = {
                    date_time: setTime.setDateTimeforHistory(),
                    tableName: value.tableName,
                    tableData: JSON.stringify(value.tableData)
                };
                await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
            }
        }
        if (err) {
            throw Error(err);
        }
        else{
            winston.info("*************************** " + value.tableName + " is transmitted*****************************");
        }
    });
};
