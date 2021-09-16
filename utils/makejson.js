const rescodes = require('./rescodes');
const _ = require('loadsh');
const winston = require('../config/winston')(module);
const setDateTime = require('./setDateTime');

module.exports.makeReqData = function (id){
    let reqData = {};
    let reqBody = {};

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(JSON.stringify(reqBody));

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeResData = function (err, req){
    let resData={};
    let resBody={};
    const reqHeaderData = _.cloneDeep(req.body.header);
    if(!err){
        resBody = {"result":{"res_cd":"00","res_msg":"정상처리"}};
    }else{
        let errMessage;
        let errResult;
        try{
            errMessage = JSON.parse(err.message);
            if(errMessage.res_cd){
                errResult = errMessage;
            }else{
                errResult = {"res_cd":"99"};
            }
        }catch (e) {
            winston.error(err.stack, {e});
            errResult = {"res_cd":"99"};
        }

        resBody["result"] = errResult;
        resBody.result["res_msg"] = rescodes[resBody.result.res_cd];
    }
    resData.header = reqHeaderData;
    resData.body = resBody;
    return resData;
};

module.exports.makeReqData_H009 = function (data){
    let resData={};

    let unit_id = '';
    let make_id = '';

    for(let k = 0 ; k<4 ; k++ ) {
        unit_id += data.file_list.split('_')[k] ;
        if (k !== 3)
            unit_id += '_';
    }

    if (data.file_list.indexOf('GE_GT') !== -1){
        make_id = unit_id + '_GE_GT';
    }
    else {
        for (let k = 0; k < 5; k++) {
            make_id += data.file_list.split('_')[k] ;
            if (k !== 4)
                make_id += '_';
        }
    }

    resData.message_id = 'H009'; resData.keeper_id = data.keeper_id; resData.send_time = data.send_time; resData.unit_id = unit_id; resData.make_id = make_id;
    resData.file_name = data.file_list; resData.date_time = data.date_time;

    return resData;
};

module.exports.makeSTIXData_event= function (table) {
    const headerData = {flag: table.flag, timeAgent: table.timeAgent, timeZone: table.timezone, ipAgent: table.ipAgent, nameAgent: table.nameAgent, vendorAgent:table.vendorAgent, typeAgent: '', versionAgent: '',
        idOrganizationAgent: table.idOrganizationAgent, nameOperator: '', nameUnit: table.nameUnit, location: '', original: table.original};
    const bodyData = {nameAttack: table.nameAttack, timeAttackStart: table.timeAttackStart, timeAttackEnd: table.timeAttackEnd, ipAttacker: table.ipAttacker, ipVictim: table.ipVictim, macAttacker: table.macAttacker, macVictim: table.macVictim,
        portAttacker: table.portAttacker, portVictim: table.portVictim, protocol: table.protocol, ipVersion: '', levelRisk: table.levelRisk, typeAction: '', countAttack: '', idRule: '', nameModule: table.nameModule, categoryModule: table.categoryModule, lengthPacket: '',
        directionAttack: ''};

    const totalData = {header: headerData, event: bodyData};

    return totalData;
};

module.exports.makeSTIXData_anomaly = function (table) {
    const headerData = {flag: table.flag, timeAgent: table.timeAgent, timeZone: table.timeZone, ipAgent: table.ipAgent, nameAgent: table.nameAgent, vendorAgent:table.vendorAgent, typeAgent: '', versionAgent: '',
        idOrganizationAgent: table.idOrganizationAgent, nameOperator: '', nameUnit: table.nameUnit, location: '', original: table.original};
    const bodyData = {timeStart: table.timeStart, timeEnd: table.timeEnd, candidate: '', score: table.score, category: table.category, description: table.description};

    const totalData = {header: headerData, anomaly: bodyData};

    return totalData;
};

module.exports.makeSTIXData_state = function (table) {
    const headerData = {flag: table.flag, timeAgent: table.timeAgent, timezone: table.timeZone, ipAgent: table.ipAgent, nameAgent: table.nameAgent, vendorAgent:table.vendorAgent, typeAgent: '', versionAgent: '',
        idOrganizationAgent: '', nameOperator: '', nameUnit: table.nameUnit, location: '', original: ''};
    const bodyData = {usageCPU: table.usageCPU, usageMemory: table.usageMemory, usageDisk: table.usageDisk, tempCPU: ''};

    const totalData = {header: headerData, state: bodyData};

    return totalData;
};

module.exports.makeSTIXData_traffic = function (table) {
    const headerData = {flag: table.flag, timeAgent: table.timeAgent, timezone: table.timezone, ipAgent: table.ipAgent, nameAgent: table.nameAgent, vendorAgent:table.vendorAgent, typeAgent: '', versionAgent: '',
        idOrganizationAgent: table.idOrganizationAgent, nameOperator: '', nameUnit: table.nameUnit, location: '', original: ''};
    const bodyData = {ppsTotal: table.ppsTotal, bpsTotal: table.bpsTotal, ppsAccept: '', ppsDrop: '', bpsAccept: '', bpsDrop: '', inData: table.inData, outData: '', inPacket: table.inPacket, outPacket: ''};

    const totalData = {header: headerData, state: bodyData};

    return totalData;
};