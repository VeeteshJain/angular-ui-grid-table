(function(angular, dataJsonVar) {
	'use strict';
	var app = angular.module('ngSwipeLeftExample', ['ngTouch', 'ui.grid']);
	app.controller('mainCtrl', ['$scope','$http', function($scope, $http){
		$scope.gridOptions = {
			columnDefs: [
			{name:'id'},
			{name:'name'},
			{name:'gender'},
			{
				field:'age',
				'cellTemplate': '<div ng-show="!showActions" ng-swipe-left="showActions=true">Some list content, like an email in the inbox</div><div ng-show="showActions" ng-swipe-right="showActions=false"><button ng-click="reply()">Reply</button><button ng-click="delete()">Delete</button></div>'
			}
			]
		};

		$scope.getData = function(){
			var data = dataJsonVar;
			$scope.gridOptions.data = data;
		}
	}]);
})(window.angular, window.dataJsonVar);