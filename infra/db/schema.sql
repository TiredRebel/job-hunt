--
-- PostgreSQL database dump
--

\restrict ZHZfuPIQCq9SEbbHXRIBUA3Uc9ceYfOBj28znf4veGXUgmAqCJ6bFxcBgzeF8g9

-- Dumped from database version 17.10 (Debian 17.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA core;


--
-- Name: llm; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA llm;


--
-- Name: scraper; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA scraper;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: core; Owner: -
--

CREATE FUNCTION core.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_settings; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.app_settings (
    key text NOT NULL,
    value jsonb NOT NULL
);


--
-- Name: cover_letters; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.cover_letters (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    profile_id integer NOT NULL,
    body_md text NOT NULL,
    model_used text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    edited boolean DEFAULT false NOT NULL
);


--
-- Name: cover_letters_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.cover_letters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cover_letters_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.cover_letters_id_seq OWNED BY core.cover_letters.id;


--
-- Name: job_board_position; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.job_board_position (
    profile_id integer NOT NULL,
    job_id bigint NOT NULL,
    stage text NOT NULL,
    "position" integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: job_matches; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.job_matches (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    profile_id integer NOT NULL,
    score smallint NOT NULL,
    explanation text,
    model_used text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    matched_skills text[] DEFAULT '{}'::text[] NOT NULL,
    missing_skills text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT job_matches_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: job_matches_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.job_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.job_matches_id_seq OWNED BY core.job_matches.id;


--
-- Name: job_reactions; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.job_reactions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    profile_id integer NOT NULL,
    reaction text NOT NULL,
    note text,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT job_reactions_reaction_check CHECK ((reaction = ANY (ARRAY['saved'::text, 'applied'::text, 'viewed_by_employer'::text, 'replied'::text, 'interview'::text, 'test_task'::text, 'offer'::text, 'rejected'::text, 'withdrawn'::text, 'note'::text])))
);


--
-- Name: job_reaction_current; Type: VIEW; Schema: core; Owner: -
--

CREATE VIEW core.job_reaction_current AS
 SELECT DISTINCT ON (job_id, profile_id) job_id,
    profile_id,
    reaction,
    occurred_at
   FROM core.job_reactions
  WHERE (reaction <> 'note'::text)
  ORDER BY job_id, profile_id, occurred_at DESC, id DESC;


--
-- Name: job_reactions_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.job_reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.job_reactions_id_seq OWNED BY core.job_reactions.id;


--
-- Name: jobs; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.jobs (
    id bigint NOT NULL,
    source_id smallint NOT NULL,
    raw_id bigint,
    external_id text NOT NULL,
    url text NOT NULL,
    title text NOT NULL,
    company text,
    description_md text,
    summary text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    red_flags text[] DEFAULT '{}'::text[] NOT NULL,
    salary_min integer,
    salary_max integer,
    salary_currency text,
    seniority text DEFAULT 'unknown'::text NOT NULL,
    remote text DEFAULT 'unknown'::text NOT NULL,
    location text,
    posted_at timestamp with time zone,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    content_hash text,
    status text DEFAULT 'new'::text NOT NULL,
    CONSTRAINT jobs_remote_check CHECK ((remote = ANY (ARRAY['remote'::text, 'hybrid'::text, 'office'::text, 'unknown'::text]))),
    CONSTRAINT jobs_seniority_check CHECK ((seniority = ANY (ARRAY['junior'::text, 'middle'::text, 'senior'::text, 'lead'::text, 'unknown'::text]))),
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['new'::text, 'processed'::text, 'archived'::text, 'hidden'::text])))
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.jobs_id_seq OWNED BY core.jobs.id;


--
-- Name: keyword_dictionaries; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.keyword_dictionaries (
    id integer NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    kind text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    applies_to text[] DEFAULT '{}'::text[] NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    disabled_items text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT keyword_dictionaries_kind_check CHECK ((kind = ANY (ARRAY['search'::text, 'include'::text, 'exclude'::text, 'exclude_employer'::text, 'alias'::text])))
);


