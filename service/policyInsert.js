const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const reqInsert = require('./reqInsert');
const _ = require('loadsh');

let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    winston.debug(JSON.stringify(req.body.tableData));
    masterTableName =  req.body.tableName;
    const Data = req.body.tableData;
    let rtnResult = {};

    switch (Data.state) {
        case 'U' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Update start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, type:Data.type, name: Data.name, stationId: Data.stationId,
                        powerGenId: Data.powerGenId, unit: Data.unit, make:Data.make, port: Data.port, ip: Data.ip, fstDttm: Data.fstDttm, lstDttm: Data.lstDttm,
                        fstUser: Data.fstUser, lstUser: Data.lstUser, sanGubun: Data.sanGubun, state: 'U', trans_tag: 'E'},{id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if(rslt instanceof Error){
                        winston.error("************* 정책 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Update end *************************");
                });
            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 정책 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        case 'D' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Delete start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, type:Data.type, name: Data.name, stationId: Data.stationId,
                        powerGenId: Data.powerGenId, unit: Data.unit, make:Data.make, port: Data.port, ip: Data.ip, fstDttm: Data.fstDttm, lstDttm: Data.lstDttm,
                        fstUser: Data.fstUser, lstUser: Data.lstUser, sanGubun: Data.sanGubun, state: 'DE', trans_tag: 'E'},{id: Data.id}).then(
                        () => {
                            winston.info('딜리트 완료!');
                        }
                    );

                    if(rslt instanceof Error){
                        winston.error("************* 정책 딜리트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Delete end *************************");
                });

            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 정책 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        default:
            req.body.tableData.trans_tag = 'E';
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }
};