require('angular');

angular.module('DDKApp').controller('passphraseCheckController.js', ["$scope", "passphraseCheckController", "$http", "userService", function ($scope, passphraseCheckController, $http, userService) {

    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.secondPassphrase = userService.secondPassphrase;

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy();
        }
        passphraseCheckController.deactivate();
        angular.element(document.querySelector("body")).removeClass("ovh");
    }

}]);
