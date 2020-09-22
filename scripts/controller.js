
var app = angular.module('mainApp', ['ngCookies', 'ngRoute']);

var genre_dict = 
{ 
	"0" : [ "#898a8d", "Undefined" ],
	"1" : [ "#ad8f72", "Movie / Drama" ],
	"2" : [ "#657665", "News / Current affairs" ],
	"3" : [ "#adad72", "Show / Game show" ],
	"4" : [ "#b36f77", "Sports" ],
	"5" : [ "#72ada6", "Children's / Youth programs" ],
	"6" : [ "#7fb282", "Music / Ballet / Dance" ],
	"7" : [ "#6d80b1", "Arts / Culture (without music)" ],
	"8" : [ "#838384", "Social / Political issues / Economics" ],
	"9" : [ "#9b759b", "Education / Science / Factual topics" ],
	"a" : [ "#9797aa", "Leisure hobbies" ],
	"b" : [ "#9797bb", "Special" ] 
};


// determines the type af a recording status
function getRecordingStatusIcon(status) {
	switch (status) {
		case 'scheduled':
			return 'static/img/watch.png';
		case 'recording':
			return'static/img/recording.png';
		case 'completed':
			return 'static/img/recCompleted.png';
		case 'completedError':
			return 'static/img/recCompleted.png';
		case 'completedWarning':
			return 'static/img/recCompleted.png';
		case 'completedRerecord':
			return 'static/img/recCompleted.png';
		}
	return '';
}


// formats EPG time to match universal time
function getUniversalTime(seconds) {	
	secondsString = seconds.toString();
	return parseInt(secondsString + '000');
}


function calculateTimeboxWidth(tls) {
	var now = new Date();
	var correctionMiliSeconds = now.getTime() - tls;
	var correctionMinutes = correctionMiliSeconds / 1000 / 60;
	return (correctionMinutes * 5).toFixed(0) - 3;
}


function http_build_query( arrayIn ) {
	var tmp_arr = [];
	for (key in arrayIn) {
		tmp_arr.push(key.toString() + '=' + arrayIn[key].toString());
	}
	return tmp_arr.join('&');
}


// returns the position (row, coulmm) of the currently selected epgUnit, if any, else false
function getGridPosition() {
	var selectedUnit = document.getElementsByClassName("selected");
	if (angular.isDefined(selectedUnit[0])) {
		var rowIndex = selectedUnit[0]['className'].split(" ")[2].substring(8);
		var gridPos = rowIndex.split('-');
		return gridPos;
	} else {
		return false;
	}
}


