require('angular');
var config = require('../../../config');

angular.module('DDKApp').controller('existingETPSUserController', ['$scope', '$rootScope', '$http', "$state", "userService", "newUserMigration", 'gettextCatalog', '$cookies', 'focus', function ($scope, $rootScope, $http, $state, userService, newUserMigration, gettextCatalog, $cookies, focus) {

    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.password = '';
    $scope.errorMessage = "";
    $scope.URL_GLOBAL = "https://api.etpswallet.gold/";
    $scope.API_KEY_GLOBAL = "etps_2_etp_V1.1";

    focus('focusMe');
    
    $scope.forgotPasswordPage = false;
    $scope.loginPage = true;

    $scope.newUser = function (data) {
        $scope.newUserModal = newUserMigration.activate({
            dataVar: data,
            destroy: function () {
            }
        });
        let passphrase = Buffer.from(data.passphrase,"base64").toString("ascii");
        $rootScope.newPassphrase = passphrase;
    }
    
    $scope.forgotWindow = function() {
        $scope.loginPage = false;
        $scope.forgotPasswordPage = true;
        $scope.errorMessage = false;
    }

    $scope.back = function() {
        $scope.forgotPasswordPage = false;
        $scope.loginPage = true;
        $scope.forgotErrorMessage = false;
    }
    
    $scope.forgotPassword = function (username, email) {

        var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        if (!username || !email) {
            $scope.forgotErrorMessage = 'Username & Email are Mandatory';
            return;
        }

        if (!regex.test(email)) {
            $scope.forgotErrorMessage = 'Please enter a valid email address.';
            return;
        }

        let post = "username=" + btoa(username) + "&email=" + btoa(email);
        let url  = config.domainName+'/existingETPSUser';
        $scope.forgotErrorMessage = false;
        $http.post($rootScope.serverUrl + "/api/accounts/forgotEtpsPassword", {
            data: post,
            link: url
        }).success(function (resp) {
            if (!resp.success) {
                $scope.forgotErrorMessage = resp.error;
            } else {
                Materialize.toast(resp.info, 1000, 'green white-text');
            }
        }).error(function (err) {
            $scope.forgotErrorMessage = err;
        });
    }

    // function to validate existing ETPS user from ETP_test database
    $scope.validateExistingUser = function (username, password, adminCode) {

        if(!username || !password) {
            $scope.errorMessage = 'Username & Password are Required';
            return;
        }

        if(adminCode != "ddkTest2306" ){
            $scope.errorMessageAdmin = 'Only For Admin : Migration is under Testing.';
            return;
        }
        $scope.errorMessageAdmin = false;
        var post = "username=" + btoa(username) + "&password=" + btoa(password);

        $http.post($rootScope.serverUrl +"/api/accounts/existingETPSUser/validate", {

            data: post
        })
            .success(function (resp) {

                if (!resp.success) {
                    $scope.errorMessage = resp.error;
                } else {
                    if(resp.userInfo.transferred_etp === 1){
                        $scope.errorMessage = 'User is already migrated';
                    }else{
                        var userInfo = {};
                        Object.assign(userInfo, resp.userInfo);
                        $scope.newUser(userInfo);
                    }
                }
            })
            .error(function (err) {
                $scope.errorMessage = err;
            });
    }
}]);
