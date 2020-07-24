
app.controller('newRecordingController', ['$scope', function($scope) {
	var now = new Date();
	$scope.addRecordingStartDate = { value: now };
	$scope.addRecordingStartTime = { value: now };
	$scope.addRecordingStopDate =  { value: now };
	$scope.addRecordingStopTime =  { value: now };
}])


app.controller('dvrController', function($scope, $http, $filter) {

	// loads or reloads the page data
	loadDvrData = function(obj) {
		$http.get("/api/dvr/entry/grid")
			.then(function (response)
				{
					$scope.dvrData = response.data.entries;
					$scope.selectedItems = [];
					$scope.selectedCat =
					{
						completed:		0,
						fileMissing:	0,
						scheduled:		0,	
						timeMissed:		0,
						running:		0 
					};
					// uncheck all checkboxes
					angular.forEach($scope.dvrData, function (item) {
						item.checked = false;
					});
				});
	}


	// generic function to make a POST to an API 											// should support returning data
	httpPost = function(url, dataRaw, successMessage) {
		var data = http_build_query(dataRaw);
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			if (response.data) {
				$scope.showInfobox(successMessage);
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
		document.getElementById("overlayDetails").style.display = "none";
		document.getElementById("overlayAddRecording").style.display = "none";		
	}


	// called by clicking column title
	$scope.showDetails = function (item) {
		// fill in data to overlay
		$scope.detailsData = [];
		$scope.detailsData.icon = item.channel_icon;
		$scope.detailsData.channelName = item.channelname;
		$scope.detailsData.title = item.disp_title;
		$scope.detailsData.start = item.start;
		$scope.detailsData.stop = item.stop;
		$scope.detailsData.duration = item.stop - item.start;
		$scope.detailsData.description = item.disp_description;
		$scope.detailsData.status = item.status;
		$scope.detailsData.comment = item.comment;								// Handle if it does not exist!
		$scope.detailsData.fileSize = (item.filesize / (1000*1000*1000)).toFixed(1);
		$scope.detailsData.fileName= item.filename.split('\\').pop().split('/').pop();
		// show overlay
		document.getElementById("overlayDetails").style.display = "block";
	}


	// triggered by a change of a checkbox; adds or removes item to/from list of selected items, and keeps record of types selected
	$scope.addSelectedItem = function (item) {
		if (item.checked) {
			$scope.selectedItems.push(item);
			if (item.status === "Completed OK" || item.status === "Forced OK")
				$scope.selectedCat.completed++;
			else if (item.status === "File missing" || item.status === "Aborted by user")
				$scope.selectedCat.fileMissing++;
			else if (item.status === "Scheduled for recording")
				$scope.selectedCat.scheduled++;
			else if (item.status === "Time missed" || item.status === "User request")
				$scope.selectedCat.timeMissed++;
			else if (item.status === "Running")
				$scope.selectedCat.running++;
		} else {
			$scope.selectedItems = $scope.selectedItems.filter(function(itemToDelete) {
				return itemToDelete.uuid !== item.uuid;
			});
			if (item.status === "Completed OK" || item.status === "Forced OK")
				$scope.selectedCat.completed--;
			else if (item.status === "File missing" || item.status === "Aborted by user")
				$scope.selectedCat.fileMissing--;
			else if (item.status === "Scheduled for recording")
				$scope.selectedCat.scheduled--;
			else if (item.status === "Time missed" || item.status === "User request")
				$scope.selectedCat.timeMissed--;
			else if (item.status === "Running")
				$scope.selectedCat.running--;
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


	// clears all input-fields within the given element
	clearInputs = function (inputsParent) {
		var now = new Date();
		angular.forEach(angular.element(inputsParent.querySelectorAll('input[type=text]')), function (elem, index) {
			elem.value = '';
		});
		angular.forEach(angular.element(inputsParent.querySelectorAll('input[type=date]')), function (elem, index) {
			elem.value = $filter('date')(now, 'yyyy-MM-dd');
			elem.min = $filter('date')(now, 'yyyy-MM-dd');
		});
		angular.forEach(angular.element(inputsParent.querySelectorAll('input[type=time]')), function (elem, index) {
			elem.value = $filter('date')(now, 'HH:mm');
			elem.min = $filter('date')(now, 'HH:mm');
		});
	};








	// BUTTON : Calls API and closes the newRecording-dialogue
	$scope.newRecordingAccept = function() {


		// TODO : Load selectable values into dialogue


		// TODO : collect values --> call API

		var value1  = 0;
		var value2  = 0;
		var value3  = 0;
		var value4  = 0;
		var value5  = 0;
		var value6  = 0;
		var value7  = 0;
		var value8  = 0;
		var value9  = 0;
		var value10 = 0;





		alert('newRecordingAccept-button was pressed!');



		var dialogue = document.getElementById("overlayAddRecording");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}








	// BUTTON : Closes the newRecording-dialogue
	$scope.newRecordingCancel = function() {
		var dialogue = document.getElementById("overlayAddRecording");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Stops a running or cancels a scheduled recording 
	$scope.stopButton = function() {
		angular.forEach($scope.selectedItems, function (item) {
			if (item.status === 'Running')
				httpPost('/api/dvr/entry/cancel', { 'uuid': item.uuid }, 'Stopped recording of "' + item.disp_title + '"')
			else
				httpPost('/api/dvr/entry/cancel', { 'uuid': item.uuid }, 'Cancelled recording of "' + item.disp_title + '"')
		});
		// reload data
		loadDvrData();
	}


	// BUTTON : Toggles Enable/Disable of scheduled recordings 
	$scope.enableDisableButton = function() {
		angular.forEach($scope.selectedItems, function (item) {
			var url = '/api/idnode/load';
			var data = http_build_query({ "uuid": item.uuid });
			var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
			$http.post(url, data, headers)
			.then(function (response)
			{
				var parameters = response.data.entries[0].params;
				var newEnabledStatus = !parameters[0].value;
				var rawData = [{ "enabled": newEnabledStatus, "uuid": item.uuid }];

				var url = '/api/idnode/save';
				var rawDataEncoded = "node=" + encodeURIComponent(JSON.stringify(rawData));
				var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
				$http.post(url, rawDataEncoded, headers)
				.then(function (response)
				{
					loadDvrData();
					$scope.showInfobox('Enabled status was changed for "' + item.disp_title + '"');
				}, function (response)
				{
					alert('Sorry, an error occurred on "/api/idnode/load". API response was : "(' + response.status + ')"');
				});

			}, function (response)
			{
				alert('Sorry, an error occurred on "/api/idnode/save". API response was : "(' + response.status + ')"');
			});
		});
	}


	// BUTTON : Show the dialouge for adding 
	$scope.addRecordingButton = function() {
		document.getElementById("overlayAddRecording").style.display = "block";
	}


	// BUTTON : Moves one or more files
	$scope.moveDvrButton = function() {
		angular.forEach($scope.selectedItems, function (item) {
			if (item.status  === "Completed OK" || item.status === "Forced OK") {
				httpPost('/api/dvr/entry/move/failed', { 'uuid': item.uuid }, 'Changed status to FAILED for "' + item.disp_title + '"')
			} else {
				httpPost('/api/dvr/entry/move/finished', { 'uuid': item.uuid }, 'Changed status to FINISHED for "' + item.disp_title + '"')
			}
			// reload data
			loadDvrData();
		});
	}


	// BUTTON : Downloads one or more files
	$scope.downloadButton = function() {
		angular.forEach($scope.selectedItems, function (item) {
			window.open("http://192.168.1.8:9981/" + item.url);
		});
	}


	// BUTTON : Removes or cancels all selected items
	$scope.deleteButton = function() {
		var uuidDeleted;
		angular.forEach($scope.selectedItems, function (item) {
			if (item.status === 'Scheduled for recording') {
				httpPost('/api/dvr/entry/cancel', { 'uuid': item.uuid }, 'Cancelled "' + item.disp_title)
			} else {
				httpPost('/api/dvr/entry/remove', { 'uuid': item.uuid }, 'Removed "' + item.disp_title)
			}
		})
		loadDvrData();
	}

	// MAIN: Program starts here
	loadDvrData();


	}); // controller ends




