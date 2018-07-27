require('angular');

angular.module('DDKApp').controller('sendTransactionController', ['$scope', '$rootScope', 'sendTransactionModal', '$http', 'userService', 'feeService', '$timeout', '$filter', function ($scope, $rootScope, sendTransactionModal, $http, userService, feeService, $timeout, $filter) {

    $scope.sending = false;
    $scope.passmode = false;
    $scope.accountValid = true;
    $scope.errorMessage = {};
    $scope.checkSecondPass = false;
    $scope.onlyNumbers = /^-?\d*(\.\d+)?$/;
    $scope.secondPassphrase = userService.secondPassphrase;
    $scope.address = userService.address;
    $scope.focus = $scope.to ? 'amount' : 'to';
    $scope.presendError = false;
    $scope.twofactor = false;

    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;

    Number.prototype.roundTo = function (digitsCount) {
        var digitsCount = typeof digitsCount !== 'undefined' ? digitsCount : 2;
        var s = String(this);
        if (s.indexOf('e') < 0) {
            var e = s.indexOf('.');
            if (e == -1) return this;
            var c = s.length - e - 1;
            if (c < digitsCount) digitsCount = c;
            var e1 = e + 1 + digitsCount;
            var d = Number(s.substr(0, e) + s.substr(e + 1, digitsCount));
            if (s[e1] > 4) d += 1;
            d /= Math.pow(10, digitsCount);
            return d.valueOf();
        } else {
            return this.toFixed(digitsCount);
        }
    }

    Math.roundTo = function (number, digitsCount) {
        number = Number(number);
        return number.roundTo(digitsCount).valueOf();
    }

    function validateForm(onValid) {
        var isAddress = /^(DDK)+[0-9]+$/ig;
        var correctAddress = isAddress.test($scope.to);
        $scope.errorMessage = {};
        if ($scope.to.trim() == '') {
            $scope.errorMessage.recipient = 'Empty recipient';
            $scope.presendError = true;
        } else {
            if (correctAddress) {
                if($scope.to == $scope.address){
                    $scope.errorMessage.recipient = 'Sender and Recipient can\'t be same';
                    $scope.presendError = true;
                    return;
                }
                if ($scope.isCorrectValue($scope.amount)) {
                    $scope.presendError = false;
                    return onValid();
                } else {
                    $scope.presendError = true;
                }
            } else {
                $scope.errorMessage.recipient = 'Invalid recipient';
                $scope.presendError = true;
            }
        }
    }

    function validateOTP(onValid) {
        $scope.errorMessage = {};
        if ($scope.otpNumber == '' || $scope.otpNumber == undefined) {
            $scope.errorMessage.otpNumber = 'No OTP supplied';
            $scope.presendError = true;
            return;
        }
        return onValid();
    }

    $scope.passcheck = function (fromSecondPass, otp) {
        if ($scope.OTP) {
            $scope.otp = otp;
            validateOTP(function () {
                $scope.OTP = false;
                $scope.presendError = false;
                $scope.errorMessage = {};
            });
            if($scope.presendError){
                return;
            }
        }
        if (fromSecondPass) {
            $scope.checkSecondPass = false;
            $scope.passmode = $scope.rememberedPassphrase ? false : true;
            if ($scope.passmode) {
                $scope.focus = 'secretPhrase';
            }
            $scope.secondPhrase = '';
            $scope.secretPhrase = '';
            return;
        }
        if ($scope.rememberedPassphrase) {
            if($scope.otp){
                $scope.OTP = true;
            }
            validateForm(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.sendTransaction($scope.rememberedPassphrase);
            });
        } else {
            validateForm(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.passmode = !$scope.passmode;
                $scope.focus = 'secretPhrase';
                $scope.secretPhrase = '';
            });
        }
    }

    $scope.OTPModalPopup = function () {
        validateForm(function () { });

        if (!$scope.presendError) {
            $scope.OTP = true;
        }
    }

    $scope.checkStatus = function () {
        $http.get($rootScope.serverUrl + '/api/accounts/checkTwoFactorStatus', {
            params: {
                publicKey: userService.publicKey
            }
        })
            .then(function (resp) {
                if (resp.data.success) {
                    $scope.twofactor = true;
                    $scope.OTPModalPopup();
                } else {
                    $scope.OTP = false;
                    $scope.passcheck();
                }
            })
    }

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy();
        }
        sendTransactionModal.deactivate();
    }

    $scope.accountChanged = function (e) {
        var string = $scope.to;
        if (!string) {
            return;
        }
        if (string[0] == 'D') {
            var isnum = /^\d+$/.test(string.substring(3, string.length));
            if (isnum && string.length - 1 >= 1 && string.length - 3 <= 20) {
                $scope.accountValid = true;
            } else {
                $scope.accountValid = false;
            }
        } else {
            $scope.accountValid = false;
        }
    }

    $scope.getCurrentFee = function () {
        $http.get($rootScope.serverUrl + '/api/blocks/getFee').then(function (resp) {
            $scope.currentFee = resp.data.fee;
            $scope.fee = resp.data.fee;
        });
    }

    $scope.isCorrectValue = function (currency, throwError) {
        var parts = String(currency).trim().split('.');
        var amount = parts[0];
        var fraction;

        if (!throwError) throwError = false;

        function error(message) {
            $scope.errorMessage.amount = message;

            if (throwError) {
                throw $scope.errorMessage.amount;
            } else {
                console.error(message);
                return false;
            }
        }

        if (currency == null) {
            return error('DDK amount can not be blank');
        }

        if (parts.length == 1) {
            // No fractional part
            fraction = '00000000';
        } else if (parts.length == 2) {
            if (parts[1].length > 4) {
                return error('DDK amount must not have more than 4 decimal places');
            } else if (parts[1].length <= 8) {
                // Less than eight decimal places
                fraction = parts[1];
            } else {
                // Trim extraneous decimal places
                fraction = parts[1].substring(0, 8);
            }
        } else {
            return error('DDK amount must have only one decimal point');
        }

        // Pad to eight decimal places
        for (var i = fraction.length; i < 8; i++) {
            fraction += '0';
        }

        // Check for zero amount
        if (amount == '0' && fraction == '00000000') {
            return error('DDK amount can not be zero');
        }

        // Combine whole with fractional part
        var result = amount + fraction;

        // In case there's a comma or something else in there.
        // At this point there should only be numbers.
        if (!/^\d+$/.test(result)) {
            return error('DDK amount contains non-numeric characters');
        }

        // Remove leading zeroes
        result = result.replace(/^0+/, '');
        return parseInt(result);
    }

    $scope.convertDDK = function (currency) {
        return $scope.isCorrectValue(currency, true);
    }

    $scope.clearRecipient = function () {
        $scope.to = '';
    }

    $scope.sendTransaction = function (secretPhrase, withSecond) {
        if ($scope.secondPassphrase && !withSecond) {
            $scope.OTP = false;
            $scope.checkSecondPass = true;
            $scope.focus = 'secondPhrase';
            return;
        }
        $scope.errorMessage = {};
        var data = {
            secret: secretPhrase,
            amount: $scope.convertDDK($scope.amount),
            recipientId: $scope.to,
            publicKey: userService.publicKey,
            otp: $scope.otp
        };

        if ($scope.secondPassphrase) {
            data.secondSecret = $scope.secondPhrase;
            if ($scope.rememberedPassphrase) {
                data.secret = $scope.rememberedPassphrase;
            }
        }

        if (!$scope.sending) {
            $scope.sending = true;
            $http.put($rootScope.serverUrl + '/api/transactions', data).then(function (resp) {
                $scope.sending = false;
                if (resp.data.error) {
                    Materialize.toast('Transaction error', 3000, 'red white-text');
                    $scope.errorMessage.fromServer = resp.data.error;
                } else {
                    if ($scope.destroy) {
                        $scope.destroy();
                    }
                    Materialize.toast('Transaction sent', 3000, 'green white-text');
                    sendTransactionModal.deactivate();
                }
            });
        }
    }

    $scope.setFees = function (rawFee) {
        var regEx2 = /[0]+$/;
        //Convert fee according to whole/decimal number
        $scope.fee = (rawFee % 1) != 0 ?  rawFee.toFixed(8).toString().replace(regEx2, ''): rawFee.toString();
    };

    $scope.calFees = function (amount) {
        if (parseFloat(amount) >= 0.0001) {
            feeService(function (fees) {
                if (parseFloat(amount) <= 100) {
                    $scope.setFees((parseFloat(amount) * fees.send.level1) / 100);
                } else if (parseFloat(amount) > 100 && parseFloat(amount) <= 1000) {
                    $scope.setFees((parseFloat(amount) * fees.send.level2) / 100);
                } else {
                    $scope.setFees((parseFloat(amount) * fees.send.level3) / 100);
                }
            });
        } else {
            $scope.fee = 0;
        }
    };
}]);
