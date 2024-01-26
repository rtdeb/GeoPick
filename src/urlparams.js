const Joi = require('joi');

const opcodes = {
    OPCODE_LATLONUNC : 0,
    OPCODE_SHARE : 1,
    OPCODE_ERROR: -1,
    OPCODE_UNKNOWN: -2
}

const schema_latlonunc = Joi.object({
    lat: Joi.number().min(-90).max(90).precision(6).required(),
    lon: Joi.number().min(-180).max(180).precision(6).required(),
    unc: Joi.number().positive().min(1).precision(6).required(),
})

const schema_share = Joi.object({
    locationid: Joi.string().required(),
})

const urlParamsActions = function(urlParams){
    let retVal = { status: 'KO', opcode: opcodes.OPCODE_UNKNOWN, message: ''};
    let keys = [];    
    for (const [key, value] of urlParams) {
        keys.push(key);
    }
    let actualParamsSet = new Set(keys);
    if(  actualParamsSet.has('lat') || actualParamsSet.has('lon') || actualParamsSet.has('unc') ){        
        const lat = urlParams.get('lat');
        const lon = urlParams.get('lon');
        const unc = urlParams.get('unc');        
        const value = schema_latlonunc.validate({ 'lat': lat, 'lon': lon, 'unc': unc });
        if(value.error){
            retVal.status = 'KO';
            retVal.opcode = opcodes.OPCODE_ERROR;
            retVal.message = value.error;            
        }else{            
            retVal.status = 'OK';
            retVal.opcode = opcodes.OPCODE_LATLONUNC;            
            retVal.params = { 'lat': parseFloat(lat), 'lon': parseFloat(lon), 'unc': parseFloat(unc) };
        }
    } else if( actualParamsSet.has('locationid') ){        
        const share = urlParams.get('locationid');
        const value = schema_share.validate({ 'locationid': share });
        if(value.error){
            retVal.status = 'KO';
            retVal.opcode = opcodes.OPCODE_ERROR;
            retVal.message = value.error;
        }else{            
            retVal.status = 'OK';
            retVal.opcode = opcodes.OPCODE_SHARE;
            retVal.params = {'locationid': share};
        }
    } else {
        retVal.status = 'KO';
        retVal.opcode = opcodes.OPCODE_UNKNOWN;
        retVal.message = "Unnkown or no operation";
    }
    return retVal;
};

module.exports = {
    urlParamsActions,
    opcodes    
}