app.controller("commonController", function ($scope, $http, $interval, $timeout, $cookies) { 		// TODO : This is a controller for much, much more. Put into separate controllers

	// ------------- set up variables -----------------------------------------------------------

	$scope.timeLine = [];
	$scope.maxEpgWidth = 0;
	$scope.timeBoxHeigth = 15;
	$scope.expireDate = new Date();
	$scope.expireDate.setTime(2144232732000);
	var now = new Date();
	var hour = now.getHours() - 2;
	var timeObj = new Date( now.toString().split(':')[0] + ":00:00" );
	var timeLineStart = timeObj.getTime() - 30 * 60 * 1000;					// subtract 1/2 hour to be sure to be before first object


	// ------------- functions ------------------------------------------------------------------


	// fired when page has been rendered
	$timeout(function() {
		var timeBoxDiv = document.getElementById("epg_timebox");
		$scope.timeBoxWidth = calculateTimeboxWidth(timeLineStart);
		var epgDataDiv = document.getElementById("epg_data");
		if (epgDataDiv) { epgDataDiv.scrollLeft = $scope.timeBoxWidth - 100; }
		if ($cookies.get('mainMenuCollapsed') === 'true') { $scope.showHideSidebar(); }
		if ($cookies.get('channelMenuCollapsed') === 'true') { $scope.showHideChannelNames(); }
	}, 50);


	// reload page every minute to set time
	$interval(function () {
		// Update the timebox to show time progressing
		$scope.timeBoxWidth = calculateTimeboxWidth(timeLineStart);
//		var timeBoxDiv = document.getElementById("epg_timebox");
//		angular.element(timeBoxDiv).css('width', calculateTimeboxWidth(timeLineStart) + 'px');
	}, 60000);


	// show an infobox for x seconds, then remove it
	$scope.showInfobox = function(text) {
		// check if one or more infoboxes exist already
		var infoBoxContainer = document.getElementById('infoBoxContainer')
		var infoBox = document.createElement('div');
		infoBox.setAttribute("class", "infoBox");
		infoBox.innerHTML = text;
		infoBoxContainer.append(infoBox);
		setTimeout(function () {
			angular.element(infoBox).addClass("fadedOut");
		}, 3000);
		setTimeout(function () {
			infoBox.parentNode.removeChild(infoBox);
		}, 6000);
	}

	// fill out data on the bottom EPG display
	$scope.fillBotomEPG = function(epgUnit) {
		$scope.selectedEpgUnit = epgUnit;
		$scope.selectedEpgUnit['show'] = true;
		var bottomDiv = document.getElementById("epg_bottom");
		var objStart = new Date(epgUnit['data']['start']);
		var objStop = new Date(epgUnit['data']['stop']);
		var timeArray = [	(objStart.getHours()).toString(), 
							(objStart.getMinutes()).toString(), 
							(objStop.getHours()).toString(), 
							(objStop.getMinutes()).toString()
						];
		if (timeArray[0].length == 1) {timeArray[0] = '0' + timeArray[0]}
		if (timeArray[1].length == 1) {timeArray[1] = '0' + timeArray[1]}
		if (timeArray[2].length == 1) {timeArray[2] = '0' + timeArray[2]}
		if (timeArray[3].length == 1) {timeArray[3] = '0' + timeArray[3]}
		epgUnit['data']['fromToTime'] = timeArray[0] + ':' + timeArray[1] + ' - ' + timeArray[2] + ':' + timeArray[3];
		// hotfix for no description
		if (!angular.isDefined(epgUnit['data']['description'])) {
			if (angular.isDefined(epgUnit['data']['summary']))
				epgUnit['data']['description'] = epgUnit['data']['summary'];
			else
				epgUnit['data']['description'] = '<no description available>';
		}
		if (angular.isDefined(epgUnit['data']['genre'])) {
			var genreInt = epgUnit['data']['genre'][0];
			epgUnit['data']['genreText'] = genre_dict[genreInt.toString(16)[0]][1];
		}
		else
			epgUnit['data']['genreText'] = '(unknown)';
		// change button text
		// Do not show if no data
		if (epgUnit['data']['title'] != "No EPG found for this Channel") {
			angular.element(bottomDiv).css("visibility", "visible");


			var recordButton = document.getElementById('recordProgram');
			var recordSeriesButton = document.getElementById('recordSeries');
			angular.element(recordButton).css("visibility", "visible");
			angular.element(recordSeriesButton).css("visibility", "visible");
			if (angular.isDefined(epgUnit['data']['dvrState']))
			{
				angular.element(recordSeriesButton).css("visibility", "hidden");
				var status = epgUnit['data']['dvrState'];
				if (status == 'scheduled')
					recordButton.innerText = 'Cancel Recording';
				else if (status == 'recording')
					recordButton.innerText = 'Stop Recording';
				var testActive = 1;
			}
			else {
				recordButton.innerText = 'Record';
				var now = new Date();
				if (now.getTime() > epgUnit['data']['stop']) {
					angular.element(recordButton).css("visibility", "hidden");
					angular.element(recordSeriesButton).css("visibility", "hidden");
				}
			}
		}
	}


	// handle a key pressed on the keyboard
	$scope.keyPress = function (event) {
		var selectedUnit = document.getElementsByClassName("selected");
		if (angular.isDefined(selectedUnit[0])) { 
			var id = selectedUnit[0]['id'];
			var rowIndex = selectedUnit[0]['className'].split(" ")[2].substring(8);
			var gridPos = rowIndex.split('-');
			var curEpgTime = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]]['data']['start'];
			var match = false;
			var epgUnit = false;
			angular.element(selectedUnit).removeClass("selected");
			switch (event.keyCode) {
				case 37:	//	key = "LEFT";
					if (gridPos[1] > 0)
						gridPos[1] = parseInt(gridPos[1]) - 1;
					epgUnit = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]];
					break;
				case 39:	//	key = "RIGHT";
					if (gridPos[1] < $scope.channelList[gridPos[0]]['epgData'].length - 1)
						gridPos[1] = parseInt(gridPos[1]) + 1;
					epgUnit = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]];
					break;
				case 38:	//	key = "UP";
					if (gridPos[0] > 0)
						gridPos[0] = parseInt(gridPos[0]) - 1;
					var newRow = $scope.channelList[gridPos[0]]['epgData'];		// the row of the new selction, must find correct object by time
					angular.forEach(newRow, function (row)
					{
						if (row['data']["stop"] > curEpgTime && !match)
						{
							epgUnit = row;
							match = true;
						}
					})
					if (!epgUnit) { epgUnit = newRow[newRow.length - 1]; }
					break;
				case 40:	//	key = "DOWN";
					if (gridPos[0] < $scope.channelList.length - 1)
						gridPos[0] = parseInt(gridPos[0]) + 1;
					var newRow = $scope.channelList[gridPos[0]]['epgData'];		// the row of the new selction, must find correct object by time
					angular.forEach(newRow, function (row)
					{
						if (row['data']["stop"] > curEpgTime && !match)
						{
							epgUnit = row;
							match = true;
						}
					})
					if (!epgUnit) { epgUnit = newRow[newRow.length - 1]; }
					break;
				default:
					epgUnit = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]];
					break;
				}
			var nyDiv = document.getElementById(epgUnit['data']['eventId']);
			angular.element(nyDiv).addClass("selected");
			$scope.fillBotomEPG(epgUnit);
			// correct the windows scroll
			nyDiv.scrollIntoView(); 
		}
	};


	// toggle epg_bottom-field size
	$scope.epgBottomToggleSize = function() {
		var epg_bottom = document.getElementById('epg_bottom');
		var epg_bottom_image = document.getElementById('epg_bottom_image');
		var epg_bottom_placeholder = document.getElementById('epg_bottom_placeholder');
		var epg_bottom_description = document.getElementById('epg_bottom_description');
		var epg_bottom_title = document.getElementById('epg_bottom_title');
		var minimized = document.getElementsByClassName("minimized")[0];
		if (minimized['style']['max-width'] != "80px") {
			angular.element(epg_bottom).css("height", "65px");
			angular.element(epg_bottom_image).css("margin", "4px");
			angular.element(epg_bottom_image).css("width", "50px");
			angular.element(epg_bottom_placeholder).css("visibility", "hidden");
			angular.element(epg_bottom_description).css("visibility", "hidden");
			angular.element(epg_bottom_title).css("margin-top", "6px");
			angular.element(minimized).css("max-width", "80px");
		} else {
			angular.element(epg_bottom).css("height", "245px");
			angular.element(epg_bottom_image).css("margin", "19px");
			angular.element(epg_bottom_image).css("width", "");
			angular.element(epg_bottom_placeholder).css("visibility", "visible");
			angular.element(epg_bottom_description).css("visibility", "visible");
			angular.element(epg_bottom_title).css("margin-top", "");
			angular.element(minimized).css("max-width", "");
		}
	}


	// determine action of the button
	$scope.epgBottomButton = function() {
		var recordButton = document.getElementById('recordProgram');
			if (recordButton.innerText == 'Cancel Recording')
				$scope.stopRunningRecording();						// TODO: get $scope.cancelScheduledRecording() to work
			else if (recordButton.innerText == 'Stop Recording')
				$scope.stopRunningRecording();
			else if (recordButton.innerText == 'Record')
				$scope.recordProgram();
	}


	// does not work
	$scope.cancelScheduledRecording = function() {
		var url = '/api/dvr/entry/stop';
		var data = http_build_query({ "uuid": $scope.selectedEpgUnit['data']['dvrUuid'] });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				var gridPos = getGridPosition();
				$scope.updateChannelEpg(gridPos[0]);
				var recordButton = document.getElementById('recordProgram');
				var recordSeriesButton = document.getElementById('recordSeries');
				recordButton.innerText = 'Record';
				angular.element(recordSeriesButton).css("visibility", "visible");
				$scope.showInfobox('Scheduled recording was canceled');
			}
		}, function (response)
		{
				alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}


	$scope.stopRunningRecording = function() {
		var url = '/api/dvr/entry/cancel';
		var data = http_build_query({ "uuid": $scope.selectedEpgUnit['data']['dvrUuid'] });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				var gridPos = getGridPosition();
				$scope.updateChannelEpg(gridPos[0]);
				var recordButton = document.getElementById('recordProgram');
				var recordSeriesButton = document.getElementById('recordSeries');
				recordButton.innerText = 'Record';
				angular.element(recordSeriesButton).css("visibility", "visible");
				$scope.showInfobox('Active recording was stopped');
			}
		}, function (response)
		{
				alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}


	// record a specific program
	$scope.recordProgram = function() {
		var url = '/api/dvr/entry/create_by_event';
		var data = http_build_query({ "event_id": $scope.selectedEpgUnit['data']['eventId'], "config_uuid": $scope.dvrConfig });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
			.then(function (response)
			{
				if (response.data) {
					var gridPos = getGridPosition();
					$scope.updateChannelEpg(gridPos[0]);
					var recordButton = document.getElementById('recordProgram');
					var recordSeriesButton = document.getElementById('recordSeries');
					recordButton.innerText = 'Cancel Recording';
					angular.element(recordSeriesButton).css("visibility", "hidden");
//					$scope.selectedEpgUnit['data']['dvrState'] = 'TESTING!';
					$scope.showInfobox('Program was scheduled for recording');
			}
			}, function (response)
			{
					alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
			});
	};


	// create an autorec from a specific program, recording all programs like it
	$scope.recordSeries = function() {
		var url = '/api/dvr/autorec/create_by_series';
		var data = http_build_query({ "event_id": $scope.selectedEpgUnit['data']['eventId'], "config_uuid": $scope.dvrConfig });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
			.then(function (response)
			{
				if (response.data) {
					var gridPos = getGridPosition();
					$scope.updateChannelEpg(gridPos[0]);
					var recordButton = document.getElementById('recordProgram');
					var recordSeriesButton = document.getElementById('recordSeries');
					recordButton.innerText = 'Cancel Recording';
					angular.element(recordSeriesButton).css("visibility", "hidden");
					$scope.showInfobox('A series was scheduled for recording');
				}
			}, function (response)
			{
					alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
			});
	};


	$scope.selectContainer = function(epgUnit) {
		var allEpgUnits = document.getElementsByClassName("epg_unit");
		angular.element(allEpgUnits).removeClass("selected");
		var selectedEpg = document.getElementById(epgUnit['data']['eventId']);
		angular.element(selectedEpg).toggleClass ("selected");
		$scope.fillBotomEPG(epgUnit);
	};


	$scope.showHideSidebar = function() {
		var sideNavDiv = document.getElementsByClassName("sidenav")[0];
		var bottomDiv = document.getElementById("epg_bottom");
		var mainDiv = document.getElementsByClassName("main")[0];
		angular.element(sideNavDiv).toggleClass("sidenav_small");	// toggle this, use its status to determine others
		if (sideNavDiv['className'] == "sidenav sidenav_small") {
			angular.element(mainDiv).addClass("main_big");
			$cookies.put('mainMenuCollapsed', true);
		}
		else{
			angular.element(mainDiv).removeClass("main_big");
			$cookies.put('mainMenuCollapsed', false);
		}
	};


	$scope.showHideChannelNames = function() {
		var channelDiv = document.getElementById("epg_channels");
		angular.element(channelDiv).toggleClass ("epg_channels_big");
		angular.element(channelDiv).toggleClass("epg_channels_small");
		if (channelDiv['className'] == "epg_channels_small")
			$cookies.put('channelMenuCollapsed', true);
		else
			$cookies.put('channelMenuCollapsed', false);
	}


	$scope.updateAllChannelsEpg = function() {
		var i;
		for (i = 0; i < $scope.channelList.length; i++) {
			$scope.updateChannelEpg(i);
		}
	}


	// update a channel, by given ROW index
	$scope.updateChannelEpg = function(index) {
		var ID = $scope.channelList[index]['uuid'];
		var totalWidth = 0;
		$http.get("/api/epg/events/grid?limit=" + $scope.noOfEpgRecordsToGet + "&channel=" + ID)
		.then(function (data)
		{
			var epgLine = [];
			if (data["data"]["entries"].length == 0)
			{
				row = [];
				var record = {
								color : 'gray',
								width : 400,
								data : row
							 };
				row["title"] = "No EPG found for this Channel";
				row["channelIcon"] = "/static/angularJS/static/img/logosmall.png";
				epgLine.push(record);
			}
			else 
			{
				angular.forEach(data["data"]["entries"], function (row)
				{
					var duration = (row["stop"] - row["start"]) / 60;
					if (angular.isDefined(row['genre']))
						var col = genre_dict[ row['genre'][0].toString(16)[0] ][0];
					else
						var col = 'gray';
					var calcWidth = (duration * 5) - 6;
					var record = {
									color : col,
									width : calcWidth,
									data : row
								 };
					totalWidth += calcWidth;
					row["start"] = getUniversalTime(row["start"]);
					row["stop"] = getUniversalTime(row["stop"]);
					if (angular.isDefined(row['dvrState']))
						row['recStatus'] = getRecordingStatusIcon(row['dvrState']);
					epgLine.push(record);
				})
			}


		// update maxEPGwidth and timeline
		if (totalWidth > $scope.maxEpgWidth) {
			$scope.maxEpgWidth = totalWidth;
			$scope.timeLine.length = 0;
			var hour = now.getHours() - 1;
			var oddEven = 1; //(now.getMinutes() <= 30) ? 1 : 1;
			for (var x = 0; x < (($scope.maxEpgWidth) / 150); x += 1)
			{
				if (hour === 24) {hour = 0};
				if (oddEven) {
					$scope.timeLine.push(hour + ":30");					// forkert
					oddEven = 0;
					hour++;
				} else {
					$scope.timeLine.push(hour + ":00");					// passer
					oddEven = 1;
				}
			}
		}
		$scope.channelList[index]['epgData'] = epgLine;
		// calculate correction for each rows' starting position
		var firstEpgUnitStart = epgLine[0]['data']['start'];
		// if program starts before timeline, shorten it
		if (firstEpgUnitStart < timeLineStart) {
			var duration = (epgLine[0]['data']['stop'] - timeLineStart) / 1000 / 60;
			var calcWidth = (duration * 5) - 12;
			epgLine[0]['width'] = calcWidth;
		}
		var correctionMiliSeconds = firstEpgUnitStart - timeLineStart;
		var correctionMinutes = correctionMiliSeconds / 1000 / 60;
		$scope.channelList[index]['offset'] = correctionMinutes * 5;
		})
		.then(function (data){
			// update the selectedUnit
			var gridPos = getGridPosition();
			if (gridPos) {
				$scope.selectedEpgUnit = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]];
				setTimeout(function () {
					// set ccs-class back to selected epg_unit
					var selectedDiv = document.getElementById($scope.selectedEpgUnit['data']['eventId']);
					angular.element(selectedDiv).addClass("selected");
					var epgdataDiv = document.getElementById('epg_data');
					epgdataDiv.focus();
				}, 300);
			}
		})
	}


	// MAIN: Program starts here
	var cookieA = $cookies.get('noOfEpgRecordsToGet');
	if (!angular.isDefined(cookieA)) { cookieA = 15; }
	$scope.noOfEpgRecordsToGet = parseInt(cookieA);
	var cookieB = $cookies.get('preferedDvrConfig');
	$scope.dvrConfig = $cookies.get('preferedDvrConfig');
	if (!angular.isDefined($scope.dvrConfig)) { 
		// load first available  config
		$http.get("/api/dvr/config/grid")
			.then(function (reply) 	{ $scope.dvrConfig = reply.data.entries[0].uuid; })
	}
	$http.get("/api/channel/grid")
		.then(function (data)
		{
			$scope.channelList = data["data"]['entries'];
			var rowIndex = 0;
			angular.forEach($scope.channelList, function (row)
			{
				$scope.updateChannelEpg(rowIndex++);
				$scope.timeBoxHeigth += 50;
			})
//					console.log($scope.channelList);
		})
	}); // controller ends


