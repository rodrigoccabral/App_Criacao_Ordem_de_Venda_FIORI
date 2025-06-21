sap.ui.define(
  [
    //"sap/ui/core/mvc/Controller",
    "project1/controller/BaseController", 
    "sap/m/MessageToast", 
    "../model/formatter"],
  (Controller, MessageToast, formatter) => {
    "use strict";

    return Controller.extend("project1.controller.OrdemForm", {
      formatter: formatter,

      onInit() {

       // x = 10;
        var oView = this.getView();
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

        const oDataCombo = new sap.ui.model.json.JSONModel({
          statusLista: [
            { key: "Novo", status: "Novo" },
            { key: "Fornecido", status: "Fornecido" },
            { key: "Faturado", status: "Faturado" },
            { key: "Cancelado", status: "Cancelado" },
          ],
        });
        oView.byId("ComboId").setModel(oDataCombo, "Lista");

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("RouteToOrderEditScreen").attachPatternMatched(this._onRouteMatchedEdit, this);
        oRouter.getRoute("RouteToOrderCreateScreen").attachPatternMatched(this._onRouteMatchedCreate, this);
        oRouter.getRoute("RouteView1").attachPatternMatched(this._onRouteMatchedMain, this);
      },

      _onRouteMatchedMain: function () {
        var oModel = null;
        oModel = new sap.ui.model.json.JSONModel(this.createEmptyOrderObject());
        oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
        this.getView().setModel(oModel, "Ordem");
      },

      _onRouteMatchedEdit: function (oEvent) {
        var that = this;
        var oView    = this.getView();
        var ordemId = oEvent.getParameter("arguments").ordemId;
        var oModel = this.getOwnerComponent().getModel();
        var oModel1  = null;

        this.byId("DTP1").setEditable(false);
        this.byId("criadoPor").setEditable(false);
        
        oModel1 = new sap.ui.model.json.JSONModel(this.createEmptyOrderObject());
        oModel1.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

        oView.setBusy(true);

       // cabeçalho
                oModel.read("/OVCabSet("+parseInt(ordemId, 10)+")",{
                    success: function(oOrdem, oResponse){
                        // items
                        oModel.read("/OVCabSet("+parseInt(ordemId, 10)+")/toOVItem",{
                            success: function(oData, oResponse){
                                oOrdem.toOVItem = oData.results;
                                oModel1.setData(oOrdem);
                                oView.setModel(oModel1, "Ordem");
                                
                                //that.recalcOrder();
                                oView.setBusy(false);
                            },
                            
                            error: function(oResponse){
                                var oError = JSON.parse(oResponse.responseText);
                                MessageToast.show(oError.error.message.value);
                                oView.setBusy(false);
                            }
                        });
                    },
                    error: function(oResponse){
                        var oError = JSON.parse(oResponse.responseText);
                        MessageToast.show(oError.error.message.value);
                        oView.setBusy(false);
                    }
                });
              //oModel.read("/OVCabSet(OrdemId=" + parseInt(ordemId, 10) + ")?$expand=toOVItem&$format=json​", {
              /*oModel.read("/OVCabSet(1)?$expand=toOVItem​", {
                sucess: function(oOdata) {
                  oModel1.setData(oOdata);
                  oView.setModel(oModel1);
                  that.recalcOrder();

                  oView.setBusy(false);
                },
                error: function(oResponse) {
                      var oError = JSON.parse(oResponse.responseText);
                      MessageToast.show(oError.error.message.value);
                      oView.setBusy(false);
                }
              })
            },*/
            },

            createEmptyOrderObject: function(){
                var oOrdem = {
                    OrdemId: "",
                    DataCriacao: null,
                    CriadoPor: "",
                    ClienteId: "",
                    TotalItens: 0.0,
                    TotalFrete: 0,
                    TotalOrdem: 0.0,
                    Status: "",
                    toOVItem: []
                };
                return oOrdem;
            },

      _onRouteMatchedCreate: function (oEvent) {

        //var oModel = this.getView().getModel();
        //oModel.setData("", "OVCabSet");
      },

      onNavBack: function () {
        const oHistory = sap.ui.core.routing.History.getInstance(this);
        const sPreviousHash = oHistory.getPreviousHash();

        // Limpa o nó específico do model

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


        var oModel = this.getView().getModel("Ordem");

        oModel.setProperty("Ordem", oData);

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteView1");
        }

      },

      onNewItem: function () {
        var oModel = this.getView().getModel("Ordem");
        var aItens = oModel.getProperty("/toOVItem");

        var itemId = aItens.length;

        var oNovoItem = {
          ItemId: itemId + 1,
          Material: "",
          Descricao: "",
          Quantidade: "",
          PrecoTot: "",
          Options: "",
        };

        aItens.push(oNovoItem);
        oModel.setProperty("/toOVItem", aItens);
      },

      onDeleteRow: function (oEvent) {
        var oModel = this.getView().getModel("Ordem");
        var sPath = oEvent.getSource().getBindingContext("Ordem").getPath();
        var aItems = oModel.getProperty("/toOVItem");
        var iIndex = parseInt(sPath.split("/")[2]);

        var counter = 1;

        //Remove o item do array
        if (iIndex > -1) {
          aItems.splice(iIndex, 1);

          for (var i = 0; i < aItems.length; i++) {
            aItems[i].ItemId = counter;
            counter++;
          }

          oModel.setProperty("/toOVItem", aItems);
        }
      },

      parseBRNumber: function (valor) {
        return parseFloat(
          (valor || "").toString().replace(/\./g, "").replace(",", ".")
        );
      },

      formatDateToTimestampSAP: function (date) {
        if (!(date instanceof Date)) date = new Date(date);
        if (isNaN(date)) return "";

        const pad = (n) => n.toString().padStart(2, "0");

        const yyyy = date.getFullYear();
        const MM = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const mm = pad(date.getMinutes());
        const ss = pad(date.getSeconds());

        return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
      },

      onChangePrice: function (oEvent) {
        var _oInput = oEvent.getSource();
        var val = _oInput.getValue();
        var sId = _oInput.getId();

        var oModel = this.getView().getModel("Ordem");

        if (sId.includes("QuantidadeId")) {
          this.onChangeValor(oEvent);
          return;
        }

        val = val.replace(/[^\d]/g, "");

        if (val == "") {
          _oInput.setValue(val);
          return;
        }

        // removendo zero a esquerda
        val = val.replace(/^0+/, "");

        var length = val.length;

        if (length == 1) {
          val = "0,0" + val;
        } else if (length == 2) {
          val = "0," + val;
        } else if (length > 2) {
          val = val.slice(0, length - 2) + "." + val.slice(-2);
          val = formatter.formatPrice(val);
        } else {
          val = "";
        }

        _oInput.setValue(val);

        if (sId.includes("totalFrete")) {
          oModel.setProperty("/TotalOrdem", val);
          return;
        }

        if (sId.includes("PrecoUnitarioId")) {
          this.onChangeValor(oEvent); // chama o cálculo
        }
      },

      onCreateDeepOrder: function () {
        var oHash = sap.ui.core.routing.HashChanger.getInstance().getHash();
        let criar;
        if(oHash.includes("editar")) {
          criar = false;
        } else if (oHash.includes("criar")) {
          criar = true;
        };

        var that = this;

        var oModel = this.getView().getModel();

        this.getView().setBusy(true);

        var oData = JSON.parse(
          JSON.stringify(this.getView().getModel("Ordem").getData())
        );

        var ordemIdValue = this.getView()
          .getModel("Ordem")
          .getProperty("/OrdemId");

        oModel.setProperty("/toOVItem", ordemIdValue);

        // Limpa campos visuais dos itens
        oData.toOVItem = oData.toOVItem.map((item) => {
          let cleaned = { ...item };
          delete cleaned.Opcoes; // ou qualquer outro campo visual
          return cleaned;
        });

        if(criar) {
          delete oData.OrdemId;
        };
        oData.ClienteId = parseInt(oData.ClienteId);

        oData.DataCriacao = new Date(); // sem formatação

        oData.TotalItens = this.parseBRNumber(oData.TotalItens).toFixed(2);
        oData.TotalFrete = this.parseBRNumber(oData.TotalFrete).toFixed(2);
        oData.TotalOrdem = this.parseBRNumber(oData.TotalOrdem).toFixed(2);

        oData.toOVItem.forEach(function (item) {
          item.Quantidade = parseFloat(
            that.parseBRNumber(item.Quantidade).toFixed(2)
          );
          item.PrecoUni = that.parseBRNumber(item.PrecoUni).toFixed(2);
          item.PrecoTot = that.parseBRNumber(item.PrecoTot).toFixed(2);

          delete item.Options;
        });

        oModel.create("/OVCabSet", oData, {
          success: function (oData2, result) {
            that.getView().setBusy(false);
            that.getView().getModel("Ordem").setProperty("/OrdemId", oData2.OrdemId);

          if(criar) {
            MessageToast.show("Registro cadastrado com sucesso!");
          } else {
            MessageToast.show("Registro modificado com sucesso!");
          }
            
            console.log(result);
          },

          error: function (error) {
            that.getView().setBusy(false);
            MessageToast.show("Erro no cadastro!");
            console.log(error);
          },
        });
      },

      onChangeValor: function (oEvent) {
        const oInput = oEvent.getSource();
        const oModel = this.getView().getModel("Ordem");
        const oContext = oInput.getBindingContext("Ordem");

        // Sai da função se o contexto estiver ausente
        if (!oContext) return;

        const sPath = oContext.getPath();
        const oData = oModel.getProperty(sPath);

        // Função auxiliar para converter string formatada (ex: "1.234,56") para número
        const parseBRNumber = (str) =>
          parseFloat(
            (str || "").toString().replace(/\./g, "").replace(",", ".")
          );

        // Converte quantidade e preço unitário para número
        const qtd = parseBRNumber(oData.Quantidade);
        const preco = parseBRNumber(oData.PrecoUni);

        // Se os dois valores forem válidos, calcula o total da linha
        if (!isNaN(qtd) && !isNaN(preco)) {
          const total = qtd * preco;

          // Formata o total da linha no formato brasileiro e atualiza o modelo
          const totalFormatado = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(total);

          oModel.setProperty(sPath + "/PrecoTot", totalFormatado);

          // Obtém os itens da tabela para somar todos os totais
          const aItems = oModel.getProperty("/toOVItem") || [];
          let totalItens = 0;

          aItems.forEach((item) => {
            const valor = parseBRNumber(item.PrecoTot);
            if (!isNaN(valor)) {
              totalItens += valor;
            }
          });

          // Atualiza o valor total dos itens no modelo, formatado
          const totalItensFormatado = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalItens);
          oModel.setProperty("/TotalItens", totalItensFormatado);

          // Converte o total do frete para número e calcula o total geral
          const totalFrete = parseBRNumber(oModel.getProperty("/TotalFrete"));
          const totalOrdem = totalItens + (isNaN(totalFrete) ? 0 : totalFrete);

          const totalOrdemFormatado = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalOrdem);
          oModel.setProperty("/TotalOrdem", totalOrdemFormatado);
        } else {
          // Se não for possível calcular, limpa o total da linha
          oModel.setProperty(sPath + "/PrecoTot", "");
        }
      },
    });
  }
);
