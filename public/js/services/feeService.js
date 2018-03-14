require('angular');

angular.module('ETPApp').service('feeService', function ($http, $rootScope) {

    return function (cb) {
        $http.get($rootScope.severUrl + '/api/blocks/getFees').then(function (response) {
            return cb(response.data.fees || {
                send: 0,
                vote: 0,
                secondsignature: 0,
                delegate: 0,
                multisignature: 0,
                dapp: 0
            });
        });
    }

});
