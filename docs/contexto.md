# Contexto do projeto — SpotSense

> Documento de referência permanente. Define objetivos, regras de negócio, stack e identidade visual.
> (Originalmente escrito como "ParkSense"; o nome oficial do produto é **SpotSense**.)

## 1. Objetivo

O SpotSense é uma plataforma web para cadastrar e gerenciar estacionamentos, acompanhar suas vagas e visualizar em tempo real quais estão ocupadas ou disponíveis.

O diferencial é combinar **vagas simuladas** com **vagas físicas** monitoradas por dispositivos IoT. O projeto será apresentado academicamente com uma maquete física de estacionamento contendo uma vaga real, equipada com sensor e microcontrolador (ESP32).

## 2. Regras de negócio

A plataforma deve permitir:

- Cadastrar, editar, visualizar e excluir estacionamentos.
- Cadastrar e gerenciar várias vagas dentro de cada estacionamento.
- Identificar cada vaga por um número.
- Definir se uma vaga é simulada ou física.
- Visualizar o status de todas as vagas: ocupada ou disponível.
- Acompanhar indicadores gerais do estacionamento.

### Tipos de vaga

**Simuladas**: estado controlado manualmente pela interface (ocupada ⇄ disponível). Representam as demais vagas durante a demonstração.

**Físicas**: estado controlado **exclusivamente** pelo dispositivo IoT. O sensor detecta presença/ausência, o ESP32 envia a informação à plataforma e a interface atualiza automaticamente.

Exemplo: estacionamento com 50 vagas; as vagas 1 a 49 são simuladas e a vaga 50 é física, ligada ao ESP32 da maquete.

**Regra fundamental:** uma vaga física não pode ter o estado alterado manualmente pela interface.

## 3. Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Nuxt 3 + TypeScript |
| Interface | Nuxt UI + Tailwind CSS |
| Banco | Supabase PostgreSQL |
| Autenticação | Supabase Auth |
| Tempo real | Supabase Realtime |
| IoT | ESP32 via HTTP |
| Processamento IoT | Supabase Edge Functions |

Sem NestJS ou outro backend separado: o Supabase cobre o backend.

## 4. Fluxo IoT

1. O sensor detecta a presença ou ausência de um veículo.
2. O ESP32 interpreta a leitura.
3. O ESP32 envia uma requisição HTTP a uma Supabase Edge Function.
4. A Edge Function valida a autenticação do dispositivo e a associação dele com a vaga.
5. A função atualiza o estado da vaga no PostgreSQL.
6. O Supabase Realtime propaga a alteração.
7. A interface Nuxt atualiza a vaga automaticamente.

Considerar autenticação do dispositivo, validação de dados e tratamento de erros. Nunca expor chaves administrativas do Supabase no frontend ou no ESP32.

## 5. Modelo de dados conceitual

> **Padrão de nomes:** tabelas com prefixo `tbl` + nome em português, sem `_` (ver [CLAUDE.md](../CLAUDE.md)).

| Conceito (original) | Tabela | Campos conceituais |
| --- | --- | --- |
| parking_lots | `tblestacionamentos` | id, name, description, address, created_at, updated_at |
| parking_spots | `tblvagas` | id, parking_lot_id, spot_number, type (simulated/physical), status (available/occupied), last_updated_at, created_at, updated_at |
| iot_devices | `tbldispositivosiot` | id, parking_spot_id, device_identifier, device_token_hash, last_seen_at, is_active, created_at, updated_at |
| histórico (a avaliar) | `tblhistoricovagas` | mudança de estado da vaga, data/hora e origem (interface ou IoT) |

Implementar relacionamentos, índices, validações e políticas de segurança (RLS).

## 6. Identidade visual

Visual moderno, tecnológico, minimalista e profissional, de SaaS premium, baseado em **Glassmorphism**.

**Paleta obrigatória:** `#101010` (preto profundo), `#FFFFFF` (branco), `#C8FF00` (verde-limão neon, destaque). Tons neutros, transparências e variações de opacidade são permitidos; nenhuma outra cor dominante.

**Glassmorphism:** `backdrop-filter: blur()`, fundos `rgba()` translúcidos, bordas discretas com transparência, sombras suaves, gradientes sutis e camadas, sem comprometer a legibilidade.

**Modo escuro:** fundo `#101010`, texto `#FFFFFF`, superfícies escuras translúcidas, bordas brancas com baixa opacidade, destaques em `#C8FF00`.

**Modo claro:** fundo `#FFFFFF`, texto `#101010`, superfícies claras translúcidas, bordas escuras com baixa opacidade, destaques em `#C8FF00`.

**Temas:** alternância acessível na interface, persistência da preferência, respeito à preferência do SO quando não houver escolha salva e prevenção de flash na inicialização. Cores, transparências, superfícies, bordas e sombras centralizadas em variáveis CSS.

## 7. Interface

Experiência de dashboard SaaS: sidebar e header com efeito glass, indicadores de ocupação, cards de métricas, grade de vagas, distinção visual clara entre ocupada/disponível e física/simulada, telas de cadastro e edição, tabelas e formulários modernos, modais, dropdowns e notificações consistentes e layout responsivo (desktop, tablet e celular).

Usar `#C8FF00` estrategicamente (botões principais, indicadores, estados selecionados), nunca como fundo de todos os componentes.

## 8. Diretrizes de desenvolvimento

- Componentes reutilizáveis e arquitetura organizada e escalável.
- Separar responsabilidades: componentes, composables, serviços e integração com o Supabase.
- Evitar duplicação; tipagem adequada.
- Tratar erros e estados de carregamento; validar formulários.
- Acessibilidade, responsividade e consistência visual.
- Sem funcionalidades desnecessárias ou complexidade prematura.
- Analisar a estrutura existente antes de implementar e não substituir arquivos ou configurações sem entender seu propósito.

## 9. Pilares

1. **Funcionalidade:** o gerenciamento de estacionamentos e vagas funciona corretamente.
2. **Integração:** a comunicação ESP32 → Supabase → Nuxt é confiável.
3. **Experiência visual:** identidade premium em Glassmorphism, com temas claro e escuro.
