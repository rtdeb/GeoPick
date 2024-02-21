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
        port: _url.port
    }
}

const adjust_spec = function(spec){    
    const parsed_url = parse_url(api_url);
    spec.host = parsed_url.hostname + ':' + parsed_url.port;
    spec.schemes = [parsed_url.protocol];    
}


adjust_spec(spec);

const ui = SwaggerUI({
  spec,
  dom_id: '#swagger',
});

//console.log(parse_url(api_url));
console.log(spec);