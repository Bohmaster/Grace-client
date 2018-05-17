var path = require('path'),
fs = require("fs");

console.log(__dirname, 'connections-si_com.crt');

exports.privateKey = fs.readFileSync(path.join(__dirname, '/connections-si_com.key')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, '/connections-si_com.crt')).toString();

console.log(exports.privateKey);