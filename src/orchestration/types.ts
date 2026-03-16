// Echo-OSINT CrewAI Orchestration
import { Agent, Crew, Task, Process } from 'crewai';
import { ChatOpenAI } from '@langchain/openai';
import { createCollectorRegistry, DefaultCollectorRegistry } from '../collectors';
import CONFIG from '../config';
import { FINDING, RESEARCH_STATE, PLATFORM } from '../types';

/**
 * Initialize the LLM with NVIDIA NIM configuration
 */
export function createLLM() {
  return new ChatOpenAI({
    model: CONFIG.nvidia.model,
    baseUrl: CONFIG.nvidia.baseURL,
    apiKey: CONFIG.nvidia.apiKey,
    temperature: 0.7,
    maxTokens: 4000,
  });
}

/**
 * Create custom tools for OSINT data collection
 */
export function createOSINTTools(registry: DefaultCollectorRegistry) {
  const tools = [];

  // Each platform gets a dedicated tool
  const platforms: PLATFORM[] = ['reddit', 'github', 'hackernews', 'searxng'];

  for (const platform of platforms) {
    const collector = registry.get(platform);
    if (!collector || !collector.isEnabled()) continue;

    // We'll add tool definitions here
    // For now, we'll use direct collection in the agents
  }

  return tools;
}

/**
 * Discovery Agent - Identifies relevant sources and approaches
 */
export function createDiscoveryAgent(llm: any) {
  return new Agent({
    role: 'Intelligence Discovery Specialist',
    goal: 'Identify the most relevant open sources for gathering intelligence on any given topic. Determine the optimal research strategy.',
    backstory: `You are an expert OSINT analyst with deep knowledge of:
- Social media platforms (Reddit, HackerNews, Twitter)
- Developer communities (GitHub, Stack Overflow)
- News sources and RSS feeds
- Metasearch engines

Your specialty is knowing WHERE to find information and HOW to craft effective search strategies. You understand platform-specific nuances and can identify early signals of emerging trends.`,
    tools: [],
    llm,
    verbose: CONFIG.crewai.agents.discovery.verbose ?? true,
    maxIterations: CONFIG.crewai.agents.discovery.max_iterations,
    memory: CONFIG.crewai.agents.discovery.memory,
  });
}

/**
 * Collection Agent - Gathers raw data from identified sources
 */
export function createCollectionAgent(llm: any) {
  return new Agent({
    role: 'Data Collection Specialist',
    goal: 'Efficiently gather comprehensive data from multiple sources. Extract key information while maintaining source attribution.',
    backstory: `You are a master data collector with expertise in:
- Multi-threaded data gathering
- Handling rate limits and API constraints
- Data normalization and formatting
- Maintaining source chain of custody

You know how to gather data at scale while respecting platform limitations. Every piece of data you collect includes proper source attribution.`,
    tools: [],
    llm,
    verbose: true,
    maxIterations: CONFIG.crewai.agents.collector.max_iterations,
    memory: CONFIG.crewai.agents.collector.memory,
  });
}

/**
 * Analysis Agent - Processes and correlates collected data
 */
export function createAnalysisAgent(llm: any) {
  return new Agent({
    role: 'Intelligence Analysis Expert',
    goal: 'Transform raw data into actionable insights. Identify patterns, correlations, and emerging trends across multiple sources.',
    backstory: `You are a senior intelligence analyst with skills in:
- Cross-source correlation analysis
- Pattern recognition in unstructured data
- Sentiment analysis and trend detection
- Temporal relationship mapping

You excel at finding the signal in the noise. When others see disconnected data points, you see the narrative they tell.`,
    tools: [],
    llm,
    verbose: true,
    maxIterations: CONFIG.crewai.agents.analysis.max_iterations,
    memory: CONFIG.crewai.agents.analysis.memory,
  });
}

/**
 * Validation Agent - Verifies and scores findings
 */
export function createValidationAgent(llm: any) {
  return new Agent({
    role: 'Source Validation Specialist',
    goal: 'Verify findings through cross-referencing and assess confidence levels. Ensure information accuracy and identify gaps.',
    backstory: `You are a verification expert focused on:
- Source reliability assessment
- Cross-reference validation
- Hallucination detection in AI-generated content
- Confidence scoring and uncertainty quantification

You never accept information at face value. Every finding must withstand scrutiny. You quantify uncertainty honestly.`,
    tools: [],
    llm,
    verbose: true,
    maxIterations: CONFIG.crewai.agents.validator.max_iterations,
    memory: CONFIG.crewai.agents.validator.memory,
  });
}

/**
 * Synthesis Agent - Produces final intelligence reports
 */
export function createSynthesisAgent(llm: any) {
  return new Agent({
    role: 'Intelligence Synthesis Expert',
    goal: 'Transform validated findings into clear, actionable intelligence reports with predictions and recommendations.',
    backstory: `You are a master reporter who transforms complex analysis into actionable intelligence:
- Executive summary generation
- Predictive modeling from current trends
- Strategic recommendation development
- Clear visualization of complex relationships

Your reports are trusted by decision-makers because they are clear, accurate, and immediately useful.`,
    tools: [],
    llm,
    verbose: true,
    maxIterations: CONFIG.crewai.agents.synthesizer.max_iterations,
    memory: CONFIG.crewai.agents.synthesizer.memory,
  });
}

/**
 * Create the Research Crew - Full orchestration
 */
export function createResearchCrew() {
  const llm = createLLM();
  const registry = createCollectorRegistry();

  // Create agents
  const discoveryAgent = createDiscoveryAgent(llm);
  const collectionAgent = createCollectionAgent(llm);
  const analysisAgent = createAnalysisAgent(llm);
  const validationAgent = createValidationAgent(llm);
  const synthesisAgent = createSynthesisAgent(llm);

  // Create tasks
  const discoveryTask = new Task({
    description: 'Analyze the research query and identify optimal data sources and collection strategies',
    expected_output: 'A research strategy document outlining which sources to query and in what priority',
    agent: discoveryAgent,
  });

  const collectionTask = new Task({
    description: 'Execute data collection from identified sources using the registry',
    expected_output: 'Raw data findings from multiple sources with source attribution',
    agent: collectionAgent,
    context: [discoveryTask],
  });

  const analysisTask = new Task({
    description: 'Analyze collected data to identify patterns, correlations, and trends',
    expected_output: 'Structured analysis with identified patterns, key entities, and trend indicators',
    agent: analysisAgent,
    context: [collectionTask],
  });

  const validationTask = new Task({
    description: 'Validate findings through cross-referencing and assess confidence levels',
    expected_output: 'Validated findings with confidence scores and source reliability assessment',
    agent: validationAgent,
    context: [analysisTask],
  });

  const synthesisTask = new Task({
    description: 'Synthesize validated findings into a comprehensive intelligence report',
    expected_output: 'Final intelligence report with summary, insights, predictions, and recommendations',
    agent: synthesisAgent,
    context: [validationTask],
  });

  // Create the crew
  const crew = new Crew({
    agents: [
      discoveryAgent,
      collectionAgent,
      analysisAgent,
      validationAgent,
      synthesisAgent,
    ],
    tasks: [
      discoveryTask,
      collectionTask,
      analysisTask,
      validationTask,
      synthesisTask,
    ],
    process: Process.hierarchical,
    memory: true,
    verbose: true,
  });

  return { crew, registry };
}