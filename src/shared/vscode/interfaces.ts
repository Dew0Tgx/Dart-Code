import { CompletionItem, DebugSession, DebugSessionCustomEvent, MarkdownString, TextDocument, TreeDataProvider, TreeItem, Uri } from "vscode";
import { AvailableSuggestion, FlutterOutline, Outline } from "../analysis_server_types";
import { Analyzer } from "../analyzer";
import { TestStatus, VersionStatus, VmService, VmServiceExtension } from "../enums";
import { WebClient } from "../fetch";
import { CustomScript, SpawnedProcess } from "../interfaces";
import { EmittingLogger } from "../logging";
import { WorkspaceContext } from "../workspace";
import { Context } from "./workspace";

export interface DebugCommandHandler {
	vmServices: {
		serviceIsRegistered(service: VmService): boolean;
		serviceExtensionIsLoaded(extension: VmServiceExtension): boolean;
	};
	handleDebugSessionStart(session: DebugSession): void;
	handleDebugSessionEnd(session: DebugSession): void;
	handleDebugSessionCustomEvent(e: DebugSessionCustomEvent): void;
}

export interface InternalExtensionApi {
	analyzerCapabilities?: {
		supportsGetSignature: boolean;
		isDart2: boolean;
		hasNewSignatureFormat: boolean;
		hasNewHoverLibraryFormat: boolean;
		supportsAvailableSuggestions: boolean;
		supportsIncludedImports: boolean;
	};
	cancelAllAnalysisRequests: () => void;
	context: Context;
	currentAnalysis: () => Promise<void>;
	cursorIsInTest: boolean;
	isInTestFileThatHasImplementation: boolean;
	isInImplementationFileThatCanHaveTest: boolean;
	isLsp: boolean;
	dartCapabilities: {
		generatesCodeWithUnimplementedError: boolean;
		supportsDevTools: boolean;
		includesSourceForSdkLibs: boolean;
		handlesBreakpointsInPartFiles: boolean;
		hasDocumentationInCompletions: boolean;
		hasUpdatedCompletionRanking: boolean;
		supportsDisableServiceTokens: boolean;
		supportsPubOutdated: boolean;
		webSupportsDebugging: boolean;
		webSupportsEvaluation: boolean;
		webSupportsHotReload: boolean;
	};
	debugCommands: DebugCommandHandler;
	debugSessions: Array<{ loadedServiceExtensions: VmServiceExtension[] }>;
	envUtils: {
		openInBrowser(url: string): Promise<boolean>;
	};
	fileTracker: {
		getOutlineFor(file: Uri): Outline | undefined;
		getFlutterOutlineFor?: (file: Uri) => FlutterOutline | undefined;
		getLastPriorityFiles?: () => string[];
		getLastSubscribedFiles?: () => string[];
	};
	flutterCapabilities: {
		supportsPidFileForMachine: boolean;
		supportsMultipleSamplesPerElement: boolean;
		supportsDevTools: boolean;
		hasTestGroupFix: boolean;
		hasEvictBug: boolean;
		hasLatestStructuredErrorsWork: boolean;
		webSupportsDebugging: boolean;
		webSupportsEvaluation: boolean;
		webSupportsHotReload: boolean;
	};
	getLogHeader: () => string;
	initialAnalysis: Promise<void>;
	logger: EmittingLogger;
	analyzer: Analyzer;
	nextAnalysis: () => Promise<void>;
	pubGlobal: {
		promptToInstallIfRequired(packageName: string, packageID: string, moreInfoLink?: string, requiredVersion?: string, customActivateScript?: CustomScript, autoUpdate?: boolean): Promise<string | undefined>;
		checkVersionStatus(packageID: string, installedVersion: string | undefined, requiredVersion?: string): Promise<VersionStatus>;
		getInstalledVersion(packageName: string, packageID: string): Promise<string | undefined>;
		uninstall(packageID: string): Promise<void>;
	};
	safeToolSpawn: (workingDirectory: string | undefined, binPath: string, args: string[], envOverrides?: { [key: string]: string | undefined }) => SpawnedProcess;
	webClient: WebClient;
	workspaceContext: WorkspaceContext;
}

export interface TestResultsProvider extends TreeDataProvider<TestItemTreeItem> {
	handleDebugSessionEnd(session: DebugSession): void;
	handleDebugSessionCustomEvent(e: DebugSessionCustomEvent): void;
}

export interface TestItemTreeItem extends TreeItem {
	status: TestStatus;
}

export interface DelayedCompletionItem extends LazyCompletionItem {
	autoImportUri: string;
	document: TextDocument;
	enableCommitCharacters: boolean;
	filePath: string;
	insertArgumentPlaceholders: boolean;
	nextCharacter: string;
	offset: number;
	relevance: number;
	replacementLength: number;
	replacementOffset: number;
	suggestion: AvailableSuggestion;
	suggestionSetID: number;
}

// To avoid sending back huge docs for every completion item, we stash some data
// in our own fields (which won't serialise) and then restore them in resolve()
// on an individual completion basis.
export interface LazyCompletionItem extends CompletionItem {
	// tslint:disable-next-line: variable-name
	_documentation?: string | MarkdownString;
}

export interface FlutterSampleSnippet {
	readonly sourcePath: string;
	readonly sourceLine: number;
	readonly package: string;
	readonly library: string;
	readonly element: string;
	readonly id: string;
	readonly file: string;
	readonly description: string;
}
