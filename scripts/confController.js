// controller for loading a config-page
app.controller('configController', function($scope, $cookies, $http) {
	var sideNavDiv = document.getElementsByClassName("sidenav")[0];
	var mainDiv = document.getElementsByClassName("main")[0];
	if (sideNavDiv['className'] == "sidenav sidenav_small") 
		angular.element(mainDiv).addClass("main_big");
	else
		angular.element(mainDiv).removeClass("main_big");






	// write change to cookie
	$scope.noOfEpg_change = function() {
		var noOfEpgValue = document.getElementById('noOfEpg').value;
		$cookies.put('noOfEpgRecordsToGet', noOfEpgValue, { 'expires': $scope.expireDate });
	}


	// write change to cookie
	$scope.dvrConfig_change = function() {
		var prefRecProfileValue = document.getElementById('prefRecProfile').value;
		if (prefRecProfileValue.startsWith('string:')) { prefRecProfileValue = prefRecProfileValue.substring(7); }
		$cookies.put('preferedDvrConfig', prefRecProfileValue, { 'expires': $scope.expireDate });
	}








	// MAIN: Program starts here
	$scope.addRecordingConfigs = {};
	$http.get("/api/dvr/config/grid")
		.then(function (response2)
		{
			angular.forEach(response2.data.entries, function (item) {
				if (item.name == "") { item.name = "(Default profile)" };
				$scope.addRecordingConfigs[item.name] = item.uuid;
			});
		});




	}); // controller ends




