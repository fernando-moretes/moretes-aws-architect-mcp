# Workshop: de um requisito a uma decisão revisável

Duração sugerida: 40 minutos. Público: desenvolvedores, arquitetos e builders. Requisito: cliente MCP e Node 22.13+ para modo local. Use dados sintéticos; não é necessária uma conta AWS para as ferramentas públicas. Não crie infraestrutura durante o exercício.

## 0–5 min: conectar e delimitar

Conecte conforme clients.md e liste as ferramentas. Explique os três níveis: design local, conhecimento público externo e acesso autenticado opcional. O exercício usa apenas os dois primeiros.

## 5–12 min: requisitos

Cenário: API de pedidos, 100 req/s médios, pico 500 req/s, 200 ms de processamento médio, payload 2 KB. São hipóteses de exercício, não medições. Ainda não há RTO/RPO nem orçamento acordados.

Chame `requirements_check`. Resultado esperado: RTO/RPO, dados, SLO, idempotência e custos aparecem como perguntas, sem valores inventados. Calcule `capacity_plan` com taxa média e depois com pico: concorrência média 20 e de pico 100 antes da margem.

## 12–22 min: alternativas e fontes

Use `service_compare` com compute; selecione dois padrões e pesquise as restrições relevantes com `aws_knowledge_search`. Exija URLs e data de consulta. Faça um diagrama com componentes e arestas explícitos. Registre um ADR **proposed**, incluindo hipótese e experimento para validar a escolha.

## 22–32 min: confiança e falha

Submeta um controle Well-Architected marcado `met` mas sem evidência: a ferramenta deve devolvê-lo como `unknown`. Crie um ensaio `after-write-crash`. Identifique o recibo no alvo, a versão esperada e a condição que impede um retry cego.

## 32–40 min: revisão e contribuição

Cada participante registra: versão do MCP/cliente, cenário, resultado esperado/observado, ponto de confusão e sugestão. Abra uma issue sanitizada ou PR com teste reproduzível. Não inclua identificadores de conta, tokens ou dados de clientes. Peça autorização antes de publicar nomes ou depoimentos.

Critérios de conclusão: requisito pendente explícito; comparação com tradeoff; fonte oficial; ADR proposto; cálculo reproduzível; recuperação com resultado incerto bloqueado. Medir aprendizado e problemas encontrados, não pedir estrelas ou votos como condição.
