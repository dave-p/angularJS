// custom filter for translating weekday-numbers to text
app.filter('weekdays',function(){
	return function(input)
	{
		var newString = input.map(function(x){ return { 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat', 7:'Sun'}[x]}).toString().replace(/,/g,'-');
		if (newString == 'Mon-Tue-Wed-Thu-Fri-Sat-Sun') 
			return 'All';
		else
			return newString;
	}
});


app.controller('dvrEditingController', function($scope, $http) {

	$scope.addRecordingChannels = {};
	$scope.addRecordingConfigs = {};
	$scope.priorities = { Default: 6, Important: 0, High: 1, Normal: 2, Low: 3, Unimportant: 4};
	$http.get("/api/channel/list")
		.then(function (response)
			{
				angular.forEach(response.data.entries, function (item) {
					$scope.addRecordingChannels[item.val] = item.key;
				});
			})
			$http.get("/api/dvr/config/grid")
				.then(function (response2)
				{
					angular.forEach(response2.data.entries, function (item) {
						if (item.name == "") { item.name = "(Default profile)" };
						$scope.addRecordingConfigs[item.name] = item.uuid;
					});
				});
	var now = new Date();
	$scope.addRecordingStartDate = { value: now };
	$scope.addRecordingStartTime = { value: now };
	$scope.addRecordingStopDate =  { value: now };
	$scope.addRecordingStopTime =  { value: now };
});


app.controller('dvrController', function($scope, $http, $filter) {

	// loads or reloads the page data
	loadDvrData = function(obj) {
		$http.get("/api/dvr/entry/grid")
			.then(function (response)
				{
					$scope.weekdays = { 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat', 7:'Sun'};
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
					document.getElementById("selectAllTimersCheckbox").checked = false;
					document.getElementById("selectAllRecordingsCheckbox").checked = false;
				})
				$http.get("/api/dvr/timerec/grid")
					.then(function (response2)
					{
						$scope.dvrTimers = [];
						$scope.selectedTimers = [];
						angular.forEach(response2.data.entries, function (item) {
							item['type'] = 'time';
							$scope.dvrTimers.push(item); 
						});
					})
					$http.get("/api/dvr/autorec/grid")
						.then(function (response3)
						{
							angular.forEach(response3.data.entries, function (item) {
								item['type'] = 'epg';
								item['stop'] = item['start_window']; // translate for compatiability
								$scope.dvrTimers.push(item); 
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
	$scope.addSelectedTimer = function (item) {
		if (item.checked) {
			$scope.selectedTimers.push(item);
		} else {
			$scope.selectedTimers = $scope.selectedTimers.filter(function(itemToDelete) {
				return itemToDelete.uuid !== item.uuid;
			});
		}
	}


	// triggered by a change of a checkbox; adds or removes item to/from list of selected items, and keeps record of types selected
	$scope.addSelectedItem = function (item) {
		if (item.checked) {
			$scope.selectedItems.push(item);
			if (item.status === "Completed OK" || item.status === "Forced OK")
				$scope.selectedCat.completed++;
			else if (item.status === "File missing" || item.status === "Aborted by user" || item.status === "No service enabled")
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


	// used by main table, for sorting recordings
	$scope.sortRecordings = {
		column: 'status',
		descending: false
	};
	// called by table headers, changes sorting of recordings
	$scope.changeRecSorting = function(column) {
		var sort = $scope.sortRecordings;
		if (sort.column == column) {
			sort.descending = !sort.descending;
		} else {
			sort.column = column;
			sort.descending = false;
		}
	};


	// used by main table, for sorting timers
	$scope.sortTimers = {
		column: 'status',
		descending: false
	};
	// called by table headers, changes sorting of timers
	$scope.changeTimerSorting = function(column) {
		var sort = $scope.sortTimers;
		if (sort.column == column) {
			sort.descending = !sort.descending;
		} else {
			sort.column = column;
			sort.descending = false;
		}
	};


	// check all checkboxes
	$scope.checkAllTimers = function () {
		angular.forEach($scope.dvrTimers, function (item) {
			item.checked = !$scope.selectAllTimers;
			$scope.addSelectedTimer(item);
		});
	};


	// check all checkboxes
	$scope.checkAllRecordings = function () {
		angular.forEach($scope.dvrData, function (item) {
			item.checked = !$scope.selectAllRecordings;
			$scope.addSelectedItem(item);
		});
	};


	// clears all input-fields within the given element
	clearInputs = function (inputsParent) {
		var now = new Date();
		angular.forEach(angular.element(inputsParent.querySelectorAll('input[type=text]')), function (elem, index) {
			elem.value = '';
		});
		angular.forEach(angular.element(inputsParent.querySelectorAll('input[type=number]')), function (elem, index) {
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
		angular.forEach(angular.element(inputsParent.querySelectorAll('select')), function (elem, index) {
			elem.selectedIndex = -1;
		});
	};


	// BUTTON : Clear filter
	$scope.clearFilter = function() {
		$scope.textFilter = '';
	}


	// BUTTON : Edit the selected entry
	$scope.editButton = function() {
		$scope.editRecordingValues = {};
		document.getElementById("overlayEditRecording").style.display = "block";
			var selected = $scope.selectedItems[0];
			var url = '/api/idnode/load';
			var data = http_build_query({ "uuid": selected.uuid });
			var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
			$http.post(url, data, headers)
			.then(function (response)
			{
				var parameters = response.data.entries[0].params;
				$scope.editRecordingValues[parameters[0].id] =  parameters[0].value;
				$scope.editRecordingValues[parameters[4].id] =  parameters[4].value;
				$scope.editRecordingValues[parameters[7].id] =  parameters[7].value;
				$scope.editRecordingValues[parameters[16].id] = parameters[16].value;
				$scope.editRecordingValues[parameters[23].id] = parameters[23].value;
				$scope.editRecordingValues[parameters[24].id] = parameters[24].value;
				$scope.editRecordingValues[parameters[25].id] = parameters[25].value;
				$scope.editRecordingValues[parameters[26].id] = parameters[26].value;
				$scope.editRecordingValues[parameters[29].id] = parameters[29].value;
				$scope.editRecordingValues[parameters[58].id] = parameters[58].value;
				$scope.editRecordingValues['uuid'] = selected.uuid;

			}, function (response)
			{
				alert('Sorry, an error occurred on "/api/dvr/entry/create". API response was : "(' + response.status + ')"');
			});
	}


	// BUTTON : Collects values, calls API and closes the editRecording-dialogue
	$scope.editRecordingAccept = function() {
		// write back 10 values
		var rawData = {
						"enabled": $scope.editRecordingValues.enabled,
						"disp_title": $scope.editRecordingValues.disp_title,
						"disp_extratext": $scope.editRecordingValues.disp_extratext,
						"comment": $scope.editRecordingValues.comment,
						"start_extra": $scope.editRecordingValues.start_extra,
						"stop_extra": $scope.editRecordingValues.stop_extra,
						"pri": $scope.editRecordingValues.pri,
						"config_name": $scope.editRecordingValues.config_name,
						"removal": $scope.editRecordingValues.removal,
						"retention": $scope.editRecordingValues.retention,
						"uuid": $scope.editRecordingValues.uuid
					  };
		var url = '/api/idnode/save';
		var rawDataEncoded = "node=" + encodeURIComponent(JSON.stringify(rawData));
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
		$http.post(url, rawDataEncoded, headers)
		.then(function (response)
		{
			loadDvrData();
			$scope.showInfobox('"' + item.disp_title + '" was edited successfully');
		}, function (response)
		{
			alert('Sorry, an error occurred on "/api/idnode/save". API response was : "(' + response.status + ')"');
		});
		var dialogue = document.getElementById("overlayEditRecording");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Collects values, calls API and closes the newRecording-dialogue
	$scope.newRecordingAccept = function() {
		// collect 10 values
		var disp_title  = document.getElementsByName("inputTitel")[0].value;
		var disp_extratext  = document.getElementsByName("inputExtra")[0].value;
		var channel  =(document.getElementById("inputChannel").selectedOptions[0].value).split(":")[1];
		var _startDate  = document.getElementById("addRecordingStartDate").value;
		var _startTime  = document.getElementById("addRecordingStartTime").value;
		var start = Date.parse(_startDate + ' ' + _startTime) / 1000;
		var _stopDate   = document.getElementById("addRecordingStopDate").value;
		var _stopTime   = document.getElementById("addRecordingStopTime").value;
		var stop = Date.parse(_stopDate + ' ' + _stopTime) / 1000;
		var comment  = document.getElementsByName("inputComment")[0].value;
		var start_extra  = parseInt(document.getElementsByName("prePad")[0].value);
		var stop_extra = parseInt(document.getElementsByName("postPad")[0].value);
		var pri  = parseInt((document.getElementById("inputPriority").selectedOptions[0].value).split(":")[1]);
		var config_name  = (document.getElementById("inputConfig").selectedOptions[0].value).split(":")[1];
		// Convert data into rawData
		var rawData = 	{
							"disp_title": disp_title, 
							"disp_extratext": disp_extratext,
							"channel": channel,
							"start": start,
							"stop": stop,
							"comment": comment,
							"start_extra": start_extra,
							"stop_extra": stop_extra,
							"pri": pri,
							"config_name": config_name,
						};

		// call API
		var url = '/api/dvr/entry/create';
		var rawDataEncoded = "conf=" + encodeURIComponent(JSON.stringify(rawData));
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
		$http.post(url, rawDataEncoded, headers)
		.then(function (response)
		{
			loadDvrData();
			$scope.showInfobox('New recording added: "' + disp_title + '"');
		}, function (response)
		{
			alert('Sorry, an error occurred on "/api/dvr/entry/create". API response was : "(' + response.status + ')"');
		});
		// reset all
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


	// BUTTON : Closes the editRecording-dialogue
	$scope.editRecordingCancel = function() {
		var dialogue = document.getElementById("overlayEditRecording");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Closes the addTimer-dialogue
	$scope.addTimerCancel = function() {
		var dialogue = document.getElementById("overlayAddTimer");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Closes the editTimer-dialogue
	$scope.editTimerCancel = function() {
		var dialogue = document.getElementById("overlayEditTimer");
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
		if (confirm("Are you sure?")) {
			angular.forEach($scope.selectedItems, function (item) {
				if (item.status === 'Scheduled for recording') {
					httpPost('/api/dvr/entry/cancel', { 'uuid': item.uuid }, 'Cancelled "' + item.disp_title)
				} else {
					httpPost('/api/dvr/entry/remove', { 'uuid': item.uuid }, 'Removed "' + item.disp_title)
				}
			})
		}
		loadDvrData();
	}


	// BUTTON : Starts edit timer dialouge
	$scope.editTimerButton = function() {
		$scope.editTimerValues = {};
		document.getElementById("overlayEditTimer").style.display = "block";
		var selected = $scope.selectedTimers[0];
		var url = '/api/idnode/load';
		var data = http_build_query({ "uuid": selected.uuid });
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
		$http.post(url, data, headers)
		.then(function (response)
		{
			var parameters = response.data.entries[0].params;
			$scope.editTimerValues['type'] = (parameters.length  == 15) ? 'time' : 'epg';
			$scope.editTimerValues['enabled'] = parameters[0].value;
			$scope.editTimerValues['name'] = parameters[1].value;
			$scope.editTimerValues['comment'] = (parameters.length  == 15) ? parameters[14].value : parameters[34].value;
			$scope.editTimerValues['config_name'] = (parameters.length  == 15) ? parameters[11].value : parameters[30].value;
			$scope.editTimerValues['start'] = (parameters.length  == 15) ? parameters[5].value : parameters[13].value;
			$scope.editTimerValues['stop'] = (parameters.length  == 15) ? parameters[6].value : parameters[14].value;
			$scope.editTimerValues['title'] = (parameters.length  == 15) ? parameters[2].value : parameters[3].value;
			$scope.editTimerValues['priority'] = (parameters.length  == 15) ? parameters[8].value : parameters[24].value;
			$scope.editTimerValues['creator'] = (parameters.length  == 15) ? parameters[13].value : parameters[33].value;
			$scope.editTimerValues['owner'] = (parameters.length  == 15) ? parameters[12].value : parameters[32].value;
			$scope.editTimerValues['removal'] = (parameters.length  == 15) ? parameters[10].value : parameters[27].value;
			$scope.editTimerValues['retention'] = (parameters.length  == 15) ? parameters[9].value : parameters[26].value;
			$scope.editTimerValues['weekdays'] = (parameters.length  == 15) ? parameters[7].value : parameters[17].value;
			$scope.editTimerValues['uuid'] = selected.uuid;

		}, function (response)
		{
			alert('Sorry, an error occurred on "/api/idnode/load". API response was : "(' + response.status + ')"');
		});
	}


	// BUTTON : Collects values, calls API and closes the editTimer-dialogue
	$scope.editTimerAccept = function() {
		// write back 10 values
		var weekdaysRaw = $scope.editTimerValues['weekdays'];
		var weekdaysTranslated = weekdaysRaw.split(",").map(Number);
		var rawData = {
							"enabled" : $scope.editTimerValues['enabled'],
							"name" : $scope.editTimerValues['name'],
							"comment" : $scope.editTimerValues['comment'],
							"config_name" : $scope.editTimerValues['config_name'],
							"start" : $scope.editTimerValues['start'],
							"stop" : $scope.editTimerValues['stop'],
							"title" : $scope.editTimerValues['title'],
							"type" : $scope.editTimerValues['type'],
							"priority" : $scope.editTimerValues['priority'],
							"checked" : $scope.editTimerValues['checked'],
							"creator" : $scope.editTimerValues['creator'],
							"owner" : $scope.editTimerValues['owner'],
							"removal" : $scope.editTimerValues['removal'],
							"retention" : $scope.editTimerValues['retention'],
							"weekdays" : weekdaysTranslated,
							"uuid" : $scope.editTimerValues['uuid']
					  };
		var url = '/api/idnode/save';
		var rawDataEncoded = "node=" + encodeURIComponent(JSON.stringify(rawData));
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
		$http.post(url, rawDataEncoded, headers)
		.then(function (response)
		{
			loadDvrData();
			$scope.showInfobox('"' + item.disp_title + '" was edited successfully');
		}, function (response)
		{
			alert('Sorry, an error occurred on "/api/idnode/save". API response was : "(' + response.status + ')"');
		});
		var dialogue = document.getElementById("overlayEditTimer");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Collects values, calls API and closes the newRecording-dialogue
	$scope.addTimerAccept = function() {
		var weekdaysRaw = document.getElementsByName("timerWeekdays")[0].value;
		var weekdaysTranslated = weekdaysRaw.split(",").map(Number);
		// collect values
		var name = document.getElementsByName("timerName")[0].value;
		var channel = (document.getElementById("timerChannel").selectedOptions[0].value).split(":")[1];
		var start = document.getElementsByName("timerStart")[0].value;
		var stop = document.getElementsByName("timerStop")[0].value;
		var weekdays = weekdaysTranslated;
		var comment = document.getElementsByName("timerComment")[0].value;
		var config_name = (document.getElementById("timerConfig").selectedOptions[0].value).split(":")[1];
		var title = document.getElementsByName("timerTitle")[0].value;
		var directory = document.getElementsByName("timerDirectory")[0].value;
		var removal = document.getElementsByName("timerRemoval")[0].value;
		var retention = document.getElementsByName("timerRetention")[0].value;
		// Convert data into rawData
		var rawData = 	{
							"name": name, 
							"channel": channel,
							"start": start,
							"stop": stop,
							"weekdays": weekdays,
							"comment": comment,
							"config_name": config_name,
							"title": title,
							"directory": directory,
							"removal": removal,
							"retention": retention
						};

		// call API
		var url = '/api/dvr/timerec/create';
		var rawDataEncoded = "conf=" + encodeURIComponent(JSON.stringify(rawData));
		var headers = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
		$http.post(url, rawDataEncoded, headers)
		.then(function (response)
		{
			loadDvrData();
			$scope.showInfobox('New timer added: "' + name + '"');
		}, function (response)
		{
			alert('Sorry, an error occurred on "/api/dvr/timerec/create". API response was : "(' + response.status + ')"');
		});
		// reset all
		var dialogue = document.getElementById("overlayAddTimer");
		clearInputs(dialogue);
		dialogue.style.display = "none";
	}


	// BUTTON : Starts add timer dialouge
	$scope.addTimerButton = function() {
		document.getElementById("overlayAddTimer").style.display = "block";
	}


	// BUTTON : Deletes selected timers
	$scope.deleteTimerButton = function() {
		if (confirm("Are you sure?")) {
			angular.forEach($scope.selectedTimers, function (item) {
				httpPost('/api/idnode/delete', { 'uuid': item.uuid }, 'Deleted timer "' + item.name + '"')
			})
		}
		loadDvrData();
	}


	// BUTTON : Toggles Enable/Disable of timers
	$scope.enableDisableTimerButton = function() {
		angular.forEach($scope.selectedTimers, function (item) {
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
					$scope.showInfobox('Enabled status was changed for "' + item.name + '"');
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


	// MAIN: Program starts here
	loadDvrData();


	}); // controller ends