--
-- Name: keyword_dictionaries_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.keyword_dictionaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: keyword_dictionaries_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.keyword_dictionaries_id_seq OWNED BY core.keyword_dictionaries.id;


--
-- Name: llm_providers; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.llm_providers (
    id integer NOT NULL,
    slug text NOT NULL,
    kind text NOT NULL,
    base_url text NOT NULL,
    default_model text NOT NULL,
    api_key_env text,
    pipeline_overrides jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    api_key_ciphertext text,
    CONSTRAINT llm_providers_kind_check CHECK ((kind = ANY (ARRAY['ollama'::text, 'openai-compatible'::text, 'anthropic'::text])))
);


--
-- Name: llm_providers_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.llm_providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.llm_providers_id_seq OWNED BY core.llm_providers.id;


--
-- Name: notification_settings; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.notification_settings (
    id integer DEFAULT 1 NOT NULL,
    telegram_enabled boolean DEFAULT false NOT NULL,
    telegram_chat_id text,
    telegram_bot_token_env text DEFAULT 'TELEGRAM_BOT_TOKEN'::text NOT NULL,
    email_enabled boolean DEFAULT false NOT NULL,
    smtp_host text,
    smtp_port integer,
    smtp_user text,
    smtp_password_env text DEFAULT 'SMTP_PASSWORD'::text NOT NULL,
    from_email text,
    to_email text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_settings_id_check CHECK ((id = 1)),
    CONSTRAINT notification_settings_smtp_port_check CHECK (((smtp_port >= 1) AND (smtp_port <= 65535)))
);


--
-- Name: notifications; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.notifications (
    id bigint NOT NULL,
    job_match_id bigint NOT NULL,
    channel text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_channel_check CHECK ((channel = ANY (ARRAY['telegram'::text, 'email'::text])))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.notifications_id_seq OWNED BY core.notifications.id;


--
-- Name: profiles; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.profiles (
    id integer NOT NULL,
    name text NOT NULL,
    cv_md text,
    skills text[] DEFAULT '{}'::text[] NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cv_language text DEFAULT 'en'::text NOT NULL,
    cv_md_by_language jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT profiles_cv_language_check CHECK ((cv_language = ANY (ARRAY['en'::text, 'uk'::text])))
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.profiles_id_seq OWNED BY core.profiles.id;


--
-- Name: sources; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.sources (
    id smallint NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    base_url text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    fetch_strategy text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sources_fetch_strategy_check CHECK ((fetch_strategy = ANY (ARRAY['api'::text, 'crawl4ai'::text, 'agent-browser'::text])))
);


--
-- Name: sources_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.sources_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sources_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.sources_id_seq OWNED BY core.sources.id;


--
-- Name: pipeline_runs; Type: TABLE; Schema: llm; Owner: -
--

CREATE TABLE llm.pipeline_runs (
    id bigint NOT NULL,
    job_id bigint,
    pipeline text NOT NULL,
    provider_slug text NOT NULL,
    model text NOT NULL,
    tokens_in integer,
    tokens_out integer,
    latency_ms integer,
    status text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pipeline_runs_pipeline_check CHECK ((pipeline = ANY (ARRAY['normalize'::text, 'tag'::text, 'match'::text, 'cover_letter'::text]))),
    CONSTRAINT pipeline_runs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text])))
);


--
-- Name: pipeline_runs_id_seq; Type: SEQUENCE; Schema: llm; Owner: -
--

CREATE SEQUENCE llm.pipeline_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pipeline_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: llm; Owner: -
--

ALTER SEQUENCE llm.pipeline_runs_id_seq OWNED BY llm.pipeline_runs.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: jobs_raw; Type: TABLE; Schema: scraper; Owner: -
--

