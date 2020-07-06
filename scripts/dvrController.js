
app.controller('dvrController', function($scope, $http) {

	// NOT USED : return list of uuids of all selected items
	OBSOLETEgetSelected = function () {
		var selected = [];
		angular.forEach($scope.dvrData, function (item) {
			if (item.checked) {
				selected.push([item['uuid'], item['status']]);
			}
        });
		return selected;
	}

	// Removes a completed recording
	removeDvr = function(obj) {
		var url = '/api/dvr/entry/remove';
		var data = http_build_query({ "uuid": obj.uuid });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				$scope.showInfobox('Removed "' + obj.disp_title);
			}
		}, function (response)
		{
			alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}

	// Removes a completed recording
	cancelDvr = function(obj) {
		var url = '/api/dvr/entry/cancel';
		var data = http_build_query({ "uuid": obj.uuid });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				$scope.showInfobox('Cancelled "' + obj.disp_title);
			}
		}, function (response)
		{
			alert('Sorry, an error occurred. API response was : "(' + response.status + ')"');
		});
	}

	// used by main table, for sorting
	$scope.sort = {
		column: 'status',
		descending: false
	};

	// called by clicking details overlay
	$scope.hideDetails = function () {
		document.getElementById("overlay").style.display = "none";
	}

	// called by clicking column title
	$scope.showDetails = function (item) {




		document.getElementById("overlay").style.display = "block";




	}







	// triggered by a change of a checkbox; adds or removes item to/from list of selected items
	$scope.addSelectedItem = function (item) {
		if (item.checked) {
			$scope.selectedItems.push(item);
		} else {
			$scope.selectedItems = $scope.selectedItems.filter(function(itemToDelete) {
				return itemToDelete.uuid !== item.uuid;
			});
		}
	}


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
		angular.forEach($scope.dvrData, function (item) {
			item.checked = !$scope.selectAll;
		});
	};


	// BUTTON : Removes or cancels all selected items
	$scope.deleteButton = function() {
		var uuidDeleted;
		angular.forEach($scope.selectedItems, function (item) {
			if (item.status === 'Scheduled for recording') {
				cancelDvr(item);
				uuidDeleted = item.uuid;
			} else {
				removeDvr(item);
				uuidDeleted = item.uuid;
			}
			// remove item from table data
			$scope.dvrData = $scope.dvrData.filter(function(item) {
				return item.uuid !== uuidDeleted;
			});
			// remove item from selected data
			$scope.selectedItems = $scope.selectedItems.filter(function(item) {
				return item.uuid !== uuidDeleted;
			});
		})
	}

	// MAIN: Program starts here
	$http.get("/api/dvr/entry/grid")
		.then(function (response)
			{
				$scope.dvrData = response.data.entries;
				$scope.selectedItems = [];
			});


	}); // controller ends




