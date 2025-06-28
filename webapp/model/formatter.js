sap.ui.define([
],function () {
    "use strict";

    return {
        formatPrice: function(sValue) {
            var oFormatOptions = {
                groupingEnabled : true,
                groupingSeparator : '.',
                decimalSeparator : ',',
                decimals : 2
            };

            var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions);

            return oFloatFormat.format(parseFloat(sValue));
        },

        getIconStatus: function(sStatus){
            var sIcon = "sap-icon://message-information";
            switch(sStatus){
            case "S":
                sIcon = "sap-icon://message-success";
                break;
            case "E":
                sIcon = "sap-icon://message-error";
                break;
            }
            return sIcon;
        },

            getColorStatus: function(sStatus){
            var sColor = "#FFFFFF";
            switch(sStatus){
            case "S":
                sColor = "#00AA00";
                break;
            case "E":
                sColor = "#AA0000";
                break;
            }
            return sColor;
        },

        formatQuantidade: function (valor) {
            return valor || 0; // Se valor for undefined ou "", retorna "0"
        },

        formatPreco: function (valor) {
            let num = parseFloat(valor);
            return isNaN(num) ? "0,00" : num.toFixed(2).replace(".", ",");
        }

    };

});