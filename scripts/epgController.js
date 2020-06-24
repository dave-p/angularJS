var epgPage = angular.module('ngToggle', []);

epgPage.controller('epgController', ['$scope', function($scope) 
	{
		$scope.epgBottomMinimized = true;
		// toggle epg_bottom-field size
		$scope.epgBottomToggleSize = function() {
			$scope.epgBottomMinimized = $scope.epgBottomMinimized === false ? true : false;
			alert('Alert was triggered!');
		};
	}
]);


