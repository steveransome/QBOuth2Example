'use strict'

var http = require('http');
var port = process.env.PORT || 3000;
var request = require('request');
var qs = require('querystring');
var util = require('util');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var express = require('express');
var app = express();
var QuickBooks = require('../index');
var Tokens = require('csrf');
var csrf = new Tokens();

QuickBooks.setOauthVersion('2.0');

// Generic Express config
app.set('port', port);
app.set('views', 'views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('brad'));
app.use(session({ resave: false, saveUninitialized: false, secret: 'smith' }));

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

// INSERT YOUR CONSUMER_KEY AND CONSUMER_SECRET HERE

var consumerKey = 'Q0hWFVoQP0AlilQGDbZDlqj9lZKqbf7R7S8IS8LTfOKrZTLTzb';
var consumerSecret = 'LG8hWygP46wQKlAccWKDRjPohdif2TOTMBEXQZGh';

app.get('/', function (req, res) {
  res.redirect('/start');
});

app.get('/start', function (req, res) {
  res.render('intuit.ejs', { port: port, appCenter: QuickBooks.APP_CENTER_BASE });
});

app.get('/test', function (req, res) {
  res.send('hello world')
  
  var qbo = new QuickBooks('Q0hWFVoQP0AlilQGDbZDlqj9lZKqbf7R7S8IS8LTfOKrZTLTzb',
  'LG8hWygP46wQKlAccWKDRjPohdif2TOTMBEXQZGh',
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..2kRy8V0Z-43GOwNrcUDmSA.HkuyYMij8V3MxhGpPEKoIsE7NNZchCfixT0Ug0kKNbj46T2lvzlimzK3hUhlSdH0Zx-kNK0z22V4OANj1AUDc6pHsyPAVDql1NG11kbHVWJ2NwKSCW-y7XsD8Y9JPA_5uPyH5OAooI1D2axHaogqnbhgqMFmBmSa1H3PvFUBU4Q9nS99TnJCiHkWmXuVymjdzSc8Fbt_l3tQPwbRlG0DAe0DnoyJqwBl_bN_r6U85DVIojTH09NxBSIbtGuumuYJabK7ReyaYB9g97-2NPDlc04v-x4gKa8cHQeDkE3cXjr2Ud9fjSzzQsgQ8A5Afpnh-2d7pH72Q0dLoI1x24gpLbdF9iebdfgfth2smpU4eKKUKwPvfJ8CgWJe1s8R4s7ZRXU5ZuARsK55Z3tNdTY_9yBiKQ40kPEOQuLdRx9DZq-G43xXHsASb2jgoF76eHP7bKL_-oWBEOPhK_JHxDW_WVrXRpF9RercBGhYZsJiZPKckFZeQJE2eSInN_cYBHi1FTp-GxH3MVcdeY2ufbCSl8-3ggckT7BOMcHW_M-jgzqh9QnbkFWLIqTwTHeok9OSpqVy2w__JHcLaUTlYjhG6Sc4FLrw5GFh2Y0a92vDtzGEkUk1MRm4ChW1fK07eMexskztcRlpGn6Pw6grHg5IDxHlFASeZDQPkVLCos8T_wLbMXyLqLUjK1_UZUFCxfci.rhrSkKM2MUqd9CeU8wkNWg',//accessToken.access_token, /* oAuth access token */
    false, /* no token secret for oAuth 2.0 */
    '193514813439739', //req.query.realmId,
    true, /* use a sandbox account */
    true, /* turn debugging on */
    4, /* minor version */
    '2.0', /* oauth version */
   'Q011543564739lcWCvvaZWcAzH0nOeSBSl8OLpi5PPor8SugJa'); // /* refresh token */);
var i =0;
   qbo.findAccounts(function (_, accounts) {
    accounts.QueryResponse.Account.forEach(function (account) {
     i++ ;
    });
  });
  console.log('Number of Accounts: ' + i)
      // qbo.findAccounts(function (_, accounts) {
   //   accounts.QueryResponse.Account.forEach(function (account) {
  //      console.log(account.Name);
 //     });
//    });)
})

// OAUTH 2 makes use of redirect requests
function generateAntiForgery (session) {
  session.secret = csrf.secretSync();
  return csrf.create(session.secret);
};

app.get('/requestToken', function (req, res) {
  var redirecturl = QuickBooks.AUTHORIZATION_URL +
    '?client_id=' + consumerKey +
    '&redirect_uri=' + encodeURIComponent('http://localhost:' + port + '/callback/') +  //Make sure this path matches entry in application dashboard
    '&scope=com.intuit.quickbooks.accounting' +
    '&response_type=code' +
    '&state=' + generateAntiForgery(req.session);

  res.redirect(redirecturl);
});

app.get('/callback', function (req, res) {
  var auth = (new Buffer(consumerKey + ':' + consumerSecret).toString('base64'));

  var postBody = {
    url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth,
    },
    form: {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: 'http://localhost:' + port + '/callback/'  //Make sure this path matches entry in application dashboard
    }
  };

  request.post(postBody, function (e, r, data) {
    var accessToken = JSON.parse(r.body);
    // save the access token somewhere on behalf of the logged in user

    var qbo = new QuickBooks(consumerKey,
      consumerSecret,
      accessToken.access_token, /* oAuth access token */
      false, /* no token secret for oAuth 2.0 */
      req.query.realmId,
      true, /* use a sandbox account */
      true, /* turn debugging on */
      4, /* minor version */
      '2.0', /* oauth version */
     accessToken.refresh_token /* refresh token */);

     console.log(consumerKey);
     console.log(consumerSecret);
     console.log(accessToken.access_token);
     console.log(req.query.realmId);
     console.log(accessToken.refresh_token);
   
//     qbo.findAccounts(function (_, accounts) {
//      accounts.QueryResponse.Account.forEach(function (account) {
//        console.log(account.Name);
 //     });
 //   });
 var i;
 qbo.findAccounts(function (_, accounts) {
  accounts.QueryResponse.Account.forEach(function (account) {
   i++ ;
  });
});
console.log('Number of Accounts: ' + i)

console.log('consumerKey:' + consumerKey + ' consumerSecret' + consumerSecret + ' accessToken:' + accessToken.access_token + ' realmId:' + req.query.realmId + ' refreshtoken:' + accessToken.refresh_token);

  });

  res.send('<!DOCTYPE html><html lang="en"><head></head><body><script>window.opener.location.reload(); window.close();</script></body></html>');
});
