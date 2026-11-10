# Reposição

Aplicação web para apoiar a revisão de compras de um pequeno comércio. A pessoa responsável confere vendas e saldo atual, analisa uma sugestão por produto, simula mudanças na demanda e exporta o plano revisado.

A demonstração usa uma papelaria fictícia e dados sintéticos. O cálculo é determinístico e segue uma regra simples de revisão periódica. Ainda não foi validado com comerciantes, e o projeto não mede impacto financeiro ou operacional.

## Demonstração

A demonstração carrega um exemplo reproduzível com referência em 28/10/2026. Para o caderno pontilhado, 140 unidades vendidas em 28 dias e saldo de 20 unidades resultam em uma sugestão de compra de 40. Ao simular demanda 20% maior e dois dias adicionais de prazo, a sugestão passa a 64 unidades.

## O que é possível fazer

- Explorar a demonstração com período e parâmetros editáveis.
- Importar vendas e saldo de estoque em arquivos CSV.
- Conferir validações, produtos sem histórico e risco durante o prazo.
- Simular variação de demanda e atraso de entrega.
- Ajustar quantidades manualmente e exportar o plano em CSV.

Os dados importados permanecem na memória do navegador e são descartados ao recarregar a página.

## Regra de reposição

O estoque-alvo corresponde à média diária de vendas multiplicada pelos dias de prazo, intervalo entre revisões e segurança. A compra sugerida é a diferença entre o alvo e o saldo atual, limitada a zero e arredondada para cima no cálculo do alvo.

A regra pressupõe que não existem pedidos em trânsito, reservas ou restrições de lote. Dias sem registros de venda contam como zero somente após a confirmação de que o histórico cobre todo o período. Produtos sem venda no período não recebem sugestão automática.

Consulte [o plano e os critérios de aceitação](PLANO.md) para detalhes das regras, premissas e backlog.

## Arquivos CSV

Baixe os [modelos de estoque](examples/estoque.csv) e [vendas](examples/vendas.csv). Use CSV UTF-8, vírgulas, cabeçalho e datas no formato `AAAA-MM-DD`. Cada arquivo pode ter até 5 MB.

O arquivo de estoque usa `produto_id,produto_nome,estoque_atual`. O arquivo de vendas usa `data,produto_id,quantidade`. Os identificadores são texto, portanto IDs com zeros iniciais devem ser preservados. Vendas exigem quantidades inteiras positivas. O saldo aceita zero. Linhas de venda repetidas são somadas, por isso confira duplicações antes de importar.

## Tecnologias

React e TypeScript compõem a interface. O Vite gera a versão estática do site, e os cálculos e validações ficam separados da apresentação em `src/domain/`. A aplicação funciona no navegador e não depende de API ou serviço pago.

## Executar localmente

Requer Node.js 24.12 ou superior e pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Para conferir os cálculos, a checagem de tipos e o build de produção:

```sh
pnpm test
pnpm run build
```

## Histórico

O histórico do Git registra a evolução do protótipo, a tipagem do núcleo, a migração da interface para React e a preparação da publicação.
