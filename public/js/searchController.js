 app.controller("searchController",function($scope,$http) {
	 
        $scope.searchB = function (event) {
		
			var div = angular.element( document.querySelector( '.responseMsg' ) );
			div.empty();
			div.css('background-color','white');
			
            var query=$scope.searchTerm;
			$scope.searchTerm='';
            $http({
                method: "POST",
                url: "/search",
                data: {query}
            }).success(function (data) {
				
                if(data=='0'){
					div.append('Images will be saved in a few Seconds , check Previous Queries to see images.');
					div.css('background-color','#8ee48e');
				}
				else{
					if(data=="1"){
						div.append("Images Saved , unable to add record in Database.");
						div.css('background-color','red');
					}
					else{
						div.append("Unable to save images.");
						div.css('background-color','red');
					}
				}
            });
        }
    });