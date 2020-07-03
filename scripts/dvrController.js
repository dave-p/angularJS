
app.controller('dvrController', function($scope, $http) {


	// used by main table, for sorting
	$scope.sort = {
			column: 'status',
			descending: false
		};
		
	// called by table headers, changes sorting
	$scope.changeSorting = function(column) {

		var sort = $scope.sort;

		if (sort.column == column) {
			sort.descending = !sort.descending;
		} else {
			sort.column = column;
			sort.descending = false;
		}
	};

	// check all checkboxes
    $scope.checkAll = function () {
		var checkBoxes = document.getElementsByClassName("dvrCheckbox");
        angular.forEach(checkBoxes, function (item) {
            item.checked = !$scope.selectAll;
        });
    };


	// MAIN: Program starts here
	$http.get("/api/dvr/entry/grid")
		.then(function (response) {	$scope.dvrData = response.data.entries });


	}); // controller ends













