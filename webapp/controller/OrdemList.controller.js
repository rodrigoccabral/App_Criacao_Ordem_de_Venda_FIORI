sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/m/MessageToast",
    "../model/formatter"],
   (Controller, MessageToast, formatter) => {
  "use strict";

  return Controller.extend("project1.controller.OrdemList", {
    formatter: formatter,
    
    onInit() {

      var oModel = new sap.ui.model.json.JSONModel();
      oModel.setData([]);
      this.getView().setModel(oModel, "orderTableModel");
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
          const formatador = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          oData.results.forEach(item => {
            item.TotalFrete = formatador.format(item.TotalFrete);
            item.TotalItens = formatador.format(item.TotalItens);
            item.TotalOrdem = formatador.format(item.TotalOrdem);
          });

          oModelData.setData(oData.results);
          oView.setModel(oModelData, "orderTableModel");
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
        var oContext = oEvent.getSource().getBindingContext("orderTableModel");
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
      var oTModel = oView.getModel("orderTableModel");

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
      let oTable = oView.byId("orderListTable");
      //let aSelectedIdx = oTable.getSelectedIndices();
      let aSelectedItems = oTable.getSelectedItems();
      let oTModel = oView.getModel("orderTableModel");
      let aTableData = oTModel.getData();
      let oModel = this.getOwnerComponent().getModel();
      let oEmptyModel = new sap.ui.model.json.JSONModel();
      oEmptyModel.setData([]);

      let completed = 0;
      let total = aSelectedItems.length;
      let aResponse = [];

        if (total === 0) {
    MessageToast.show("Nenhum item selecionado.");
    return;
  }

      aSelectedItems.forEach(function(oItem) {

        const oContext = oItem.getBindingContext("orderTableModel");
        const oData = oContext.getObject(); // Objeto da linha selecionada

        oModel.callFunction("/ZFI_ATUALIZA_STATUS", {
          method: "GET",
          urlParameters: {
            ID_ORDEMID: oData.OrdemId,
            ID_STATUS: status
          },
          success : function (oResult) {
            oData.Status = status;

            oTModel.refresh();

            aResponse.push(oResult.results);

            completed++;
            if (completed === total) {
              that.onOpenDialog(aResponse);
            };

          },
          error : function (oError) {
            aResponse.push(JSON.parse(oError.responseText).error.message.value);
            
            completed++;
            if (completed === total) {
              that.onOpenDialog(aResponse);
            };
          }
        });
      });
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
