# Reposição · Planejador de compras

Demonstração de portfólio para quem prepara compras em um pequeno comércio. Abrir o site e escolher **Experimentar demonstração** carrega uma papelaria fictícia com referência em 28/10/2026. A ferramenta também lê arquivos do visitante diretamente na memória do navegador.

## Executar e verificar

Use Node 24.12 ou superior e pnpm 11.25.0. Na raiz do repositório:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra o endereço local informado pelo Vite. Para reproduzir a verificação de entrega:

```sh
pnpm test
pnpm run build
pnpm preview
```

A interface usa componentes React em TSX. Os módulos TypeScript em `src/domain/` concentram o cálculo e as regras de CSV. O build verifica tipos em modo estrito e gera os arquivos estáticos em `dist/`. O visitante precisa apenas de um navegador.

## Usar arquivos próprios
Baixe os [modelos de estoque](examples/estoque.csv) e [vendas](examples/vendas.csv). Use UTF-8 com vírgulas, cabeçalho idêntico e datas AAAA-MM-DD. IDs são textuais. Vendas exigem unidades inteiras positivas. O saldo aceita zero. Cada arquivo comporta até 5 MB. Linhas de venda repetidas contam como transações distintas. Confira duplicações antes da importação. Recarregar descarta os dados. Ao abrir o CSV exportado em planilha, importe a coluna produto_id como texto para preservar zeros iniciais.

## Regras e decisões
Consulte [o plano e os critérios de aceitação](PLANO.md). O estoque-alvo arredonda para cima a média diária multiplicada pelos dias de entrega, revisão e segurança. O saldo disponível reduz a quantidade a comprar. Na demonstração, o caderno tem sugestão base de 40 unidades. Ao aplicar demanda +20% e atraso de 2 dias a sugestão passa a 64. Um produto sem histórico admite ajuste manual. Para voltar ao valor calculado, limpe o campo de quantidade final.

## Publicação e segurança
No repositório público, selecione Settings → Pages → Build and deployment → Source → GitHub Actions. O workflow verifica pull requests e publica o conteúdo de dist após testes e build bem-sucedidos na main. Os assets usam caminhos relativos. O projeto dispensa chaves, APIs pagas e arquivos de ambiente. A página utiliza arquivos estáticos da mesma origem. Dados importados são renderizados como texto. O exportador neutraliza prefixos de fórmulas em campos textuais.

## Uso do Codex e evidências
O Codex implementou o núcleo determinístico, o fluxo de revisão, as validações e os testes a partir do briefing do autor. O produto não executa inferência de IA. O plano registra etapas de desenvolvimento e evolução. Ainda não houve experimento com comerciantes nem medição de economia de tempo. Para um ensaio, use os mesmos CSVs fornecidos, prepare o plano manualmente e na ferramenta, registre tempo, erros e ordem de execução e relate o efeito de familiaridade.

## Evolução do projeto

Consulte `git log --oneline --reverse` para acompanhar o protótipo, a migração do núcleo, a interface React e a publicação. Cada incremento tem um objetivo revisável. A mudança para React e TypeScript veio da revisão do autor.

O teste da jornada foi executado localmente no Edge com viewport de 390 × 844 e o build servido em um subdiretório. O exemplo começou com 40 unidades, passou a 64 no cenário e exportou 51 após ajuste manual. Restaurar o exemplo e importar novamente os dois arquivos retornou a sugestão de 40.
