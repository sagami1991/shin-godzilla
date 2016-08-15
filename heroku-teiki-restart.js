const exec = require('child_process').exec;
var request = require('request');

function saikidou() {
	exec('heroku restart --app jupiter-story ', (err, stdout, stderr) => {
		if (err) { console.log(err); }
		console.log(stdout);
	});
}
function setuzoku(){
	request("https://jupiter-story.herokuapp.com/", function (error, response, body) {
	if(response.statusCode === 503){
		saikidou();
	}
	})
}

setInterval(() => setuzoku(), 30000);