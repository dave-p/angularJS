
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

function formatTime(seconds) {
	return [
		parseInt(seconds / 60 / 60),
		parseInt(seconds / 60 % 60),
		parseInt(seconds % 60)
	]
		.join(":")
		.replace(/\b(\d)\b/g, "0$1")
}

app.controller("getJson", function ($scope, $http) {

	$scope.timeLine = [];


	$scope.keyPress = function (event) {
		 switch (event.keyCode) {
			case 13:
				key = "ENTER";
				break;
			case 37:
				key = "LEFT";
				break;
			case 38:
				key = "UP";
				break;
			case 39:
				key = "RIGHT";
				break;
			case 40:
				key = "DOWN";
				break;
			}
		alert(key);
	};




	$scope.selectContainer = function (epgUnit) {
		var allEpgUnits = document.getElementsByClassName("epg_unit");
		angular.element(allEpgUnits).removeClass("selected");
		var selectedEpg = document.getElementById(epgUnit);
		angular.element(selectedEpg).toggleClass ("selected");
		var bottomDiv = document.getElementById("epg_bottom");
		angular.element(bottomDiv).css("visibility", "visible");
		$scope.selectedTitle = epgUnit['data']['title'];
		$scope.selectedTime = formatTime(epgUnit['data']['stop'] - epgUnit['data']['start']);
		$scope.selectedText = epgUnit['data']['description'];
		$scope.selectedIcon = epgUnit['data']['channelIcon'];
		if (angular.isDefined(epgUnit['data']['genre'])) {
			var genreInt = epgUnit['data']['genre'][0];
			$scope.selectedGenre = genre_dict[genreInt.toString(16)[0]][1]; // + ' (' + genreInt.toString(16) + ')';
		}
		else
			$scope.selectedGenre = '?';
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
	var hour = now.getHours();
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
						epgLine.push(record);
					})
				row['epgData'] = epgLine;
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


