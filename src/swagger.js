require("swagger-ui/dist/swagger-ui.css");

const Buffer = require('buffer/').Buffer
const SwaggerUI = require("swagger-ui");
const api_url = process.env.API_URL;
const spec = require('./swagger-config.yaml');

const parse_url = function(url){
    _url = new URL(url);
    return {
        protocol: _url.protocol,
        hostname: _url.hostname,
        port: _url.port,
        pathname: _url.pathname
    }
}

const adjust_spec = function(spec){    
    const parsed_url = parse_url(api_url);
    if(parsed_url.port != "80" && parsed_url.port != ""){
        spec.host = parsed_url.hostname + ':' + parsed_url.port;
    }else{
        spec.host = parsed_url.hostname;
    }    
    spec.schemes = [parsed_url.protocol.slice(0,-1)];
    const reduced_pathname = parsed_url.pathname.slice(0,-1);
    spec.basePath = reduced_pathname + spec.basePath;
}


adjust_spec(spec);

const ui = SwaggerUI({
  spec,
  dom_id: '#swagger',
});
