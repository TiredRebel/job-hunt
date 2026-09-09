---
type: 'query'
date: '2026-08-06T10:44:07.169860+00:00'
question: 'Does this application uses Ollama as a current LLM provider?'
contributor: 'graphify'
outcome: 'useful'
source_nodes: ['OllamaProvider', 'ProviderResolver', 'llm-provider.model.ts', 'ollama.py']
---

# Q: Does this application uses Ollama as a current LLM provider?

## Answer

Expanded from original query via graph vocab: [ollama, llm, provider, model, client, chat, completion, openai, anthropic, groq]. Yes. The live gateway provider registry reports the active row as slug ollama-local, name Ollama Cloud, kind ollama, base URL https://ollama.com, and default model glm-5.2:cloud. The resolver reads the active core.llm_providers row and builds the adapter from its kind, so the current runtime provider is Ollama Cloud rather than the seeded local Ollama configuration.

## Outcome

- Signal: useful

## Source Nodes

- OllamaProvider
- ProviderResolver
- llm-provider.model.ts
- ollama.py