app.config(function($routeProvider) {
	$routeProvider
	.when("/", {
		templateUrl : "static/templates/welcome_page.html"
	})
	.when("/epg", {
		templateUrl : "static/templates/epg_page.html",
		controller : "epgController"
	})
	.when("/dvr", {
		templateUrl : "static/templates/dvr_page.html",
		controller : "dvrController"
	})
	.when("/conf", {
		templateUrl : "static/templates/conf_page.html",
		controller : "configController"
	})
	.when("/status", {
		templateUrl : "static/templates/status_page.html",
		controller : "statusController"
	})
	.when("/about", {
		templateUrl : "static/templates/about_page.html",
		controller : "aboutController"
	});
});


// controller for loading a status-page
app.controller("statusController", function ($scope, $http) {
	var sideNavDiv = document.getElementsByClassName("sidenav")[0];
	var mainDiv = document.getElementsByClassName("main")[0];
	if (sideNavDiv['className'] == "sidenav sidenav_small") 
		angular.element(mainDiv).addClass("main_big");
	else
		angular.element(mainDiv).removeClass("main_big");
	$http.get("/api/status/inputs")
		.then(function (response) {	$scope.streamData = response.data.entries });
	$http.get("/api/status/subscriptions")
		.then(function (response) {	$scope.subscriptionsData = response.data.entries });
	$http.get("/api/status/connections")
		.then(function (response) {	$scope.connectionsData = response.data.entries });
	$http.get("/api/service/mapper/status")
		.then(function (response) {	$scope.serviceMapperData = response.data });
	$http.get("/api/serverinfo")
		.then(function (response) {	$scope.serverInfo = response.data });
	$http.get("/api/memoryinfo/grid")
		.then(function (response) {	$scope.memoryInfo = response.data });
	$scope.clearStreamStats = function(uuid) {
		var url = '/api/status/inputclrstats';
		var data = http_build_query({ "uuid": uuid });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				$scope.showInfobox('Stream statistics cleared');
				$http.get("/api/status/inputs")
					.then(function (response) {	$scope.streamData = response.data.entries });
			}
		}, function (response)
		{
			alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}

	$scope.dropConnection = function(id) {
		var url = '/api/connections/cancel';
		var data = http_build_query({ "id": id });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				$scope.showInfobox('Connection dropped');
				$http.get("/api/status/connections")
					.then(function (response) {	$scope.connectionsData = response.data.entries });
			}
		}, function (response)
		{
			alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}
});		// status-page controller ends


// controller for loading a about-page
app.controller("aboutController", function ($scope, $http) {
	var sideNavDiv = document.getElementsByClassName("sidenav")[0];
	var mainDiv = document.getElementsByClassName("main")[0];
	if (sideNavDiv['className'] == "sidenav sidenav_small") 
		angular.element(mainDiv).addClass("main_big");
	else
		angular.element(mainDiv).removeClass("main_big");

});





