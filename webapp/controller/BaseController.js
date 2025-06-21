    sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], (BaseController, MessageToast) => {
  "use strict";

  return BaseController.extend("project1.controller.BaseController", {
      onInit() {
        
      },

      onDelete : function (oEvent) {
      //Pegar o botão clicado
      let oButton = oEvent.getSource();
      let oButtonId = oButton.getId();
      let oModel = this.getOwnerComponent().getModel();
      let oView = this.getView();
      let that = this;
      if(oButtonId.includes("btnDeleteList")) {
      //Pegar o contexto da linha do botão que foi clicado
      let oContext = oButton.getBindingContext("Table");

      //Acessar os dados da linha
      let oDadosLinha = oContext.getObject();

      //Acessar um campo específico
      var sId = oDadosLinha.OrdemId;
      var aTable = oView.getModel("Table").getData();

      } else if(oButtonId.includes("btnDeleteForm")){
        let oModel = this.getView().getModel("Ordem");
        var sId = oModel.getProperty("/OrdemId");

      };

      var oTModel = new sap.ui.model.json.JSONModel();
      oTModel.setData([]);

      oView.setBusy(true);
      oModel.remove("/OVCabSet("+sId+")", {
        success : function (oData, oResponse) {
            if(oButtonId.includes("btnDeleteList")) {
                let index = aTable.findIndex(item => item.OrdemId === sId);
                if (index !== -1) {
                    aTable.splice(index, 1);
                };

          oTModel.setData(aTable);
          oView.setModel(oTModel, "Table");
          } else {
            let oView = that.getView();
            var oData = new sap.ui.model.json.JSONModel({
                OrdemId: "",
                DataCriacao: null,
                CriadoPor: "",
                ClienteId: "",
                TotalItens: "",
                TotalFrete: "",
                TotalOrdem: "",
                Status: "",
                toOVItem: [],
            });

                oData.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                oView.setModel(oData, "Ordem");

          };

          MessageToast.show("Registro deletado com sucesso!");
          oView.setBusy(false);
        },
        error : function (oResponse) {
          let oError = JSON.parse(oResponse.responseText);
          MessageToast.show(oError.error.message.value);
          oView.setBusy(false);
        }
      })
    }
  });
});
