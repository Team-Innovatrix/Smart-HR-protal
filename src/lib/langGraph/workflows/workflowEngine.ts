// Declarative workflow engine that executes workflow definitions

import type { VoiceCommandState, NodeOutput, NodeInput } from "../types/state";
import { updateNodeStatus } from "../types/state";
import { logger } from "../utils/logger";
import type { LangGraphNode } from "../index";

// Use the existing LangGraphNode interface for compatibility
export type WorkflowNode = LangGraphNode;

// Condition function type
export type ConditionFunction = (state: VoiceCommandState) => boolean;

// Edge definition with optional guard condition
export interface WorkflowEdge {
  from: string;
  to: string;
  guard?: ConditionFunction;
  label?: string;  // For logging/debugging
}

// Workflow definition
export interface WorkflowDefinition {
  nodes: Map<string, WorkflowNode>;
  edges: WorkflowEdge[];
  startNode: string;
  endNodes: string[];
}

// Node execution result with routing decision
export interface NodeExecutionResult {
  state: VoiceCommandState;
  nextNode: string | null;  // null means workflow complete
  shouldExit: boolean;      // true means exit early (e.g., incomplete data)
}

/**
 * Executes a single node with proper state management
 */
async function executeNode(
  node: WorkflowNode,
  state: VoiceCommandState,
  sessionId: string,
  workflowName: string,
  stepNumber: number
): Promise<NodeOutput<VoiceCommandState>> {
  const nodeId = node.id;
  
  logger.nodeStart(sessionId, nodeId, workflowName, stepNumber, state);
  const startTime = Date.now();

  // Update state to show node is running
  const runningState = updateNodeStatus(state, nodeId, 'running');
  
  // Execute the node with proper input format
  let nodeInput;
  if (nodeId === 'intent_extraction') {
    // Intent extraction expects { text: string }
    const text = runningState.messages?.[0]?.content || '';
    nodeInput = { value: { text }, state: runningState };
  } else {
    // Other nodes expect the state as value
    nodeInput = { value: runningState, state: runningState };
  }
  
  const result = await node.execute(nodeInput) as NodeOutput<VoiceCommandState>;

  // Update state to show node completed
  const completedState = updateNodeStatus(
    result.state, 
    nodeId, 
    'completed',
    undefined,
    { duration: Date.now() - startTime }
  );
  
  logger.nodeComplete(sessionId, nodeId, workflowName, stepNumber, result.value, Date.now() - startTime);

  return {
    value: result.value,
    state: completedState
  };
}

/**
 * Finds the next node based on edges and guard conditions
 */
function findNextNode(
  currentNodeId: string,
  state: VoiceCommandState,
  edges: WorkflowEdge[],
  sessionId: string
): string | null {
  const possibleEdges = edges.filter(edge => edge.from === currentNodeId);
  
  // Try each edge in order, checking guards
  for (const edge of possibleEdges) {
    if (!edge.guard || edge.guard(state)) {
      logger.info(`Routing: ${currentNodeId} → ${edge.to}${edge.label ? ` (${edge.label})` : ''}`, { sessionId });
      return edge.to;
    }
  }
  
  // No matching edge found
  logger.info(`No matching edge from ${currentNodeId}, workflow complete`, { sessionId });
  return null;
}

/**
 * Validates state structure
 */
function validateState(state: VoiceCommandState, nodeId: string): void {
  if (!state.sessionId) {
    throw new Error(`Invalid state after ${nodeId}: missing sessionId`);
  }
  if (!state.userId) {
    throw new Error(`Invalid state after ${nodeId}: missing userId`);
  }
  if (state.currentIntent === undefined) {
    throw new Error(`Invalid state after ${nodeId}: missing currentIntent`);
  }
}

/**
 * Main workflow engine that executes a declarative workflow
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  initialState: VoiceCommandState,
  workflowName: string = 'workflow'
): Promise<NodeOutput<VoiceCommandState>> {
  const sessionId = initialState.sessionId;
  
  try {
    logger.sessionStart(sessionId, undefined, workflowName);
    
    let currentState = initialState;
    let currentNodeId: string | null = workflow.startNode;
    let stepNumber = 1;
    
    // Execute nodes until we reach an end node or no next node
    while (currentNodeId) {
      const node = workflow.nodes.get(currentNodeId);
      
      if (!node) {
        throw new Error(`Node '${currentNodeId}' not found in workflow`);
      }
      
      // Execute the node
      const result = await executeNode(
        node,
        currentState,
        sessionId,
        workflowName,
        stepNumber
      );
      
      // Validate state
      validateState(result.state, currentNodeId);
      
      // Update current state
      currentState = result.state;
      
      // Check if this is an end node
      if (workflow.endNodes.includes(currentNodeId)) {
        logger.info(`Reached end node: ${currentNodeId}`, { sessionId });
        break;
      }
      
      // Find next node based on edges and guards
      const nextNodeId = findNextNode(currentNodeId, currentState, workflow.edges, sessionId);
      
      if (!nextNodeId) {
        // No next node found, workflow complete
        break;
      }
      
      currentNodeId = nextNodeId;
      stepNumber++;
      
      // Safety check to prevent infinite loops
      if (stepNumber > 20) {
        throw new Error(`Workflow exceeded maximum steps (20). Possible infinite loop.`);
      }
    }
    
    logger.workflowComplete(sessionId, workflowName, undefined, currentState);
    
    return {
      value: currentState,
      state: currentState
    };
    
  } catch (error) {
    logger.workflowError(sessionId, workflowName, error as Error);
    
    // Return state with error information for graceful degradation
    const errorState: VoiceCommandState = {
      ...initialState,
      error: (error as Error).message,
      isComplete: false,
      nodeStatus: 'error'
    };
    
    return {
      value: errorState,
      state: errorState
    };
  }
}

