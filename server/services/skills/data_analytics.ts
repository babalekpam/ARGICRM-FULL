import { BusinessSkill } from "./types.js";

export const DATA_SKILLS: BusinessSkill[] = [
  {
    id: "kpi-framework",
    name: "KPI Framework Design",
    domain: "data_analytics",
    description: "Design a complete KPI framework for any department",
    prompt: `Design a KPI framework for the {{department}} department at {{company}}.

Department focus: {{focus}}
Team size: {{team_size}}
Business stage: {{stage}}
Current reporting: {{current_reporting}}

KPI Framework:
1. North Star Metric (single metric capturing core value)

2. L1 Metrics (company-level, 3-5)
3. L2 Metrics by function (10-15)
4. L3 Metrics by team (leading indicators)

For each KPI:
- Definition (exactly how calculated)
- Data source
- Measurement frequency
- Owner
- Target (current and 12-month)
- Red/Yellow/Green thresholds
- How to influence it

5. Metric relationships (leading vs lagging)
6. Dashboard structure recommendation
7. Review cadence (daily/weekly/monthly)
8. Common gaming risks and guardrails`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "department",
        label: "Department",
        type: "text",
        required: true,
        placeholder: "Marketing, Sales, Engineering, Finance",
      },
      {
        name: "focus",
        label: "Department focus",
        type: "text",
        required: true,
        placeholder: "Revenue growth, customer retention, product shipping",
      },
      {
        name: "team_size",
        label: "Team size",
        type: "number",
        required: false,
      },
      {
        name: "stage",
        label: "Business stage",
        type: "select",
        required: true,
        options: ["Pre-revenue", "Early stage", "Growth", "Scale", "Enterprise"],
      },
      {
        name: "current_reporting",
        label: "Current reporting tools",
        type: "text",
        required: false,
        placeholder: "Google Sheets, Looker, Tableau, None",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["oracle", "aria"],
    tags: ["KPIs", "metrics", "analytics", "OKR"],
    estimatedTokens: 700,
  },
  {
    id: "sql-query-builder",
    name: "SQL Query Design",
    domain: "data_analytics",
    description: "Write optimized SQL queries for any analysis",
    prompt: `Write optimized SQL queries for: {{analysis_goal}}

Database: {{database}}
Tables available: {{tables}}
Relationships: {{relationships}}
Time range: {{time_range}}
Output format needed: {{output_format}}
Performance requirements: {{performance}}

Deliver:
1. Main query with inline comments explaining logic
2. Query explanation (what it does, step by step)
3. Index recommendations for performance
4. Alternative approaches (if multiple ways)
5. Common pitfalls with this query pattern
6. How to test the query correctness
7. Dashboard/BI tool integration notes

Query should handle:
- NULL values appropriately
- Edge cases (empty sets, division by zero)
- Time zone considerations (if applicable)`,
    inputs: [
      {
        name: "analysis_goal",
        label: "What you want to analyze",
        type: "text",
        required: true,
        placeholder: "Monthly revenue by customer segment",
      },
      {
        name: "database",
        label: "Database",
        type: "select",
        required: true,
        options: ["PostgreSQL", "MySQL", "BigQuery", "Snowflake", "Redshift", "SQLite", "SQL Server"],
      },
      {
        name: "tables",
        label: "Available tables + key columns",
        type: "textarea",
        required: true,
        placeholder: "orders(id, customer_id, amount, created_at), customers(id, plan, country)",
      },
      {
        name: "relationships",
        label: "Key relationships",
        type: "text",
        required: true,
        placeholder: "orders.customer_id = customers.id",
      },
      {
        name: "time_range",
        label: "Time range",
        type: "text",
        required: true,
        placeholder: "Last 12 months",
      },
      {
        name: "output_format",
        label: "Required output format",
        type: "text",
        required: true,
        placeholder: "One row per month with revenue and count",
      },
      {
        name: "performance",
        label: "Performance requirement",
        type: "text",
        required: false,
        placeholder: "Must run in < 30 seconds on 100M rows",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["oracle", "forge"],
    tags: ["SQL", "database", "analytics", "query"],
    estimatedTokens: 500,
  },
  {
    id: "ab-test-design",
    name: "A/B Test Design",
    domain: "data_analytics",
    description: "Design a statistically rigorous A/B test",
    prompt: `Design an A/B test for: {{test_goal}}

Product area: {{product_area}}
Hypothesis: {{hypothesis}}
Primary metric: {{primary_metric}}
Secondary metrics: {{secondary_metrics}}
Current baseline: {{baseline}}
Minimum detectable effect: {{mde}}
Traffic available: {{traffic}}

A/B Test Design:
1. Hypothesis statement (If we do X, then Y will improve by Z because of W)
2. Statistical design
   - Sample size calculation
   - Test duration estimate (days)
   - Statistical significance threshold (α = 0.05)
   - Power (β = 0.20, 80% power)
   - Multiple testing correction (if needed)
3. Experiment setup
   - Randomization unit (user, session, device)
   - Assignment method
   - Control vs treatment split
   - Holdout group (if needed)
4. Variants specification (control + treatment(s))
5. Guardrail metrics (what not to harm)
6. Data collection plan
7. Pre-experiment checklist (novelty effect, SRM check)
8. Analysis plan (when to call it, how to analyze)
9. Decision criteria (when to ship, hold, or kill)`,
    inputs: [
      {
        name: "test_goal",
        label: "What you want to test",
        type: "text",
        required: true,
        placeholder: "New checkout flow vs existing",
      },
      {
        name: "product_area",
        label: "Product area",
        type: "text",
        required: true,
        placeholder: "Checkout, onboarding, homepage",
      },
      {
        name: "hypothesis",
        label: "Your hypothesis",
        type: "text",
        required: true,
        placeholder: "Reducing form fields will increase completion rate",
      },
      {
        name: "primary_metric",
        label: "Primary success metric",
        type: "text",
        required: true,
        placeholder: "Checkout completion rate",
      },
      {
        name: "secondary_metrics",
        label: "Secondary metrics",
        type: "text",
        required: false,
        placeholder: "Revenue per user, time on page",
      },
      {
        name: "baseline",
        label: "Current baseline value",
        type: "text",
        required: true,
        placeholder: "40% checkout completion",
      },
      {
        name: "mde",
        label: "Minimum detectable effect",
        type: "text",
        required: true,
        placeholder: "5% relative improvement",
      },
      {
        name: "traffic",
        label: "Daily eligible traffic",
        type: "text",
        required: true,
        placeholder: "10,000 unique users/day",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["oracle", "vision"],
    tags: ["A/B test", "experimentation", "statistics", "product analytics"],
    estimatedTokens: 700,
  },
  {
    id: "data-pipeline-design",
    name: "Data Pipeline Architecture",
    domain: "data_analytics",
    description: "Design a modern data pipeline",
    prompt: `Design a data pipeline architecture for {{company}}.

Data sources: {{sources}}
Data volume: {{volume}}
Latency requirement: {{latency}}
Current stack: {{current_stack}}
Budget: {{budget}}
Use cases: {{use_cases}}

Pipeline Architecture:
1. Architecture pattern recommendation
   - Lambda (batch + streaming)
   - Kappa (streaming only)
   - ELT vs ETL

2. Ingestion Layer
   - Source connectors
   - CDC for databases
   - Event streaming (Kafka/Kinesis/PubSub)
   - Batch ingestion schedule

3. Storage Layer
   - Data Lake design (zones: raw, processed, curated)
   - Data Warehouse recommendation
   - Data Lakehouse consideration

4. Transformation Layer
   - dbt models structure
   - Orchestration (Airflow, Prefect, Dagster)
   - Testing strategy

5. Serving Layer
   - BI tool connection
   - API for applications
   - ML feature store

6. Data Quality & Observability
   - Data contracts
   - Monitoring (Great Expectations, Monte Carlo)

7. Governance
   - Lineage tracking
   - Access control
   - PII handling

8. Tool recommendations + cost estimate
9. Migration plan from current state`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "sources",
        label: "Data sources",
        type: "textarea",
        required: true,
        placeholder: "PostgreSQL prod DB, Stripe, Salesforce, GA4, Segment",
      },
      {
        name: "volume",
        label: "Data volume",
        type: "text",
        required: true,
        placeholder: "10GB/day, 100M events/month",
      },
      {
        name: "latency",
        label: "Latency requirement",
        type: "select",
        required: true,
        options: ["Real-time (< 1 min)", "Near real-time (< 15 min)", "Hourly", "Daily batch"],
      },
      {
        name: "current_stack",
        label: "Current data stack",
        type: "text",
        required: false,
        placeholder: "None, or Redshift + Tableau",
      },
      {
        name: "budget",
        label: "Monthly budget for data infrastructure",
        type: "text",
        required: false,
        placeholder: "$2,000/month",
      },
      {
        name: "use_cases",
        label: "Key use cases",
        type: "textarea",
        required: true,
        placeholder: "Executive dashboards, ML model training, customer analytics",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["oracle", "forge"],
    tags: ["data pipeline", "data engineering", "ETL", "analytics"],
    estimatedTokens: 800,
  },
  {
    id: "ml-strategy",
    name: "Machine Learning Strategy",
    domain: "data_analytics",
    description: "Design an ML strategy for any business problem",
    prompt: `Design an ML strategy for {{company}} to solve: {{problem}}

Data available: {{data}}
Team ML maturity: {{maturity}}
Business impact goal: {{impact}}
Timeline: {{timeline}}
Infrastructure: {{infrastructure}}

ML Strategy:
1. Problem framing
   - Business problem → ML problem type
   - Supervised/unsupervised/RL recommendation
   - Success metric definition

2. Data Assessment
   - Data availability and quality
   - Labeling requirements and cost
   - Data augmentation opportunities
   - Privacy/compliance considerations

3. Model Selection Framework
   - Baseline model (simple, interpretable)
   - Candidate models (2-3 options)
   - Build vs buy vs use foundation models
   - Trade-offs (accuracy vs speed vs cost vs interpretability)

4. MLOps Architecture
   - Training pipeline
   - Feature store design
   - Model registry
   - Serving infrastructure
   - Monitoring (drift, performance)

5. Evaluation Framework
   - Offline metrics
   - Online evaluation (A/B test design)
   - Business metrics connection

6. Deployment Strategy (shadow mode, canary, full)
7. Team & skill requirements
8. 90-day pilot plan
9. ROI calculation`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "problem",
        label: "Business problem to solve",
        type: "textarea",
        required: true,
        placeholder: "Predict which customers will churn in next 30 days",
      },
      {
        name: "data",
        label: "Data available",
        type: "textarea",
        required: true,
        placeholder: "3 years of transaction data, 500k customers, clickstream",
      },
      {
        name: "maturity",
        label: "Team ML maturity",
        type: "select",
        required: true,
        options: ["No ML experience", "Some Python/data science", "Production ML deployed", "Advanced ML team"],
      },
      {
        name: "impact",
        label: "Business impact goal",
        type: "text",
        required: true,
        placeholder: "Reduce churn by 20%, save $2M ARR",
      },
      {
        name: "timeline",
        label: "Timeline",
        type: "text",
        required: true,
        placeholder: "MVP in 3 months, production in 6",
      },
      {
        name: "infrastructure",
        label: "Current infrastructure",
        type: "text",
        required: false,
        placeholder: "AWS, already have data warehouse",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["oracle", "forge", "vision"],
    tags: ["machine learning", "ML strategy", "AI", "data science"],
    estimatedTokens: 900,
  },
];