CREATE TABLE scraper.jobs_raw (
    id bigint NOT NULL,
    run_id bigint NOT NULL,
    source_id smallint NOT NULL,
    external_id text NOT NULL,
    url text NOT NULL,
    raw_html text,
    content_hash text NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    processing_status text DEFAULT 'pending'::text NOT NULL,
    processed_at timestamp with time zone,
    process_attempts integer DEFAULT 0 NOT NULL,
    title text NOT NULL,
    posted_at timestamp with time zone,
    CONSTRAINT jobs_raw_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'queued'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: jobs_raw_id_seq; Type: SEQUENCE; Schema: scraper; Owner: -
--

CREATE SEQUENCE scraper.jobs_raw_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_raw_id_seq; Type: SEQUENCE OWNED BY; Schema: scraper; Owner: -
--

ALTER SEQUENCE scraper.jobs_raw_id_seq OWNED BY scraper.jobs_raw.id;


--
-- Name: scrape_runs; Type: TABLE; Schema: scraper; Owner: -
--

CREATE TABLE scraper.scrape_runs (
    id bigint NOT NULL,
    source_id smallint NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    status text DEFAULT 'running'::text NOT NULL,
    stats jsonb DEFAULT '{}'::jsonb NOT NULL,
    error text,
    CONSTRAINT scrape_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'partial'::text, 'failed'::text])))
);


--
-- Name: scrape_runs_id_seq; Type: SEQUENCE; Schema: scraper; Owner: -
--

CREATE SEQUENCE scraper.scrape_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scrape_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: scraper; Owner: -
--

ALTER SEQUENCE scraper.scrape_runs_id_seq OWNED BY scraper.scrape_runs.id;


--
-- Name: cover_letters id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.cover_letters ALTER COLUMN id SET DEFAULT nextval('core.cover_letters_id_seq'::regclass);


--
-- Name: job_matches id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_matches ALTER COLUMN id SET DEFAULT nextval('core.job_matches_id_seq'::regclass);


