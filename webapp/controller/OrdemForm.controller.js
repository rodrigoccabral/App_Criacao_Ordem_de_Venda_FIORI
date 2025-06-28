sap.ui.define(
  ["project1/controller/BaseController", 
    "sap/m/MessageToast", 
    "../model/formatter"],
  (Controller, MessageToast, formatter) => {
    "use strict";

    return Controller.extend("project1.controller.OrdemForm", {
      formatter: formatter,

      onInit() {
        const oView       = this.getView();
        const oRouter     = sap.ui.core.UIComponent.getRouterFor(this);
        
        // Cria e associa o modelo de dados principal da ordem (do tipo JSONModel)
        const oOrderModel = new sap.ui.model.json.JSONModel(this._createEmptyOrderObject());

        oOrderModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
        oView.setModel(oOrderModel, "Ordem");

        // Cria o modelo de status para o ComboBox de status da ordem
        const oStatusLista = new sap.ui.model.json.JSONModel({
          statusLista: [
            { key: "Novo",      status: "Novo"      },
            { key: "Fornecido", status: "Fornecido" },
            { key: "Faturado",  status: "Faturado"  },
            { key: "Cancelado", status: "Cancelado" },
          ],
        });

        // Associa o modelo ao ComboBox de status
        oView.byId("ComboId").setModel(oStatusLista, "Lista");
 
        // Associa o modelo ao ComboBox de status
        oRouter.getRoute("RouteToOrderEditScreen").attachPatternMatched(this._onRouteMatchedEdit, this);
        oRouter.getRoute("RouteToOrderCreateScreen").attachPatternMatched(this._onRouteMatchedCreate, this);
        oRouter.getRoute("RouteToOrderListView").attachPatternMatched(this._onRouteMatchedMain, this);
      },

      _onRouteMatchedMain: function () {
        // Cria um novo modelo JSON com os dados vazios da ordem
        const oModel = new sap.ui.model.json.JSONModel(this._createEmptyOrderObject());
        oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

        // Associa o modelo à view
        this.getView().setModel(oModel, "Ordem");

        // Ativa edição para os campos de data de criação e criado por
        this.byId("DTP1").setEditable(true);
        this.byId("criadoPor").setEditable(true);
      },

      _onRouteMatchedEdit: function (oEvent) {
        const oView   = this.getView();
        const ordemId = oEvent.getParameter("arguments").ordemId;
        const oModel  = this.getOwnerComponent().getModel();

        // Define campos específicos como não editáveis
        this.byId("DTP1").setEditable(false);
        this.byId("criadoPor").setEditable(false);
        this.getView().byId("btnCriarOrdemId").setText("Salvar");

        const oOrderModel = new sap.ui.model.json.JSONModel(this._createEmptyOrderObject());
        oOrderModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

        oView.setBusy(true);

       // Carrega os dados do cabeçalho da ordem
        oModel.read("/OVCabSet("+parseInt(ordemId, 10)+")",{
            success: (oOrdem) => {
                // Carrega os itens associados à ordem
                oModel.read("/OVCabSet("+parseInt(ordemId, 10)+")/toOVItem",{
                    success: (oData) => {
                      const formatador = new Intl.NumberFormat("pt-BR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                      });
                      
                      // Formata os valores monetários dos itens
                      oData.results.forEach(item => {
                        item.PrecoTot = formatador.format(item.PrecoTot);
                        item.PrecoUni = formatador.format(item.PrecoUni);
                      });

                      oOrdem.toOVItem = oData.results;

                      // Formata campos do cabeçalho
                      oOrdem.TotalFrete = formatador.format(oOrdem.TotalFrete);
                      oOrdem.TotalItens = formatador.format(oOrdem.TotalItens);
                      oOrdem.TotalOrdem = formatador.format(oOrdem.TotalOrdem);

                      // Atualiza o modelo com os dados carregados
                      oOrderModel.setData(oOrdem);
                      oView.setModel(oOrderModel, "Ordem");
                        
                      oView.setBusy(false);
                    },
                    
                    error: (oResponse) =>{
                      this._showODataError(oResponse);
                      oView.setBusy(false);
                    }
                });
            },
            error: (oResponse) => {
              this._showODataError(oResponse);
              oView.setBusy(false);
            }
        });
      },

      _showODataError: function(oResponse) {
        try {
          const oError = JSON.parse(oResponse.responseText);
          MessageToast.show(oError.error.message.value);
        } catch {
          MessageToast.show("Erro ao carregar dados.");
        }
      },

      _createEmptyOrderObject: function(){
          const oOrdem = {
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
        this.getView().byId("btnCriarOrdemId").setText("Criar");
      },

      onNavBack: function () {
        const oHistory      = sap.ui.core.routing.History.getInstance(this);
        const sPreviousHash = oHistory.getPreviousHash();
        const oModel        = this.getView().getModel("Ordem");
        // Limpa o nó específico do model

        const oData = new sap.ui.model.json.JSONModel({
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

        oModel.setProperty("Ordem", oData);

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteToOrderListView");
        }

      },

      onNewItem: function () {
        const oModel = this.getView().getModel("Ordem");
        const aItens = oModel.getProperty("/toOVItem");
        const itemId = aItens.length;
        const oNovoItem = {
          ItemId     : itemId + 1,
          Material   : "",
          Descricao  : "",
          PrecoUni   : 0,
          PrecoTot   : 0.00,
          Options    : "",
        };

        aItens.push(oNovoItem);
        oModel.setProperty("/toOVItem", aItens);
      },

      onDeleteRow: function (oEvent) {
        // Obtém o modelo de dados da ordem de venda
        const oModel     = this.getView().getModel("Ordem");

        // Caminho do item selecionado na tabela (ex: "/toOVItem/2")
        const sItemPath  = oEvent.getSource().getBindingContext("Ordem").getPath();

        // Extrai o índice do item a ser removido
        const iItemIndex = parseInt(sItemPath.split("/")[2]);

        // Obtém a lista atual de itens da ordem
        const aOVItems   = oModel.getProperty("/toOVItem");

        // Verifica se o índice é válido
        if (iItemIndex > -1) {
          // Remove o item da lista
          aOVItems.splice(iItemIndex, 1);

          // Reatribui os IDs sequenciais (ItemId) para manter a consistência
          aOVItems.forEach(function (item, index) {
              item.ItemId = index + 1;
          });

          // Atualiza o modelo com a nova lista de itens
          oModel.setProperty("/toOVItem", aOVItems);
        }
      },

      parseBRNumber: function (valor) {
          // Garante que o valor seja uma string para aplicar substituições         
          let sValor = (valor || "").toString();

          // Remove os pontos de milhar e troca a vírgula decimal por ponto
          sValor = sValor.replace(/\./g, "").replace(",", ".");

          // Converte para float
          return parseFloat(sValor);
      },

      onChangePrice: function (oEvent) {
        const oInput  = oEvent.getSource();
        const sId     = oInput.getId();
        const oModel  = this.getView().getModel("Ordem");
        let sValueRaw = oInput.getValue();
        
        // Se for campo de quantidade, redireciona para outro handler
        if (sId.includes("QuantidadeId")) {
          this.onChangeValor(oEvent);
          return;
        }

        // Limpa caracteres não numéricos
        let sValue = sValueRaw.replace(/[^\d]/g, "");

        // Se valor estiver vazio, apenas limpa o campo
        if (!sValue) {
          oInput.setValue("");
        }

        // Remove zeros à esquerda
        sValue = sValue.replace(/^0+/, "");

        const length = sValue.length;
        let formattedValue;

        if (length == 1) {
          formattedValue = "0,0" + sValue;
        } else if (length == 2) {
          formattedValue = "0," + sValue;
        } else {
          const valorNumerico = sValue.slice(0, length - 2) + "." + sValue.slice(-2);
          formattedValue  = formatter.formatPrice(valorNumerico);
        }

        // Atualiza o valor formatado no input
        oInput.setValue(formattedValue);

        if (sId.includes("PrecoUnitarioId") && !sValue) {
          oInput.setValue(0);
        }
        if (sId.includes("QuantidadeId") && !sValue) {
          oInput.setValue(0);
        }
        // Caso o campo seja de frete, recalcula o total da ordem
        if (sId.includes("totalFrete")) {

          const aItems = oModel.getProperty("/toOVItem") || [];

          let totalItens = 0;
          
          aItems.forEach((item) => {
            const preco = this.parseBRNumber(item.PrecoTot);
            if (!isNaN(preco)) {
              totalItens += preco;
            };
          });

          let totalFrete = this.parseBRNumber(formattedValue);

          if (isNaN(totalFrete)) {
            totalFrete = 0;
          };

          const totalOrdem = totalFrete + totalItens;
          const totalOrdemFormatado = new Intl.NumberFormat("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          }).format(totalOrdem);

          oModel.setProperty("/TotalOrdem", totalOrdemFormatado);

          return;
        }

        // Caso seja preço unitário, recalcula valor total do item
        if (sId.includes("PrecoUnitarioId")) {
          this.onChangeValor(oEvent);
        }
      },

      onCreateDeepOrder: function () {
        const oView       = this.getView();
        const oModel      = oView.getModel();
        const oOrdemModel = oView.getModel("Ordem");
        const that        = this;

        // Verifica se a operação é de criação ou edição com base no hash da URL
        const sHash  = sap.ui.core.routing.HashChanger.getInstance().getHash();
        const bCriar = sHash.includes("criar");

       // Clona os dados do modelo "Ordem" para evitar modificações diretas
        const oData = JSON.parse(JSON.stringify(oOrdemModel.getData()));

        // Limpa identificador da ordem, se for criação
        if (bCriar) {
            delete oData.OrdemId;
        }

        // Limpa campos visuais desnecessários dos itens
        oData.toOVItem = oData.toOVItem.map((item) => {
          const cleaned = { ...item };
          delete cleaned.Opcoes;
          delete cleaned.Options;
          return cleaned;
        });

        // Conversões e validações de campos numéricos
        oData.TotalItens  = this.parseBRNumber(oData.TotalItens).toFixed(2);
        oData.TotalFrete  = this.parseBRNumber(oData.TotalFrete).toFixed(2);
        oData.TotalOrdem  = this.parseBRNumber(oData.TotalOrdem).toFixed(2);
        oData.ClienteId   = parseInt(oData.ClienteId, 10);
        oData.DataCriacao = new Date();

        // Conversão dos campos numéricos dos itens
        oData.toOVItem.forEach((item) => {
          item.Quantidade = parseFloat(this.parseBRNumber(item.Quantidade).toFixed(2));
          item.PrecoUni   = that.parseBRNumber(item.PrecoUni).toFixed(2);
          item.PrecoTot   = that.parseBRNumber(item.PrecoTot).toFixed(2);        
        });

        // Ativa o busy indicator da view
        oView.setBusy(true);

        // Envia os dados via deep insert
        oModel.create("/OVCabSet", oData, {
          success: function (oResponseData) {
            const sMensagem = bCriar?"Registro cadastrado com sucesso!":"Registro modificado com sucesso!";

            oOrdemModel.setProperty("/OrdemId", oResponseData.OrdemId);       
            oView.setBusy(false);
            MessageToast.show(sMensagem);
          },

          error: function (oError) {
            oView.setBusy(false);
            MessageToast.show("Erro no cadastro!");
          },
        });
      },
      
      onChangeValor: function (oEvent) {
        const oInput     = oEvent.getSource();
        const oModel     = this.getView().getModel("Ordem");
        const oContext   = oInput.getBindingContext("Ordem");
        const formatador = new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })

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
        let qtd = parseBRNumber(oData.Quantidade);
        const preco = parseBRNumber(oData.PrecoUni);

        // Se os dois valores forem válidos, calcula o total da linha
        //if (!isNaN(qtd) && !isNaN(preco)) {
          if (!isNaN(preco)) {
            if(isNaN(qtd)) {qtd = 0}
          const total = qtd * preco;

          // Formata o total da linha no formato brasileiro e atualiza o modelo
          oModel.setProperty(sPath + "/PrecoTot", formatador.format(total));

          // Obtém os itens da tabela para somar todos os totais
          const aItems = oModel.getProperty("/toOVItem") || [];
          let totalItens = 0;

          aItems.forEach((item) => {
            const valor = parseBRNumber(item.PrecoTot);
            if (!isNaN(valor)) {
              totalItens += valor;
            }
          });

          // Atualiza o valor total dos itens formatado no modelo 
          oModel.setProperty("/TotalItens", formatador.format(totalItens));

          // Converte o total do frete para número e calcula o total geral
          const totalFrete = parseBRNumber(oModel.getProperty("/TotalFrete"));
          const totalOrdem = totalItens + (isNaN(totalFrete) ? 0 : totalFrete);

          // Converte o total da ordem para número e calcula o total geral
          oModel.setProperty("/TotalOrdem", formatador.format(totalOrdem));
        } else {
          // Se não for possível calcular, limpa o total da linha
          oModel.setProperty(sPath + "/PrecoTot", "");
        }
      }
    });
  }
);
