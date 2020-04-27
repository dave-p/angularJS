
var app = angular.module("mainApp", ["ngRoute"]);

function timeToMinutes(timeIn)	// UNUSED
{
	var timeArray = timeIn.split(':');
	return Number(timeArray[0]) * 60 + Number(timeArray[1]);
};



app.controller("getJson", function ($scope, $http) {

	$scope.epgArray = [];
	$scope.timeLine = [];

    $scope.selectContainer = function (id) {
		$scope.selectedTitle = id;
		$scope.selectedTime = id;
		$scope.selectedGenre = id;
		$scope.selectedText = id;
		$scope.selectedIcon = id;
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
			$http.get("static/genre_color.json")
			.then(function (catData)
			{
				var categoryDict = catData["data"];
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
								var col = categoryDict[row['genre'][0]];
							else
								var col = 'gray';
							var record = {
											name : row['title'],
											description : row['description'],
											color : col,
											id: row['eventId'],
											width : (duration * 5) - 6
										 };
							epgLine.push(record);
						})
					$scope.epgArray.push(epgLine);
					})
				})
				console.log($scope.epgArray);
			});
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