--
-- Name: job_reactions id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_reactions ALTER COLUMN id SET DEFAULT nextval('core.job_reactions_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.jobs ALTER COLUMN id SET DEFAULT nextval('core.jobs_id_seq'::regclass);


--
-- Name: keyword_dictionaries id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.keyword_dictionaries ALTER COLUMN id SET DEFAULT nextval('core.keyword_dictionaries_id_seq'::regclass);


--
-- Name: llm_providers id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.llm_providers ALTER COLUMN id SET DEFAULT nextval('core.llm_providers_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.notifications ALTER COLUMN id SET DEFAULT nextval('core.notifications_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.profiles ALTER COLUMN id SET DEFAULT nextval('core.profiles_id_seq'::regclass);


--
-- Name: sources id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.sources ALTER COLUMN id SET DEFAULT nextval('core.sources_id_seq'::regclass);


--
-- Name: pipeline_runs id; Type: DEFAULT; Schema: llm; Owner: -
--

ALTER TABLE ONLY llm.pipeline_runs ALTER COLUMN id SET DEFAULT nextval('llm.pipeline_runs_id_seq'::regclass);


--
-- Name: jobs_raw id; Type: DEFAULT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.jobs_raw ALTER COLUMN id SET DEFAULT nextval('scraper.jobs_raw_id_seq'::regclass);


--
-- Name: scrape_runs id; Type: DEFAULT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.scrape_runs ALTER COLUMN id SET DEFAULT nextval('scraper.scrape_runs_id_seq'::regclass);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: cover_letters cover_letters_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.cover_letters
    ADD CONSTRAINT cover_letters_pkey PRIMARY KEY (id);


--
-- Name: job_board_position job_board_position_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_board_position
    ADD CONSTRAINT job_board_position_pkey PRIMARY KEY (profile_id, job_id);


--
-- Name: job_matches job_matches_job_id_profile_id_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_matches
    ADD CONSTRAINT job_matches_job_id_profile_id_key UNIQUE (job_id, profile_id);


--
-- Name: job_matches job_matches_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_matches
    ADD CONSTRAINT job_matches_pkey PRIMARY KEY (id);


--
-- Name: job_reactions job_reactions_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_reactions
    ADD CONSTRAINT job_reactions_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_source_id_external_id_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.jobs
    ADD CONSTRAINT jobs_source_id_external_id_key UNIQUE (source_id, external_id);


--
-- Name: keyword_dictionaries keyword_dictionaries_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.keyword_dictionaries
    ADD CONSTRAINT keyword_dictionaries_pkey PRIMARY KEY (id);


--
-- Name: keyword_dictionaries keyword_dictionaries_slug_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.keyword_dictionaries
    ADD CONSTRAINT keyword_dictionaries_slug_key UNIQUE (slug);


--
-- Name: llm_providers llm_providers_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.llm_providers
    ADD CONSTRAINT llm_providers_pkey PRIMARY KEY (id);


--
-- Name: llm_providers llm_providers_slug_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.llm_providers
    ADD CONSTRAINT llm_providers_slug_key UNIQUE (slug);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_job_match_id_channel_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.notifications
    ADD CONSTRAINT notifications_job_match_id_channel_key UNIQUE (job_match_id, channel);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_name_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.profiles
    ADD CONSTRAINT profiles_name_key UNIQUE (name);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: sources sources_slug_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.sources
    ADD CONSTRAINT sources_slug_key UNIQUE (slug);


--
-- Name: cover_letters uq_cover_letters_job_profile; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.cover_letters
    ADD CONSTRAINT uq_cover_letters_job_profile UNIQUE (job_id, profile_id);


--
-- Name: pipeline_runs pipeline_runs_pkey; Type: CONSTRAINT; Schema: llm; Owner: -
--

ALTER TABLE ONLY llm.pipeline_runs
    ADD CONSTRAINT pipeline_runs_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: jobs_raw jobs_raw_pkey; Type: CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.jobs_raw
    ADD CONSTRAINT jobs_raw_pkey PRIMARY KEY (id);


--
-- Name: jobs_raw jobs_raw_source_id_external_id_content_hash_key; Type: CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.jobs_raw
    ADD CONSTRAINT jobs_raw_source_id_external_id_content_hash_key UNIQUE (source_id, external_id, content_hash);


--
-- Name: scrape_runs scrape_runs_pkey; Type: CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.scrape_runs
    ADD CONSTRAINT scrape_runs_pkey PRIMARY KEY (id);


--
-- Name: idx_job_matches_score; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_job_matches_score ON core.job_matches USING btree (score DESC);


--
-- Name: idx_job_reactions_timeline; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_job_reactions_timeline ON core.job_reactions USING btree (job_id, profile_id, occurred_at DESC);


--
-- Name: idx_jobs_first_seen_at; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_jobs_first_seen_at ON core.jobs USING btree (first_seen_at DESC);


--
-- Name: idx_jobs_fts; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_jobs_fts ON core.jobs USING gin (to_tsvector('simple'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(company, ''::text)) || ' '::text) || COALESCE(summary, ''::text))));


--
-- Name: idx_jobs_posted_at; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_jobs_posted_at ON core.jobs USING btree (posted_at DESC);


--
-- Name: idx_jobs_status_last_seen; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_jobs_status_last_seen ON core.jobs USING btree (status, last_seen_at DESC);


--
-- Name: idx_jobs_tags; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX idx_jobs_tags ON core.jobs USING gin (tags);


--
-- Name: idx_llm_providers_one_active; Type: INDEX; Schema: core; Owner: -
--

CREATE UNIQUE INDEX idx_llm_providers_one_active ON core.llm_providers USING btree ((true)) WHERE is_active;


--
-- Name: idx_profiles_one_active; Type: INDEX; Schema: core; Owner: -
--

CREATE UNIQUE INDEX idx_profiles_one_active ON core.profiles USING btree ((true)) WHERE is_active;


--
-- Name: job_board_position_profile_stage_position_idx; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX job_board_position_profile_stage_position_idx ON core.job_board_position USING btree (profile_id, stage, "position");


--
-- Name: idx_jobs_raw_processing_status; Type: INDEX; Schema: scraper; Owner: -
--

CREATE INDEX idx_jobs_raw_processing_status ON scraper.jobs_raw USING btree (processing_status);


