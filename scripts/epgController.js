var epgPage = angular.module('ngToggle', []);
// The above line is not used, but should it be?



// controller for loading the EPG-page
app.controller("epgController", function ($scope) {
	var sideNavDiv = document.getElementsByClassName("sidenav")[0];
	var bottomDiv = document.getElementById("epg_bottom");
	var mainDiv = document.getElementsByClassName("main")[0];
	if (sideNavDiv['className'] == "sidenav sidenav_small") 
		angular.element(mainDiv).addClass("main_big");
	else
		angular.element(mainDiv).removeClass("main_big");
	var epgDataDiv = document.getElementById("epg_data");
	if (epgDataDiv) { epgDataDiv.scrollLeft = $scope.timeBoxWidth - 100; }

	$scope.epgBottomMinimized = true;
	// toggle epg_bottom-field size
	$scope.epgBottomToggleSize = function() {
		$scope.epgBottomMinimized = $scope.epgBottomMinimized === false ? true : false;
		alert('Alert was triggered!');
	};
});
