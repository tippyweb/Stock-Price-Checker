/**
 * #####################################################
 *  Stock Price Checker - 2024-11-10
 * #####################################################
 */

'use strict';

// Adding axios module
const axios = require('axios');

// Adding crypto-js module
const CryptoJS = require('crypto-js');

// Adding MongoDB/mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// setting up Schema and DB model
const Schema = mongoose.Schema;

// IP address model
const ipSchema = new Schema({
  ip_hash: {
    type: String,
    unique: true
  }
});
const IP = mongoose.model("IP", ipSchema);

// Stock model
const stockSchema = new Schema({
  stock_symbol: {
    type: String,
    required: true,
    unique: true
  },
  likes: {
    type: Number,
    default: 0
  },
});
const Stock = mongoose.model("Stock", stockSchema);


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){

        // Declare const and variables
        const stock = req.query.stock;
        let like = req.query.like;
        let ip_data;
        let stock_quote;
        let stock_quote_array = [];
        let stock_db_data;
        let stock_obj = {};
        let newStock;
        let response = {};
        let res_array = [];
        let likes_array = [];

        try {
          // Like was checked
          if (like) {
            // Hash the client IP address and trancate it
            const hash = CryptoJS.SHA256(req.socket.remoteAddress);
            const ip_hash = hash.toString().slice(20,);

            // Check if the client IP address exists in the database
            ip_data = await IP.findOne({ip_hash: ip_hash});

            // If exists, Like is ignored
            if (ip_data) {
              like = false;

            // If it's a new IP address, save it in the database
            } else {
              const new_ip_hash = new IP({ip_hash: ip_hash});
              await new_ip_hash.save();
            }

          // Like wasn't checked
          } else {
            like = false;
          }

          // Look up the stock quotes
          // One stock quote was requested
          if (typeof stock == 'string') {
            await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`)
              .then(response => {
                stock_quote = response.data;
              })
              .catch(error => {
                console.error('Error fetching data', error);
              });

            response = {
              'stock': stock_quote['symbol'],
              'price': Number(stock_quote['latestPrice'])
            };
            stock_obj['stock_symbol'] = stock_quote['symbol'];

            // Find the stock data in the database
            stock_db_data = await Stock.findOne({stock_symbol: stock_quote['symbol']});

            if (stock_db_data == null) {
              if (like) {
                stock_obj['likes'] = 1;
                response['likes'] = 1;
              } else {
                response['likes'] = 0;
              }
              newStock = new Stock(stock_obj);
              await newStock.save();

            } else {
              if (like) {
                response['likes'] = stock_db_data['likes'] + 1;
                stock_obj['likes'] = stock_db_data['likes'] + 1;
                await Stock.updateOne(stock_obj);
              }
              response['likes'] = stock_db_data['likes'];
            }

            return res.json({'stockData': response});

          // Two stock quotes were requested
          } else {
            // Look up two stock quotes via proxy
            for (let i = 0; i < 2; i++) {
              await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock[i]}/quote`)
                .then(response => {
                  stock_quote_array.push(response.data);
                })
                .catch(error => {
                  console.error('Error fetching data', error);
                });
            }  // for loop

            // Search the stock data in the database
            for (let i = 0; i < 2; i++) {

              res_array[i] = {
                'stock': stock_quote_array[i]['symbol'],
                'price': Number(stock_quote_array[i]['latestPrice'])
              };
              stock_obj['stock_symbol'] = stock_quote_array[i]['symbol'];

              stock_db_data = await Stock.findOne({stock_symbol: stock_quote_array[i]['symbol']});

              if (stock_db_data == null) {
                if (like) {
                  stock_obj['likes'] = 1;
                  likes_array[i] = 1;
                } else {
                  likes_array[i] = 0;
                }
                newStock = new Stock(stock_obj);
                await newStock.save();
  
              } else {
                if (like) {  
                  likes_array[i] = stock_db_data['likes'] + 1;
                  stock_obj['likes'] = stock_db_data['likes'] + 1;
                  await Stock.updateOne(stock_obj);
                }
                likes_array[i] = stock_db_data['likes'];
              }

            }  // for loop

            res_array[0]['rel_likes'] = likes_array[0] - likes_array[1];
            res_array[1]['rel_likes'] = likes_array[1] - likes_array[0];

            return res.json({'stockData': res_array});
          }

        } catch (err) {
          console.log(err);
        }

    })

    .post(function (req, res){

    })
    
};