--
-- Name: idx_jobs_raw_unprocessed; Type: INDEX; Schema: scraper; Owner: -
--

CREATE INDEX idx_jobs_raw_unprocessed ON scraper.jobs_raw USING btree (fetched_at) WHERE (processing_status = ANY (ARRAY['pending'::text, 'queued'::text]));


--
-- Name: cover_letters trg_cover_letters_updated_at; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_cover_letters_updated_at BEFORE UPDATE ON core.cover_letters FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


--
-- Name: keyword_dictionaries trg_keyword_dictionaries_updated_at; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_keyword_dictionaries_updated_at BEFORE UPDATE ON core.keyword_dictionaries FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


--
-- Name: llm_providers trg_llm_providers_updated_at; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_llm_providers_updated_at BEFORE UPDATE ON core.llm_providers FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON core.profiles FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


--
-- Name: sources trg_sources_updated_at; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_sources_updated_at BEFORE UPDATE ON core.sources FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


--
-- Name: cover_letters cover_letters_job_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.cover_letters
    ADD CONSTRAINT cover_letters_job_id_fkey FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;


--
-- Name: cover_letters cover_letters_profile_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.cover_letters
    ADD CONSTRAINT cover_letters_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES core.profiles(id) ON DELETE CASCADE;


--
-- Name: job_board_position job_board_position_job_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_board_position
    ADD CONSTRAINT job_board_position_job_id_fkey FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;


--
-- Name: job_board_position job_board_position_profile_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_board_position
    ADD CONSTRAINT job_board_position_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES core.profiles(id) ON DELETE CASCADE;


--
-- Name: job_matches job_matches_job_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_matches
    ADD CONSTRAINT job_matches_job_id_fkey FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;


--
-- Name: job_matches job_matches_profile_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_matches
    ADD CONSTRAINT job_matches_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES core.profiles(id) ON DELETE CASCADE;


--
-- Name: job_reactions job_reactions_job_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_reactions
    ADD CONSTRAINT job_reactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;


--
-- Name: job_reactions job_reactions_profile_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.job_reactions
    ADD CONSTRAINT job_reactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES core.profiles(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_raw_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.jobs
    ADD CONSTRAINT jobs_raw_id_fkey FOREIGN KEY (raw_id) REFERENCES scraper.jobs_raw(id);


--
-- Name: jobs jobs_source_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.jobs
    ADD CONSTRAINT jobs_source_id_fkey FOREIGN KEY (source_id) REFERENCES core.sources(id);


--
-- Name: notifications notifications_job_match_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.notifications
    ADD CONSTRAINT notifications_job_match_id_fkey FOREIGN KEY (job_match_id) REFERENCES core.job_matches(id) ON DELETE CASCADE;


--
-- Name: pipeline_runs pipeline_runs_job_id_fkey; Type: FK CONSTRAINT; Schema: llm; Owner: -
--

ALTER TABLE ONLY llm.pipeline_runs
    ADD CONSTRAINT pipeline_runs_job_id_fkey FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE SET NULL;


--
-- Name: jobs_raw jobs_raw_run_id_fkey; Type: FK CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.jobs_raw
    ADD CONSTRAINT jobs_raw_run_id_fkey FOREIGN KEY (run_id) REFERENCES scraper.scrape_runs(id);


--
-- Name: jobs_raw jobs_raw_source_id_fkey; Type: FK CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.jobs_raw
    ADD CONSTRAINT jobs_raw_source_id_fkey FOREIGN KEY (source_id) REFERENCES core.sources(id);


--
-- Name: scrape_runs scrape_runs_source_id_fkey; Type: FK CONSTRAINT; Schema: scraper; Owner: -
--

ALTER TABLE ONLY scraper.scrape_runs
    ADD CONSTRAINT scrape_runs_source_id_fkey FOREIGN KEY (source_id) REFERENCES core.sources(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ZHZfuPIQCq9SEbbHXRIBUA3Uc9ceYfOBj28znf4veGXUgmAqCJ6bFxcBgzeF8g9
