# Planejador de compras e estoque

## Produto e hipótese
Uma pessoa responsável por compras de uma loja de produtos acabados pode cruzar vendas e saldo disponível, revisar uma sugestão por item e exportar o plano. A hipótese de economia de tempo ainda precisa de medição. A demonstração usará uma papelaria fictícia, uma unidade de estoque por produto e uma data de referência fixa.

## Jornada
Abrir a demonstração em um clique ou baixar os dois modelos e importar os próprios arquivos. Conferir período, referência e cobertura do histórico. Revisar a tabela, abrir a memória de cálculo de um item, simular demanda e atraso, ajustar quantidades e exportar. A tela diferenciará falta de histórico, compra zero e risco durante o prazo.

## Regras acordadas no briefing e decisões propostas
- CSV UTF-8 com vírgula, cabeçalho, aspas duplas, suporte a BOM e CRLF, até 5 MB por arquivo. Vendas usam data,produto_id,quantidade. Estoque usa produto_id,produto_nome,estoque_atual. IDs são texto e conservam zeros à esquerda. Linhas de venda repetidas são somadas. IDs de estoque duplicados ou ausentes bloqueiam a importação com indicação de linha e campo.
- O saldo corresponde à referência informada. O intervalo inclusivo termina até essa referência, com padrão de 28 dias. Mostrar vendas excluídas. Na importação, exigir confirmação explícita de cobertura integral e invalidá-la se os arquivos ou o período mudarem.
- Dividir vendas pelos dias corridos confirmados, inclusive dias sem transações. Vendas observadas durante falta de estoque podem subestimar a demanda. Um produto sem vendas fica disponível para revisão manual, sem sugestão automática.
- Calcular alvo = teto(média diária × (prazo + revisão + segurança)). Sugerir o excesso do alvo sobre o saldo, limitado inferiormente a zero. A média mantém sua precisão até o cálculo do alvo. Sinalizar risco quando saldo / média < prazo. A regra pressupõe ausência de pedidos pendentes, reservas e lotes mínimos.
- Simular mudança na média desde −100% e atraso inteiro não negativo, preservando a base. Com histórico e demanda simulada nula, o alvo e a compra do cenário são zero e a cobertura fica indisponível.
- Proposta de revisão: a quantidade final acompanha o cenário até edição manual. Um ajuste explícito prevalece até ser removido. Trocar o conjunto de dados limpa ajustes. Exportar referência, período, parâmetros, cenário, sugestão original, quantidade final e indicação de ajuste.
- Exemplo de aceitação: 140 unidades em 28 dias, saldo 20, prazo 3, revisão 7 e segurança 2 resultam em média 5, alvo 60 e compra 40. Com +20% e dois dias de atraso, o alvo passa a 84 e a compra a 64.

## Arquitetura e publicação
Frontend estático em português, módulos separados de validação, reposição, cenário, exportação e interface. Preferência por módulos JavaScript com contratos JSDoc, sem dependências de execução ou compilação. Testes do núcleo com o executor nativo do Node. Assets relativos em docs/ permitem publicação a partir de main e /docs. Arquivos do visitante ficam em memória. Renderizar campos como texto e neutralizar fórmulas em campos textuais de CSV. Publicar somente exemplos sintéticos. O cálculo é determinístico e o uso de IA se concentra no desenvolvimento.

## Backlog priorizado
| Marco | Entrega verificável |
| --- | --- |
| M1 · Núcleo | Exemplos 40 e 64, arredondamento final, saldo acima do alvo, período de um dia, intervalo inválido, demanda nula e histórico ausente cobertos por testes. |
| M2 · Demonstração | Um clique abre plano reproduzível, parâmetros editáveis, indicadores por produto e memória de cálculo. |
| M3 · Importação e exportação | Modelos baixáveis, validação com linha e campo, confirmação de cobertura, IDs preservados e CSV seguro. Dados inválidos bloqueiam a geração. |
| M4 · Revisão | Filtros, cenário separado, ajustes manuais e restauração da demonstração. Exportação distingue sugestão base, cenário e decisão final. |
| M5 · Portfólio | Verificar jornada por teclado e em tela pequena, registrar testes, decisões e uso de IA no README, publicar e verificar a URL pública. |

O experimento de tempo exige que o autor execute a mesma tarefa manualmente e com o aplicativo. Registrar ordem, tempos, erros e familiaridade. Publicar resultados apenas após a execução. Pedidos pendentes são a primeira evolução proposta, pois compras repetidas podem duplicar reposições.
