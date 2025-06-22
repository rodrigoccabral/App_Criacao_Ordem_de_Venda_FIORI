sap.ui.define(
  [
    //"sap/ui/core/mvc/Controller",
  "project1/controller/BaseController",
   "sap/m/MessageToast"], 
   (Controller, MessageToast) => {
  "use strict";

  return Controller.extend("project1.controller.OrdemList", {
    onInit() {

      var oModel = new sap.ui.model.json.JSONModel();
      oModel.setData([]);
      this.getView().setModel(oModel, "Table");
      oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.getRoute("RouteView1").attachPatternMatched(this._onRouteMainView, this);

      var oView = this.getView();

      var oFModel = new sap.ui.model.json.JSONModel({
                    "OrdemId": "",
                    "DataCriacao": null,
                    "CriadoPor": "",
                    "ClienteId": "",
                    "TotalItens": 0,
                    "TotalFrete": 0,
                    "TotalOrdem": 0,
                    "Status": "",
                    "OrdenacaoCampo": "OrdemId",
                    "OrdenacaoTipo": "ASC",
                    "Limite": 25,
                    "Ignorar": 0
      });

      oView.setModel(oFModel, "filter");

    },

    onFilterReset: function(){
    
    },

    _onRouteMainView : function() {
      
      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();

      var oModelData = new sap.ui.model.json.JSONModel();
      oModelData.setData([]);
      oModelData.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

      oView.setBusy(true);

      oModel.read("/OVCabSet", {
        success : function (oData, oResponse) {
          oModelData.setData(oData.results);
          oView.setModel(oModelData, "Table");
          oView.setBusy(false);
        },

        error : function (oError) {
          var oError = JSON.parse(oResponse.responseText);
          MessageToast.show(oError.error.message.value);
          oView.setBusy(false);
        }
      })
    },

    onClickMain: function (oEvent) {
      var oRoute = sap.ui.core.UIComponent.getRouterFor(this);
      var oBtn = oEvent.getSource().getId();



      if (oBtn.includes("btnEditar")) {
        var oContext = oEvent.getSource().getBindingContext("Table");
        var oDadosLinha = oContext.getObject();
        var id = oDadosLinha.OrdemId;

        oRoute.navTo("RouteToOrderEditScreen", { ordemId: id });
      } else {
        oRoute.navTo("RouteToOrderCreateScreen");
      }
    },

    onFilterSearch : function() {
      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();
      var oFModel = oView.getModel("filter");
      var oTModel = oView.getModel("Table");

      var oFData = oFModel.getData();

      var oFilter = null;
      var aParams = [];
      var aSorter = [];
      var aFilters = [];

      if(oFData.OrdemId != '') {
        oFilter = new sap.ui.model.Filter({
          path: 'OrdemId',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: oFData.OrdemId
        })
        aFilters.push(oFilter);
      };

      if(oFData.ClienteId != '') {
        oFilter = new sap.ui.model.Filter({
          path: 'ClienteId',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: oFData.ClienteId
        })
        aFilters.push(oFilter);
      };

      var oDescending = false;
      if(oFData.OrdenacaoTipo == 'DESC') {
        oDescending = true;
      };

      if(oFData.OrdenacaoCampo != '') {
        var oSort = new sap.ui.model.Sorter(oFData.OrdenacaoCampo, oDescending);
        aSorter.push(oSort);
      };

      aParams.push("$top="+oFData.Limite);
      aParams.push("$skip="+oFData.Ignorar);

      oView.setBusy(true);
      
      oModel.read("/OVCabSet", {
        sorters: aSorter,
        filters: aFilters,
        urlParameters: aParams,

        success : function(oData, oResponse) {
          oTModel.setData(oData.results);
          oView.setBusy(false);
        },
        error : function (oResponse) {
          var oError = JSON.parse(oResponse.responseText);
          MessageToast.show(oError.error.message.value);
          oView.setBusy(false);
        }
      }

      )
    },

    onChangeStatus : function (status) {
      const that = this;
      const oView = this.getView();
      let oTable = oView.byId("_IDGenTable1");
      let aSelectedIdx = oTable.getSelectedIndices();
      let oTModel = oView.getModel("Table");
      let aTableData = oTModel.getData();
      let oModel = this.getOwnerComponent().getModel();
      let oEmptyModel = new sap.ui.model.json.JSONModel();
      oEmptyModel.setData([]);

      let completed = 0;
      let total = aSelectedIdx.length;
      let aResponse = [];
      for(let i = 0; i < total; i++) {

        oModel.callFunction("/ZFI_ATUALIZA_STATUS", {
          method: "GET",
          urlParameters: {
            ID_ORDEMID: aTableData[aSelectedIdx[i]].OrdemId,
            ID_STATUS: status
          },
          success : function (oData) {
            aTableData[aSelectedIdx[i]].Status = status;
            oTModel.setData(aTableData);
            aResponse.push(oData.results);

            completed++;
            if (completed === total) {
              that.onOpenDialog(aResponse);
            };

          },
          error : function (oResponse) {
            aResponse.push(JSON.parse(oResponse.responseText).error.message.value);
            
            completed++;
            if (completed === total) {
              that.onOpenDialog(aResponse);
            };

          }
        }
      )};
    },

    onOpenDialog : function (aResponse) {
        const oView = this.getView();
        let aMensagens = aResponse.flat();
        let oMensagensModel = new sap.ui.model.json.JSONModel();
        oMensagensModel.setData(aMensagens);
        oView.setModel(oMensagensModel, "Mensagens");

        if(!this.oDialog){
          this.oDialog = this.byId("dialogInfoId");
          this.oDialog.open();
        } else {
          this.oDialog.open();
        };
    },

    onCloseDialog : function () {
      this.oDialog.close();
    }

  });
});
