/**********************************************************************************************************
	Author: Derrick Fyfield
	Purpose:
		This "common" script will house things that I would want to reuse throughout this local server

**********************************************************************************************************/

// customObject = Pass in a custom object with variables/values that you would want to use with the data returned from the ajax call 

/*
	This object is used to make local server AJAX calls easier; 
*/

// EXTENSION METHODS 
	if (typeof Array.prototype.contains !== "function"){ Array.prototype.contains = function(value){ return this.includes(value); } }
	if (typeof Object.prototype.contains !== "function"){ Object.prototype.contains = function(value) { return this[value] != undefined; } }

const mydoc = {

	ready: function(callback){
		document.addEventListener("DOMContentLoaded", callback);
	},

	loadContent: function(content, identifier)
	{
		element = document.getElementById(identifier);
		element.innerHTML = content;
	}

};
const myajax = { 
	
	GetContentType: function(type){
		switch(type){
			case "JSON":
			case "json":
				return "application/json";
			default:
				return "text/plain";
		}
	},

	isValidAjaxObject: function(object){
		let state = {isValid: true, message:"All set"};

		if ( !object.contains("type") )
		{
			state.isValid = false;
			state.message = "Missing TYPE of call (GET vs. POST)";
			return state;
		}

		if (object["type"] == "POST" && !object.contains("data"))
		{
			state.isValid = false;
			state.message = "Doing a POST - but with no data";
		}

		return state;
	},

	AJAX: function(object){
		let checkObject = myajax.isValidAjaxObject(object);
		if (!checkObject.isValid){
			throw new Error(checkObject.message);
		}

		// Getting/Setting the parts of the call
		let method 	= object["type"];
		let url 	= object["url"];

		let success = object.contains("success") ? object["success"] : function(request){console.log(request);};
		let failure = object.contains("failure") ? object["failure"] : function(request){console.log(request);};

		// Setting up the request object
		var xhttp = new XMLHttpRequest();
		xhttp.open(method, url, true);

		// What to do after the call is made
		xhttp.onreadystatechange = function() {
			request = this;
			if (request.readyState == 4 && request.status == 200)
			{
				success(request);
			}
			else if (request.readyState == 4 && request.status != 200)
			{
				failure(request);
			}
		};

		// Send/proces the request
		if ( object.contains("data") )
		{
			let data = object["data"];
			xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			xhttp.send(data);
		}
		else
		{
			xhttp.send();
		}
	}

}