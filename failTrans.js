const winston = require('./config/winston')(module);
const db = require('./models');
const schedule = require('node-schedule');
const _ = require('loadsh');
const httpcall = require('./utils/httpCall');
const confirmutils = require('./utils/confirmutils');

const timer = ms => new Promise(res => setTimeout(res, ms));

Array.prototype.division = function (n) {
    let arr = this;
    let len = arr.length;
    let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    let tmp = [];

    for (let i = 0; i < cnt; i++) {
        tmp.push(arr.splice(0, n));
    }

    return tmp;
};

module.exports.searchAndtransm = function() {
    schedule.scheduleJob(process.env.FAIL_TIME, async function() {
        let rtnResult = {};
        try {
            const tableNames = process.env.TABLE_NAMES_FAIL.split(',');

            for (tableName of tableNames) {
                let tableInfo = {};

                await db[tableName.toUpperCase()].findAll({where: {trans_tag: 'C'}}).then(async users => {
                    if (users.length) {
                        winston.info('**************************** 부문으로 전송 실패한 데이터 발견!!  테이블 명 : '+tableName+' ********************************');
                        let childTable = [];
                        for (user of users) {
                            childTable.push(user.dataValues);
                        }
                        if(childTable.length > 50){
                            winston.info('******************* '+tableName+' 테이블의 Value 갯수가 50개가 넘었습니다. ********************');

                            let motherTable = childTable.division(50);
                            for(let daughtTable of motherTable){
                                tableInfo = {tableName: tableName, tableData: _.cloneDeep(daughtTable)};
                            }
                        }
                        else{
                            tableInfo = {tableName: tableName, tableData: _.cloneDeep(childTable)};
                        }

                        //정합성 코드
                        let confirmCode = confirmutils.makeConfirmCode(tableInfo.tableData);
                        tableInfo.confirm_code = confirmCode;

                        const value = tableInfo;

                        httpcall.Call('post', process.env.BUMUN_ADDRESS, value, async function (err, res) {
                            if(err){
                                winston.info('*********************** 전송에러 발생   테이블 명 : '+tableName+' **********************');
                            }
                            else {
                                winston.info('*********************** 전송 성공   테이블 명 : '+tableName+' **********************');
                                user.update({trans_tag: 'E'});
                            }
                        });
                        await timer(1000);
                    }
                });
            }
        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};