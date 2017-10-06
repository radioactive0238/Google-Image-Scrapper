 app.controller("filesController",function($scope,$http) {
	 
    $http({
        method: "GET",
        url: "/getfiles",
    }).success(function (data) {
		$scope.fileId=data;
    });	
});