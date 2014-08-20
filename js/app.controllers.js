// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
(function(window, angular, $) {


  angular.module('LTVCalculatorApp')

    /**
     * Attrition calculator
     *
     * @param Object $scope
     */
    .controller('LTVCalculatorCtrl', [
        '$scope',
        function ($scope) {
          $scope.precisionType = 'quick';

          $scope.ltv = {
            // Inputs
            rpc:    null,   // Revenue per Conversion
            cpc:    null,   // COGS per Conversion
            vcpc:   null,   // Variable Cost per Conversion
            crpr:   null,   // Customer Repurchase Rate
            crfr:   null,   // Customer Referral Rate
            cr:     null,   // Conversion Rate

            // Precision-only inputs
            acp:    null,   // Annual Customer Purchases
            lcr:    null,   // Lifetime Customer Referrals
            clt:    null,   // Customer Lifetime
            rrr:    null,   // Required Rate of Return

            // Outputs
            cltv:   0,      // Customer Life Time Value
            vltv:   0,      // Visitor Life Time Value
            tor:    0,      // Life Time Value to Revenue
            currv:  0,      // Current Value
            futv:   0,      // Future Value
            series: [
              {
                name:   '',
                value:  100
              }
              // {
              //     name:   'Uno',
              //     value:  50,
              //     color: '#f00'
              // },
              // {
              //     name:   'Dos',
              //     value:  40,
              //     color: '#0f0'
              // },
              // {
              //     name:   'Tres',
              //     value:  10,
              //     color: '#00f'
              // }
            ],

            getCltv: function() {
              var that = this.calcPrepClone(),
                cltv = that.rpc - that.cpc - that.vcpc; // CLTV always starts with gross income

              if($scope.precisionType === 'quick') {
                cltv = cltv / ( 1 - that.crpr );  // Factor in the repurchase
                cltv = cltv / ( 1 - that.crfr );  // and referral rates
              } else {
                // Required Rate of Return can't be exactly 0
                var rrr = that.rrr === 0 ? 0.0000000001 : parseFloat(that.rrr);

                cltv = (
                  cltv*
                  (that.acp+rrr)*
                  (
                    (that.acp*that.crpr)*
                    (Math.pow((rrr/that.acp+1),(that.acp*that.clt/12))-1)+
                    rrr*
                    Math.pow((rrr/that.acp+1),(that.acp*that.clt/12))
                  )
                )/(
                  rrr*
                  (-that.acp*that.crfr*that.lcr+that.acp+rrr)*
                  Math.pow((rrr/that.acp+1),(that.acp*that.clt/12))
                );
              }
              this.cltv = cltv;
              return this.cltv;
            },

            getVltv: function() {
              var that = this.calcPrepClone();
              this.vltv = (that.cltv * parseFloat(that.cr));
              return this.vltv;
            },

            getTor: function() {
              var that = this.calcPrepClone();
              this.tor = (that.cltv / that.rpc) || 0;
              return this.tor;
            },

            check: function() {
              if($scope.precisionType === 'precision'){
                //check if 4 inputs for Absolute Rule have been met.
                if ($scope.lifetimeValue.acp.$dirty
                    && $scope.lifetimeValue.crfr.$dirty
                    && $scope.lifetimeValue.lcr.$dirty
                    && $scope.lifetimeValue.rrr.$dirty)
                  return true;
                else
                  return false;
              }
            },

            absolute: function() {
              var that = this.calcPrepClone();
              if( ( -this.acp * that.crfr * this.lcr + this.acp + that.rrr) < 0) {
                // $precisionType.setAlert('error', 'Your referral inputs are too high. Please lower the referral rate, the number of referrals, or both.');
                $scope.absoluteFail = true;
              } else {
                $scope.absoluteFail = false;
              }
            },

            compute: function() {
              if ( !$scope.lifetimeValue.$valid ) // Don't calc if form is not valid
                return false;

              // Absolute rule
              if(this.check() && $scope.precisionType === 'precision')
                this.absolute();
              this.getCltv();
              this.getVltv();
              this.getTor();
              this.getCurrentValue();
              this.getFutureValue();

              this.drawPie();
              $scope.calculated = true;
            },

            drawPie: function () {
              this.series = [
                {
                  name:   'Current',
                  value:  this.currv
                },
                {
                  name:   'Future',
                  value:  this.futv
                }
              ];
            },

            getCurrentValue: function () {
              this.currv = (this.rpc - this.cpc - this.vcpc);
              return this.currv;
            },

            getFutureValue: function () {
              this.futv = (this.cltv - this.currv);
              return this.futv;
            },

            calcPrepClone: function() {
              var that = $.extend({}, this),
                keys = ['crpr','crfr', 'cr', 'rrr'];

              // Turn percentage fields into decimals
              for (var i = 0; i < keys.length; i++){
                that[keys[i]] = that[keys[i]] / 100;
              }

              return that;
            }
          };

          $scope.compute = function () {
            $scope.ltv.compute();
          };

          $scope.selectType = function(type) {
            $scope.precisionType = type;
          };

          $scope.clear = function() {
            $scope.calculated = false;

             $scope.ltv = angular.extend($scope.ltv, {
              // Inputs
              rpc:  null,  // Revenue per Conversion
              cpc:  null,    // COGS per Conversion
              vcpc: null,   // Variable Cost per Conversion
              crpr: null,   // Customer Repurchase Rate
              crfr: null,   // Customer Referral Rate
              cr:   null,     // Conversion Rate

              // Precision-only inputs
              acp:  null,    // Annual Customer Purchases
              lcr:  null,    // Lifetime Customer Referrals
              clt:  null,    // Customer Lifetime
              rrr:  null,    // Required Rate of Return

              // Outputs
              cltv: 0,  // Customer Life Time Value
              vltv: 0,  // Visitor Life Time Value
              tor:  0,   // Life Time Value to Revenue
              currv:0,
              futv: 0,
              series: [
                // {
                //   name:   '',
                //   value:  0
                // }
              ]
            });

          };

        }
      ])

  ;

})(window, angular, jQuery);
