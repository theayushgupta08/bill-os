# Chapter 4 — AI Features

> Back to [Index](./README.md) | Prev ← [Product Features](./03-product-features.md) | Next → [Tech Stack](./05-tech-stack.md)

---

## 4.1 AI Copilot `[P3]`

### Overview

The AI Copilot is a **conversational business assistant** embedded throughout billOS. It uses LangGraph to orchestrate multi-step reasoning, Claude as the primary LLM, and RAG (Retrieval-Augmented Generation) to ground responses in the organization's actual data.

### Capabilities

| Capability | Example Prompts | Implementation |
|-----------|----------------|----------------|
| **Data Query** | "What were my total sales in June?" | SQL generation → execute → format response |
| **Entity Lookup** | "Show me Rajesh Traders' outstanding balance" | Customer search → ledger retrieval |
| **Action Execution** | "Create a new invoice for Priya Electronics" | Form pre-fill → user confirms → create |
| **Insight Generation** | "Which products are selling the fastest?" | Analytics query → trend analysis → natural language |
| **Advice** | "Should I extend credit to this customer?" | Credit history + payment patterns → recommendation |
| **Comparison** | "Compare this month's sales vs last month" | Multi-query → compute delta → visualize |
| **Explanation** | "Explain my GST liability for this quarter" | Tax computation → breakdown → plain language |

### Architecture

```
┌───────────────────────────────────────────────────┐
│                  AI Copilot Agent                  │
│               (LangGraph State Machine)           │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌───────────┐    ┌────────────┐   ┌──────────┐  │
│  │  Router   │───▶│  Planner   │──▶│ Executor │  │
│  │  Node     │    │  Node      │   │ Node     │  │
│  └───────────┘    └────────────┘   └──────────┘  │
│       │                                  │        │
│       ▼                                  ▼        │
│  ┌───────────┐                  ┌──────────────┐  │
│  │  RAG      │                  │   Tool       │  │
│  │  Retriever│                  │   Executor   │  │
│  └───────────┘                  └──────────────┘  │
│                                      │            │
│                          ┌───────────┼──────────┐ │
│                          ▼           ▼          ▼ │
│                     ┌────────┐ ┌────────┐ ┌──────┐│
│                     │SQL Tool│ │API Tool│ │Search ││
│                     └────────┘ └────────┘ └──────┘│
│                                                   │
└───────────────────────────────────────────────────┘
```

### Conversation Memory

| Layer | Storage | Purpose |
|-------|---------|---------|
| **Short-term** | In-memory (per session) | Current conversation context |
| **Session History** | PostgreSQL | Full chat history per session |
| **Organization Context** | pgvector | Embedded business documents + knowledge |
| **User Preferences** | PostgreSQL | Preferred formats, frequently asked queries |

### Guardrails

| Guard | Description |
|-------|-------------|
| **Tenant Isolation** | All tool calls include `organization_id` — AI cannot access other tenants' data |
| **Permission Check** | AI actions respect the user's RBAC permissions |
| **SQL Injection Prevention** | SQL generation uses parameterized queries only |
| **PII Masking** | Sensitive data (bank details, PAN) masked in AI responses |
| **Action Confirmation** | Destructive actions (delete, void, edit) require explicit user confirmation |
| **Hallucination Mitigation** | All data responses cite source records; "I don't know" for uncertain answers |
| **Token Budget** | Max 4096 output tokens per response; streaming for longer outputs |
| **Rate Limiting** | 30 AI requests/minute per user, 200/minute per organization |

---

## 4.2 Invoice OCR `[P3]`

### Pipeline

```
Upload Image/PDF → Preprocessing → Claude Vision API → Structured Extraction
→ Validation → Review Screen (user confirms/edits) → Create Invoice/Purchase
```

### Extraction Schema

| Field | Extraction Method |
|-------|------------------|
| Supplier/Customer Name | Text extraction + entity matching |
| GSTIN | Regex + GSTIN validation |
| Invoice Number | Pattern matching |
| Invoice Date | Date parsing (multiple Indian formats) |
| Line Items | Table extraction (product, qty, rate, amount) |
| HSN Codes | Numeric extraction + HSN database validation |
| Tax Details | CGST/SGST/IGST amount extraction |
| Total Amount | Sum validation against line items |
| Bank Details | Conditional extraction |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Field-level accuracy | ≥ 95% |
| End-to-end (no human correction needed) | ≥ 85% |
| Processing time | < 10 seconds per document |
| Supported formats | JPEG, PNG, PDF (first 10 pages) |
| Max file size | 10 MB |

---

## 4.3 Receipt OCR `[P3]`

Similar to Invoice OCR but optimized for **expense receipts**:
- Smaller documents, less structured
- Extract: Vendor name, date, total amount, category suggestion
- Auto-categorize into expense categories using AI
- Mobile camera capture → instant processing

---

## 4.4 Business Chat `[P3]`

An organization-scoped **RAG-powered knowledge base chat**:

| Feature | Description |
|---------|-------------|
| **Data Sources** | Invoices, products, customers, transactions, uploaded documents |
| **Embedding Model** | `text-embedding-3-small` (OpenAI) or equivalent |
| **Vector Store** | pgvector (Supabase PostgreSQL) |
| **Chunk Strategy** | Semantic chunking, 512 tokens per chunk, 50-token overlap |
| **Retrieval** | Top-k=5 with MMR (Maximal Marginal Relevance) for diversity |
| **Reranking** | Cross-encoder reranking for precision |
| **Citation** | Every response includes source references (invoice #, customer name, etc.) |

---

## 4.5 Smart Search `[P3]`

Natural language search across all billOS data:

| Query | Resolution |
|-------|-----------|
| "Invoices above 50k in January" | → Filter: amount > 50000 AND date IN January |
| "Rajesh's pending amount" | → Customer lookup → outstanding balance |
| "Products running low" | → Stock < reorder level |
| "Unpaid bills from last month" | → Invoices with status ≠ PAID AND date in last month |
| "Find HP printer cartridge" | → Product search (fuzzy match + semantic) |

### Implementation

```
Natural Language Input → LLM Intent Classification
→ One of:
   ├── SQL Generation → Execute → Return results
   ├── API Call → Execute → Return results
   ├── Vector Search → pgvector → Return ranked results
   └── Hybrid (SQL + Vector) → Merge → Return results
```

---

## 4.6 AI Analytics `[P3.5]`

Automated insights generated without user prompting:

| Insight Type | Description | Frequency |
|-------------|-------------|-----------|
| **Anomaly Detection** | Unusual spending, sales spike/drop, suspicious transactions | Daily |
| **Trend Identification** | Rising/falling product demand, seasonal patterns | Weekly |
| **Cash Flow Prediction** | Next 30/60/90 day projected cash position | Weekly |
| **Performance Summary** | AI-generated executive summary of the week/month | Weekly/Monthly |
| **Action Recommendations** | "Reorder Product X within 5 days", "Follow up with Customer Y" | Daily |

---

## 4.7 Inventory Prediction `[P3.5]`

| Feature | Description |
|---------|-------------|
| **Demand Forecasting** | Predict next 30/60/90-day demand per product using historical sales |
| **Reorder Suggestions** | "Order 200 units of Product X by next Thursday" |
| **Seasonal Adjustment** | Factor in festive seasons (Diwali, Navratri), regional events |
| **Stockout Risk** | Probability of stockout in next N days |
| **Overstock Detection** | Flag slow-moving inventory tying up capital |

### Model

- Time-series forecasting (Prophet or custom LSTM)
- Features: historical sales, day of week, month, promotions, seasons
- Retrained monthly per organization
- Minimum data: 3 months of sales history

---

## 4.8 Sales Forecast `[P3.5]`

| Feature | Description |
|---------|-------------|
| **Revenue Projection** | Next month/quarter/year estimated revenue |
| **Growth Rate** | Month-over-month and year-over-year trends |
| **Customer Lifetime Value** | Predict CLV based on purchase patterns |
| **Churn Risk** | Flag customers with declining purchase frequency |
| **Pipeline Value** | Total value of open quotations/orders |

---

## 4.9 Expense Categorization `[P3]`

| Feature | Description |
|---------|-------------|
| **Auto-categorize** | Map expense to category using vendor name + amount pattern |
| **Learn from corrections** | Fine-tune categorization based on user edits |
| **Budget alerts** | "You've spent 85% of your Rent budget this month" |
| **Tax implications** | Flag expenses eligible for tax deduction |

---

## 4.10 Business Health Score `[P3.5]`

A single composite score (0–100) reflecting overall business health:

```
Business Health Score = weighted_sum(
  Cash Flow Health      (25%):  Current ratio, quick ratio, days cash on hand
  Revenue Health        (25%):  Revenue trend, growth rate, customer concentration
  Inventory Health      (20%):  Turnover ratio, dead stock %, stockout frequency
  Receivables Health    (15%):  DSO (Days Sales Outstanding), aging profile
  Profitability Health  (15%):  Gross margin trend, expense ratio
)
```

**Presentation:**
- Dashboard card with score + trend arrow
- AI-generated plain-language summary: "Your business health is Good (78/100). Cash flow is strong but receivables are aging — consider following up on 5 overdue invoices totaling ₹2.3L."

---

## 4.11 AI Recommendation Engine `[P3.5]`

| Recommendation | Data Used | Output |
|---------------|-----------|--------|
| **Pricing** | Competitor pricing, demand elasticity, margin analysis | "Consider increasing price of Product X by 5% — demand is inelastic" |
| **Credit Limit** | Customer payment history, outstanding, revenue contribution | "Suggest increasing credit limit for Customer Y to ₹5L based on consistent payment" |
| **Supplier Selection** | Price history, delivery reliability, quality issues | "Supplier A offers 8% lower prices but Supplier B has 98% on-time delivery" |
| **Discount** | Customer value, margin, inventory age | "Offer 10% discount on slow-moving SKUs to free ₹3L capital" |

---

## 4.12 AI Document Understanding `[P4]`

Parse **any business document** and extract structured data:
- Purchase orders from suppliers (PDF/image)
- Bank statements (PDF → transaction list)
- Contracts (key terms extraction)
- Government notices (compliance action items)

---

## 4.13 AI Knowledge Base `[P4]`

Organization-specific knowledge base built from:
- Uploaded documents (policies, manuals, contracts)
- Transaction history
- Customer/supplier communications
- Internal notes

Users can chat with their knowledge base: "What are our payment terms with Reliance?"

---

> **Next:** [Chapter 5 — Tech Stack](./05-tech-stack.md)
