const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    test('1. Viewing one stock: GET request to /api/stock-prices/', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices/')
          .query({
            "stock": "GOOG"
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.notStrictEqual(res.text, {"stockData":{"stock":"GOOG","price":179.86,"likes":0}});
            done();
          });
    });

    test('2. Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices/')
          .query({
            "stock": "GOOG",
            like: true
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.notStrictEqual(res.text, {"stockData":{"stock":"GOOG","price":179.86,"likes":1}});
            done();
          });
    });

    test('3. Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices/')
          .query({
            "stock": "GOOG",
            like: true
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.notStrictEqual(res.text, {"stockData":{"stock":"GOOG","price":179.86,"likes":1}});
            done();
          });
    });

    test('4. Viewing two stocks: GET request to /api/stock-prices/', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices/')
          .query({
            "stock": ["GOOG","MSFT"]
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.notStrictEqual(res.text, {"stockData":[{"stock":"GOOG","price":179.86,"rel_likes":1},{"stock":"MSFT","price":422.54,"rel_likes":-1}]});
            done();
          });
    });

    test('5. Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/stock-prices/')
          .query({
            "stock": ["GOOG","MSFT"],
            like: true
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.notStrictEqual(res.text, {"stockData":[{"stock":"GOOG","price":179.86,"rel_likes":1},{"stock":"MSFT","price":422.54,"rel_likes":-1}]});
            done();
          });
    });

});
