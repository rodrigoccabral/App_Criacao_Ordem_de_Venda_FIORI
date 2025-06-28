sap.ui.define(
  ["project1/controller/BaseController",
   "sap/m/MessageToast",
   "../model/formatter"],
   (BaseController, MessageToast, formatter) => {
  "use strict";

  return BaseController.extend("project1.controller.OrdemList", {
    formatter: formatter,
    
    onInit() {
      const oView = this.getView();
      
      // Obtenção do router da aplicação e associação do evento de navegação
      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.getRoute("RouteToOrderListView").attachPatternMatched(this._onRouteToOrderListView, this);

      // Model para os filtros utilizados na tela
      const oFilterModel = new sap.ui.model.json.JSONModel({
                    "OrdemId"       : "",
                    "DataCriacao"   : null,
                    "CriadoPor"     : "",
                    "ClienteId"     : "",
                    "TotalItens"    : 0,
                    "TotalFrete"    : 0,
                    "TotalOrdem"    : 0,
                    "Status"        : "",
                    "OrdenacaoCampo": "OrdemId",
                    "OrdenacaoTipo" : "ASC",
                    "Limite"        : 25,
                    "Ignorar"       : 0
      });
      oView.setModel(oFilterModel, "filterModel");
    },

    _onRouteToOrderListView : function() { 
      const oView = this.getView();
      const oModel = this.getOwnerComponent().getModel();

      // JSON Model temporário para armazenar os dados formatados
      var oOrderTableModel  = new sap.ui.model.json.JSONModel([]);
      oOrderTableModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

      // Ativa o indicador de carregamento  
      oView.setBusy(true);

      oModel.read("/OVCabSet", {
        success: function (oData) {
          // Formatador para valores monetários no padrão brasileiro
          const oCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          // Formatação dos campos monetários de cada item
          oData.results.forEach(item => {
            item.TotalFrete = oCurrencyFormatter.format(item.TotalFrete);
            item.TotalItens = oCurrencyFormatter.format(item.TotalItens);
            item.TotalOrdem = oCurrencyFormatter.format(item.TotalOrdem);
          });

          // Define os dados no model e associa a view
          oOrderTableModel.setData(oData.results);
          oView.setModel(oOrderTableModel , "orderTableModel");

          oView.setBusy(false);
        },

        error: function (oError) {
          // Tratamento de erro com feedback ao usuário
          try {
              const oResponse = JSON.parse(oError.responseText);
              MessageToast.show(oResponse.error.message.value);
          } catch (e) {
              MessageToast.show("Erro ao carregar os dados.");
          };

          oView.setBusy(false);
        }
      })
    },

    onFilterSearch : function() {
      const oView        = this.getView();
      const oModel       = this.getOwnerComponent().getModel();
      const oFilterModel = oView.getModel("filterModel");
      const oTableModel  = oView.getModel("orderTableModel");
      const oFilterData  = oFilterModel.getData();
      const aParams      = [];
      const aSorters     = [];
      const aFilters     = [];

      // Filtro por ID da Ordem (se preenchido)
      if(oFilterData.OrdemId !== "") {
        aFilters.push(new sap.ui.model.Filter({
            path: "OrdemId",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oFilterData.OrdemId
        }));
      };

      // Filtro por ID do Cliente (se preenchido)
      if(oFilterData.ClienteId !== "") {
        aFilters.push(new sap.ui.model.Filter({
            path: "ClienteId",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: oFilterData.ClienteId
        }));
      };

      const bDescending = oFilterData.OrdenacaoTipo === "DESC";

      // Cria o sorter (se o campo de ordenação estiver preenchido)
      if(oFilterData.OrdenacaoCampo !== "") {
        aSorters.push(new sap.ui.model.Sorter(oFilterData.OrdenacaoCampo, bDescending));
      };

      // Parâmetros de paginação (OData query options)
      aParams.push("$top="+oFilterData.Limite);
      aParams.push("$skip="+oFilterData.Ignorar);

      // Ativa o indicador de carregamento
      oView.setBusy(true);
      
      // Executa a leitura dos dados via OData com os filtros, ordenação e parâmetros definidos
      oModel.read("/OVCabSet", {
        sorters      : aSorters,
        filters      : aFilters,
        urlParameters: aParams,

        success : function(oData) {
          // Atualiza os dados da tabela com os resultados da leitura
          oTableModel.setData(oData.results);
          oView.setBusy(false);
        },
        error : function (oResponse) {
          // Trata erros e exibe mensagem amigável ao usuário
            try {
                const oError = JSON.parse(oResponse.responseText);
                MessageToast.show(oError.error.message.value);
            } catch (e) {
                MessageToast.show("Erro ao buscar dados.");
            }
            oView.setBusy(false);
          }
        })
    },

    onOrderAction: function (oEvent) {
      const oRouter   = sap.ui.core.UIComponent.getRouterFor(this);
      const sButtonId = oEvent.getSource().getId();

      // Verifica se o botão clicado é de edição (baseado no ID do botão)
      if (sButtonId.includes("btnEditar")) {
        // Obtém o ID da ordem selecionada
        const oContext       = oEvent.getSource().getBindingContext("orderTableModel");
        const oSelectedOrder = oContext.getObject();
        const sOrderId       = oSelectedOrder.OrdemId;

        // Navega para a tela de edição da ordem, passando o ID como parâmetro
        oRouter.navTo("RouteToOrderEditScreen", { ordemId: sOrderId  });
      } else {

        // Se não for edição, navega para a tela de criação de nova ordem
        oRouter.navTo("RouteToOrderCreateScreen");
      }
    },

    onChangeStatus : function (status) {
      const oView          = this.getView();
      const oTable         = oView.byId("orderListTable");
      const aSelectedItems = oTable.getSelectedItems();
      const oTModel        = oView.getModel("orderTableModel");
      const oModel         = this.getOwnerComponent().getModel();

      if (aSelectedItems.length === 0) {
        MessageToast.show("Nenhum item selecionado.");
        return;
      }
  
      const aResponses      = [];
      let completedRequests = 0;

      // Função utilitária para tratar respostas de sucesso ou erro.
      const handleResponse = (response) => {
        aResponses.push(response);
        completedRequests++;

        if (completedRequests === aSelectedItems.length) {
          this.oOpenDialog(aResponses);
          }

        };

        aSelectedItems.forEach((oItem) => {

        const oContext = oItem.getBindingContext("orderTableModel");
        const oData    = oContext.getObject();
        
        // Itera sobre cada item selecionado para chamar a função OData correspondente
        oModel.callFunction("/ZFI_ATUALIZA_STATUS", {
          method: "GET",
          urlParameters: {
            ID_ORDEMID: oData.OrdemId,
            ID_STATUS: status
          },
          success: (oResult) => {
            oData.Status = status;
            oTModel.refresh();
            handleResponse(oResult.results);
          },
          error: (oError) => {
            const sErrorMessage = JSON.parse(oError.responseText).error.message.value;
            handleResponse(sErrorMessage);  
          }
        });
      });
    },

    oOpenDialog: function (aResponse) {
        const oView           = this.getView();
        const aMensagens      = aResponse.flat();
        const oMensagensModel = new sap.ui.model.json.JSONModel();

        oMensagensModel.setData(aMensagens);
        oView.setModel(oMensagensModel, "Mensagens");

        // Recupera e abre o diálogo se ainda não estiver instanciado
        if(!this.oDialog){
          this.oDialog = this.byId("dialogInfoId");
        }

        this.oDialog.open();
    },

    onCloseDialog : function () {
      this.oDialog.close();
    }

  });
});
