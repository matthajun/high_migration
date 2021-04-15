const express = require('express');
const router = express.Router();
const confirmutils = require('../utils/confirmutils');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);

const I001 = require('../service/I001');
const I003 = require('../service/I003');

const CH_I001 = require('../clickhouse/I001');
const CH_I002 = require('../clickhouse/I002');
const CH_I002_bumun = require('../clickhouse/I002_bumun');

router.post('/v1', async (req, res, next) => {
    try {
        winston.debug("post id " + req.body.header.message_id);
        const codeId = req.body.header.message_id;
/*
        if (codeId[0] !== 'L') {
            //confirm_code check, 이상행위 데이터에 대해서만 실행
            const reqData = req.body;
            const reqConfirmCode = reqData.header.confirm_code;
            const localMakeConfirmCode = await confirmutils.makeConfirmCode(JSON.stringify(reqData.body));

            if (reqConfirmCode !== localMakeConfirmCode) {
                winston.error(`${localMakeConfirmCode} ,  ${reqConfirmCode}`);
                const errCode = "93";
                throw Error(`{"res_cd":"${errCode}"}`);
            }
        }*/

        let result =  {};
        let ch_result = {};
        switch (codeId) {
            case "I001" :
                result = await  I001.parseAndInsert(req);
                ch_result = await CH_I001.parseAndInsert(req);
                break;
            case "I002" :
                result = await CH_I002_bumun.parseAndInsert(req);
                ch_result = await CH_I002.parseAndInsert(req);
                break;
            case "I003" :
                result = await I003.parseAndInsert(req);
                break;

            default:
                throw Error(`{"res_cd":"99"}`);
        }

        if(result instanceof Error){ //Insert가 안되었을때
            throw new Error(result);
        }else if(ch_result instanceof Error){
            throw new Error(ch_result);
        }
        else{
            res.json(makejson.makeResData(null,req));
        }

    } catch (err) {
        next(err);
    }
});

module.exports = router;
