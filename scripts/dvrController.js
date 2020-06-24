
app.controller('dvrController', function($scope, $http) {



	// MAIN: Program starts here
	$http.get("/api/dvr/entry/grid")
		.then(function (reply)
		{
			var dvrMain = document.getElementById('dvr_main');
			angular.forEach(reply['data']['entries'], function (value)
			{
				dvrMain['innerText'] += (value['disp_title'] + '\n');
			})
		})


	}); // controller ends












