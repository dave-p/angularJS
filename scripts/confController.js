// controller for loading a config-page
app.controller('configController', function($scope, $http, $filter) {
	var sideNavDiv = document.getElementsByClassName("sidenav")[0];
	var mainDiv = document.getElementsByClassName("main")[0];
	if (sideNavDiv['className'] == "sidenav sidenav_small") 
		angular.element(mainDiv).addClass("main_big");
	else
		angular.element(mainDiv).removeClass("main_big");






	// write the change to cookie
	$scope.noOfEpg_change = function(nr) {

		alert('Number of epg changed');

	}






	


	// MAIN: Program starts here


	}); // controller ends




