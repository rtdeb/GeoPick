require('dotenv').config()

const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const wkt_parser = require('wkt-parser-helper');

describe('env file', function() {
  describe('file .env exists', function() {
    it('should be present', function () {
      expect(fs.existsSync('.env')).to.be.true;
    });
  })
});

describe('api tests', function() {
  describe('ping api', function(){
    it('should respond with api version number', function(done){
      chai.request( process.env.API_URL )
      .get('version')
      .end(function(err, res) {
        expect(res).to.have.status(200);
        console.log(res.text);
        done();
      })
    }),
    it('should respond with sec info', function(done){
      const geojson = wkt_parser.parseFromWK('POLYGON((0.0 0.0, 2.0 0.0, 2.0 2.0, 0.0 2.0, 0.0 0.0))');
      chai.request( process.env.API_URL )
      .post('mbc')
      .set('Content-Type','application/json; charset=UTF-8')
      .send( geojson )
      .end(function(err, res) {
        expect(res).to.have.status(200);
        json_response = JSON.parse(res.text); 
        json_data = JSON.parse(json_response[0]); 
        expect(json_data.mbc).to.exist;
        expect(json_data.uncertainty[0]).to.exist;
        //console.log(json_data);
        centroid_data = JSON.parse(json_data.centroid[0]);
        assert.equal( centroid_data.coordinates[0], 1 );
        done();
      })
    })
  });
});