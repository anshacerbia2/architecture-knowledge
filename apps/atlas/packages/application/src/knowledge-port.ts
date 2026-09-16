import type {
  Answer,
  AskInput,
  GraphView,
  RecordView,
  SearchInput,
  SearchOutput,
  Summary,
  SystemStatus,
} from "../../contracts/src/index.js";

export interface KnowledgePort {
  readonly commit: string;
  status(): Promise<SystemStatus>;
  catalog(): Promise<Summary[]>;
  record(id: string): Promise<RecordView>;
  graph(id: string): Promise<GraphView>;
  search(input: SearchInput): Promise<SearchOutput>;
  ask(input: AskInput): Promise<Answer>;
  close(): Promise<void>;
}
