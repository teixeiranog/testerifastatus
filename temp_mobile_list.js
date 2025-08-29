// Exemplo de como deve ficar a lista mobile recolhível

{/* Lista de Pedidos - Mobile */}
<div className="lg:hidden space-y-3">
  {pedidosFiltrados.length > 0 ? (
    <>
      {/* Primeiros 4 pedidos sempre visíveis */}
      {pedidosFiltrados.slice(0, 4).map((pedido) => {
        const statusInfo = getStatusInfo(pedido.status_pagamento);
        return (
          <Card key={pedido.id} className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    ID: {pedido.id}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {pedido.usuario?.nome || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {pedido.usuario?.email || 'N/A'}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="truncate">{pedido.rifa?.titulo || 'N/A'}</p>
                <p className="font-medium text-gray-900">{formatarValor(pedido.valor_total)}</p>
                <p className="text-xs text-gray-500">{formatarData(pedido.data_criacao)}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setPedidoSelecionado(pedido);
                    setModalDetalhes(true);
                  }}
                  className="text-primary-600 hover:text-primary-900 text-sm"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      
      {/* Pedidos adicionais (visíveis apenas quando expandido) */}
      {listaExpandida && pedidosFiltrados.slice(4).map((pedido) => {
        const statusInfo = getStatusInfo(pedido.status_pagamento);
        return (
          <Card key={pedido.id} className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    ID: {pedido.id}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {pedido.usuario?.nome || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {pedido.usuario?.email || 'N/A'}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="truncate">{pedido.rifa?.titulo || 'N/A'}</p>
                <p className="font-medium text-gray-900">{formatarValor(pedido.valor_total)}</p>
                <p className="text-xs text-gray-500">{formatarData(pedido.data_criacao)}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setPedidoSelecionado(pedido);
                    setModalDetalhes(true);
                  }}
                  className="text-primary-600 hover:text-primary-900 text-sm"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      
      {/* Botão para expandir/recolher */}
      {pedidosFiltrados.length > 4 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setListaExpandida(!listaExpandida)}
            className="flex items-center space-x-2"
          >
            {listaExpandida ? (
              <>
                <span>Ver menos</span>
                <span className="text-xs">({pedidosFiltrados.length - 4} menos)</span>
              </>
            ) : (
              <>
                <span>Ver mais</span>
                <span className="text-xs">({pedidosFiltrados.length - 4} mais)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </>
  ) : (
    <div className="text-center text-gray-500 py-8">
      Nenhum pedido encontrado
    </div>
  )}
</div>
