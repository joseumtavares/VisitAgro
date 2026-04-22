🎯 O QUE É ESTE DOCUMENTO

Este guia ensina, de forma simples e prática, como:

encontrar erros no sistema; entender onde o problema acontece; usar
agentes para analisar o código; adicionar comentários inteligentes para
facilitar debugging; corrigir com segurança; evitar que o erro volte.

👉 Você NÃO precisa saber programar profundamente para usar este fluxo.

🧭 VISÃO GERAL DO PROCESSO

Você vai seguir este caminho:

1.  Abrir o problema (lote)
2.  Analisar o código (comentador)
3.  Revisar se os comentários fazem sentido
4.  Filtrar excesso e ruído (auditor)
5.  Consolidar o que deve ser feito (síntese)
6.  Corrigir (executor)
7.  Testar
8.  Fechar o lote 📦 ORDEM DE UTILIZAÇÃO DOS ARQUIVOS

Use exatamente nesta ordem:

1.  16_template_lote_comentarios_debug.md
2.  12_comentador_debug.md
3.  13_revisor_comentarios.md
4.  14_auditor_comentarios.md
5.  15_sintese_comentarios.md
6.  17_template_handoff_comentarios.md
7.  18_checklist_fechamento_comentarios.md 🥇 ETAPA 1 --- ABRIR O
    PROBLEMA (LOTE)

📄 Arquivo: 16_template_lote_comentarios_debug.md

🧠 O que é isso?

É onde você descreve o problema.

👉 Pense como:

"O que está dando errado no sistema?"

🪜 Como fazer (passo a passo simples) Abra o arquivo
16_template_lote_comentarios_debug.md Preencha: Exemplo: lote_id:
L050_debug_representantes título: erro em representante nas vendas
objetivo: entender por que vendas estão sem representante problema
observado: vendas aparecem sem responsável causa suspeita: erro no
salvamento do pedido 🎯 Resultado esperado

Você terá:

problema claro escopo definido base para análise 🧠 ETAPA 2 --- ANALISAR
O SISTEMA (COMENTADOR)

📄 Arquivo: 12_comentador_debug.md

🧠 O que esse agente faz?

Ele:

lê o código encontra pontos críticos adiciona comentários inteligentes
marca possíveis erros 🪜 Como usar Copie o conteúdo do arquivo
12_comentador_debug.md Cole no ChatGPT Execute 🔍 O que ele vai fazer

Ele vai procurar:

regras importantes riscos de erro partes perigosas do código onde o dado
entra e sai onde pode quebrar 🧾 Exemplo de resultado // ⚠️ POSSÍVEL
ERRO: representative_id pode estar null 🎯 Resultado esperado

Código mais claro, com marcações como:

REGRA ERRO FLUXO DEPENDÊNCIA 🧪 ETAPA 3 --- REVISAR OS COMENTÁRIOS

📄 Arquivo: 13_revisor_comentarios.md

🧠 O que acontece aqui?

Você verifica se os comentários fazem sentido.

🪜 Como usar Copie o prompt do revisor Cole no ChatGPT Envie junto com a
resposta do comentador 🔍 O que ele valida comentários úteis?
comentários desnecessários? algo errado? algo faltando? 🎯 Resultado
esperado

Lista com:

o que está bom o que precisa corrigir 🧠 ETAPA 4 --- FILTRAR EXCESSO
(AUDITOR)

📄 Arquivo: 14_auditor_comentarios.md

🧠 O que esse agente faz?

Ele remove:

comentários inúteis exageros ruído

👉 Ele deixa só o essencial.

🪜 Como usar Copie o prompt do auditor Cole no ChatGPT Envie junto com
etapas anteriores 🎯 Resultado esperado código limpo comentários úteis
sem excesso 🧾 ETAPA 5 --- CONSOLIDAR (SÍNTESE FINAL)

📄 Arquivo: 15_sintese_comentarios.md

🧠 O que acontece aqui?

Aqui você cria a versão final:

o que corrigir o que manter o que ignorar 🪜 Como usar Copie o prompt
Cole no ChatGPT Envie todas as etapas anteriores 🎯 Resultado esperado

Um plano final limpo para execução.

🔁 ETAPA 6 --- HANDOFF (PASSAR PARA EXECUÇÃO)

📄 Arquivo: 17_template_handoff_comentarios.md

🧠 O que é isso?

Você está dizendo:

"Agora faça isso exatamente assim"

🪜 Como usar

Preencha:

o que já foi feito o que falta o que NÃO pode mexer 🎯 Resultado
esperado

Instruções claras para execução.

🧪 ETAPA 7 --- TESTAR

📄 Base: processo de validação

🪜 O que fazer

Testar:

funcionalidade erro corrigido sistema funcionando ✔️ Exemplos criar
venda verificar representante verificar relatório ✅ ETAPA 8 --- FECHAR
O LOTE

📄 Arquivo: 18_checklist_fechamento_comentarios.md

🪜 Marque tudo isso: \[ \] erro resolvido \[ \] sistema funcionando \[
\] comentários úteis \[ \] sem poluição no código \[ \] sem novos erros
🚨 REGRAS IMPORTANTES (LEIA ISSO) ❌ NÃO FAÇA não saia corrigindo tudo
não mude o sistema inteiro não invente lógica não comente tudo ✅ FAÇA
comente só o importante encontre a causa do erro valide antes de
corrigir siga o passo a passo 🧠 DICA DE OURO

👉 Sempre pense assim:

"Onde isso pode dar erro?"

Se a resposta for:

aqui pode quebrar aqui depende de algo aqui já deu problema

👉 então deve ter comentário

🚀 EXEMPLO COMPLETO (SIMPLIFICADO) Problema: vendas sem representante

↓

Abrir lote

↓

Comentador: marca erro em order.user_id

↓

Revisor: confirma erro

↓

Auditor: remove comentários inúteis

↓

Síntese: define correção

↓

Executor: corrige validação

↓

Teste: ok

↓

Fechamento 🎯 RESULTADO FINAL

Depois de usar esse processo, você terá:

código mais fácil de entender erros mais fáceis de encontrar menos
retrabalho mais segurança para mexer no sistema 🧾 RESUMO FINAL

Se estiver perdido, siga isso:

1.  descreva o problema
2.  rode o comentador
3.  revise
4.  audite
5.  consolide
6.  corrija
7.  teste
8.  finalize 🚀 SE QUISER EVOLUIR

Posso te ajudar a:

automatizar esse fluxo integrar com CI/CD gerar logs inteligentes criar
debug automático por módulo
