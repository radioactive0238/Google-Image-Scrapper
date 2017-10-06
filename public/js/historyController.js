app.controller("historyController",function($scope,$http) {
	 
    $http({
        method: "GET",
        url: "/getQueries",
    }).success(function (data) {
		$scope.data=data;
    });	
});