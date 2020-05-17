
var app = angular.module("mainApp", ["ngRoute"]);

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


// formats EPG time to match universal time
function getUniversalTime(seconds) {	
	secondsString = seconds.toString();
	return parseInt(secondsString + '000');
}


app.controller("getJson", function ($scope, $http) {

	$scope.timeLine = [];

	$scope.fillBotomEPG = function(epgUnit) {	// fill out data on the bottom EPG display
			var bottomDiv = document.getElementById("epg_bottom");
			angular.element(bottomDiv).css("visibility", "visible");
			$scope.selectedTitle = epgUnit['data']['title'];
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


			$scope.selectedTime = timeArray[0] + ':' + timeArray[1] + ' - ' + timeArray[2] + ':' + timeArray[3];
			$scope.selectedText = epgUnit['data']['description'];
			$scope.selectedIcon = epgUnit['data']['channelIcon'];
			if (angular.isDefined(epgUnit['data']['genre'])) {
				var genreInt = epgUnit['data']['genre'][0];
				$scope.selectedGenre = genre_dict[genreInt.toString(16)[0]][1];
			}
			else
				$scope.selectedGenre = '?';
	}


	$scope.keyPress = function (event) {	// handle a key pressed on the keyboard
		var selectedUnit = document.getElementsByClassName("selected");
		var id = selectedUnit[0]['id'];
		var rowIndex = selectedUnit[0]['className'].split(" ")[2].substring(8);
		var gridPos = rowIndex.split('-');
		var curEpgTime = $scope.channelList[gridPos[0]]['epgData'][gridPos[1]]['data']['start'];
		var match = false;
		var epgUnit;
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
				break;
			}
		var nyDiv = document.getElementById(epgUnit['data']['eventId']);
		angular.element(nyDiv).addClass("selected");
		$scope.fillBotomEPG(epgUnit);
	};



	$scope.selectContainer = function (epgUnit) {
		var allEpgUnits = document.getElementsByClassName("epg_unit");
		angular.element(allEpgUnits).removeClass("selected");
		var selectedEpg = document.getElementById(epgUnit['data']['eventId']);
		angular.element(selectedEpg).toggleClass ("selected");
		$scope.fillBotomEPG(epgUnit);
	};


	$scope.showHideSidebar = function() {
		var sideNavDiv = document.getElementsByClassName("sidenav");
		angular.element(sideNavDiv).toggleClass ("sidenav_big");
		angular.element(sideNavDiv).toggleClass("sidenav_small");
		var mainDiv = document.getElementsByClassName("main");
		angular.element(mainDiv).toggleClass ("main_big");
		angular.element(mainDiv).toggleClass("main_small");
		var bottomDiv = document.getElementById("epg_bottom");
		angular.element(bottomDiv).toggleClass("epg_bottom_wide");
	};

	$scope.showHideChannelNames = function() {
		var channelDiv = document.getElementById("epg_channels");
		angular.element(channelDiv).toggleClass ("epg_channels_big");
		angular.element(channelDiv).toggleClass("epg_channels_small");
	}

	var now = new Date();
	var hour = now.getHours() - 2;
	var timeObj = new Date( now.toString().split(':')[0] + ":00:00" );	// uskønt... men, for at få hele timer
	var timeLineStart = timeObj.getTime() - 2 * 60 * 60 * 1000;	// subtrack two hours to be sure to be before first object
	for (var x = 0; x < 24; x += 1)
	{
		if (hour === 24) {hour = 0};
		$scope.timeLine.push(hour + ':00');
		$scope.timeLine.push(hour + ':30');
		hour++;
	}

	$http.get("/api/channel/grid")
		.then(function (data)
		{
			$scope.channelList = data["data"]['entries'];
			angular.forEach($scope.channelList, function (row)
			{
				$http.get("/api/epg/events/grid?limit=25&channel=" + row['uuid'])
				.then(function (data)
				{
					var epgLine = [];
					angular.forEach(data["data"]["entries"], function (row)
					{
						var duration = (row["stop"] - row["start"]) / 60;
						if (angular.isDefined(row['genre']))
							var col = genre_dict[ row['genre'][0].toString(16)[0] ][0];
						else
							var col = 'gray';
						var record = {
										color : col,
										width : (duration * 5) - 6,
										data : row
									 };
						row["start"] = getUniversalTime(row["start"]);
						row["stop"] = getUniversalTime(row["stop"]);
						epgLine.push(record);
					})
				row['epgData'] = epgLine;
				// calculate correction for each rows' starting position
				var firstEpgUnitStart = row['epgData'][0]['data']['start'];
				var correctionMiliSeconds = firstEpgUnitStart - timeLineStart;
				var correctionMinutes = correctionMiliSeconds / 1000 / 60;
				row['offset'] = (correctionMinutes * 5);
				})
			})
			console.log($scope.channelList);
		})
	});


app.config(function($routeProvider) {
	$routeProvider
	.when("/epg", {
		templateUrl : "static/templates/epg_page.html"
	})
	.when("/dvr", {
		templateUrl : "static/templates/dvr_page.html"
	})
	.when("/conf", {
		templateUrl : "static/templates/conf_page.html"
	})
	.when("/status", {
		templateUrl : "static/templates/status_page.html"
	})
	.when("/about", {
		templateUrl : "static/templates/about_page.html"
	});
});


