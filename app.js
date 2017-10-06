var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url=require('url');
var fs=require('file-system');
var forEach=require('async-foreach').forEach;
var request = require('request');
var cheerio = require("cheerio");
var jimp=require("jimp");
var aws=require('aws-sdk');

var app = express();
let s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('port', (process.env.PORT || 3000));

console.log(MONGOLAB_URI);
//Setting up MongoDB Connection

var uristring =
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/dbName';

mongoose.connect(uristring, function (err, res) {
      if (err) {
      console.log ('ERROR connecting to: ' + uristring + '. ' + err);
      } else {
      console.log ('Succeeded connected to: ' + uristring);
      }
});	
	

//Defining Schema and Model 

var Schema = mongoose.Schema;

var querySchema = new Schema({
	_id: String,
    queryTime: String ,
    queryTerm: String,
},{ _id: false });

var queries = mongoose.model('queries', querySchema );


//++++++++++++++++++ Function to GET images And Save them to Amazon S3 after applying GreyScale +++++++++++++++++++++++++

function saveImages(searchQuery,cb){
	
	documentId= Math.random().toString(36).substring(7);
		
	request('https://www.google.com/search?tbm=isch&q='+searchQuery, function (error, response, body) {
			
			if(error){
				console.log("Error getting images");
			}
			else{
				var $ = cheerio.load(body);
				fileName=0;
				
				forEach(['0','1','2','3'],function(item,rowCount,arr){
					if(rowCount>3) return false;
					else{
						forEach(['0','1','2','3'],function(item,columnCount,arr){
							if(rowCount==3&&columnCount==3)  cb(documentId);
							else{
								str='.images_table  tbody tr:nth-child('+ (rowCount+1) +') td:nth-child(' + (columnCount+1) + ') a > img';							 
								
								src=$(str).attr('src');
								jimp.read(src, function (err, image) {
									if(err) console.log("Code 3: Jimp read Error");
									else{
										image.greyscale().getBase64(jimp.AUTO,function(err, imageData) {
											if(err) console.log("Code 4: Jimp Convert Error");
											
											imageData=imageData.replace(/^data:image\/jpeg;base64,/, "");
											
											params = {Bucket: 'nodescrapper', Key: '/' + documentId+'/'+fileName.toString()+'.jpg', Body: new Buffer(imageData, 'base64'),ACL:'public-read'};
											
											
											s3.putObject(params, function(err, data) {
												if (err) {
													console.log("Code 5: AWS upload Error");
												}
												else {
													console.log("Successfully uploaded file");
												}
											});
										});
										fileName=fileName+1;	
									}																	
								});
							}
						});
					}
				});
				
				
			}
		});
}


	
//+++++++++++++++++++++++++++ Routes ++++++++++++++++++++++++++++++

app.get('/',function (req,res) {
    res.sendFile(__dirname +'/home.htm');
});

app.get('/history',function(req,res){
	res.sendFile(__dirname +'/history.htm');
});

var fileId='';

app.get('/files',function(req,res){
	fileId=req.query.id;
	res.sendFile(__dirname+'/results.htm');
});

app.get('/getFiles',function(req,res){
	res.send(fileId);
});

app.get('/getQueries',function(req,res){
	queries.find({}, function (err, data) {
		if (err) 
			res.send(err);
		else  
			res.send(data);
	});
});


//Search Query 

app.post('/search',function(req,res){
	
	var searchTerm=req.body.query;
	var now = new Date();
	var timestamp=  now.getDate() + "-" + (now.getMonth()+1) + "-" + now.getFullYear() + "," + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

	saveImages(searchTerm,function(documentId){

		var queryInstance = new queries({ _id : documentId, queryTime : timestamp , queryTerm : searchTerm });
		queryInstance.save(function (err) {
								if (err){ 
									console.log("Error inserting in DB" + err);
									res.send("1");
								}
								else {
									console.log("Suceess inserting in DB");
									res.send("0");
								}
		});
	});
});

//+++++++++++++++++++++++++++ Routes  Ended  ++++++++++++++++++++++++++++++


//Starting Server

app.listen(app.get('port'), function() {
	console.log('App running on port', app.get('port'))
})


