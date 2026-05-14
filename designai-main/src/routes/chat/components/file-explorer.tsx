import { useState, useRef, useEffect } from 'react';
import { LucideNetwork, ChevronRight, File, Trash2, FilePlus } from 'lucide-react';
import type { FileType } from '../hooks/use-chat';
import clsx from 'clsx';

interface FileTreeItem {
	name: string;
	type: 'file' | 'folder';
	filePath: string;
	children?: { [key: string]: FileTreeItem };
	file?: FileType;
}

export function FileTreeItem({
	item,
	level = 0,
	currentFile,
	onFileClick,
	onDeleteFile,
}: {
	item: FileTreeItem;
	level?: number;
	currentFile: FileType | undefined;
	onFileClick: (file: FileType) => void;
	onDeleteFile?: (filePath: string) => void;
}) {
	const [isExpanded, setIsExpanded] = useState(true);
	const isCurrentFile = currentFile?.filePath === item.filePath;

	if (item.type === 'file' && item.file) {
		return (
			<div
				className={`group flex items-center w-full gap-2 py-1 transition-colors text-sm ${
					isCurrentFile
						? 'text-brand bg-zinc-100'
						: 'text-text-primary/80 hover:bg-accent hover:text-text-primary'
				}`}
				style={{ paddingLeft: `${level * 12 + 12}px` }}
			>
				<button
					onClick={() => onFileClick(item.file!)}
					className="flex items-center gap-2 flex-1 min-w-0 pr-1"
				>
					<File className="size-3 shrink-0" />
					<span className="flex-1 text-left truncate">{item.name}</span>
				</button>
				{onDeleteFile && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDeleteFile(item.filePath);
						}}
						className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 mr-2 rounded hover:text-red-400 transition-all"
						title={`Delete ${item.name}`}
					>
						<Trash2 className="size-3" />
					</button>
				)}
			</div>
		);
	}

	return (
		<div>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center gap-2 py-1 px-3 transition-colors text-sm text-text-primary/80 hover:bg-accent hover:text-text-primary w-full"
				style={{ paddingLeft: `${level * 12 + 12}px` }}
			>
				<ChevronRight
					className={clsx(
						'size-3 transition-transform duration-200 ease-in-out',
						isExpanded && 'rotate-90',
					)}
				/>
				<span className="flex-1 text-left truncate">{item.name}</span>
			</button>
			{isExpanded && item.children && (
				<div>
					{Object.values(item.children).map((child) => (
						<FileTreeItem
							key={child.filePath}
							item={child}
							level={level + 1}
							currentFile={currentFile}
							onFileClick={onFileClick}
							onDeleteFile={onDeleteFile}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function buildFileTree(files: FileType[]): FileTreeItem[] {
	const root: { [key: string]: FileTreeItem } = {};

	files.forEach((file) => {
		const parts = file.filePath.split('/');
		let currentLevel: { [key: string]: FileTreeItem } = root;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!currentLevel[part]) {
				currentLevel[part] = {
					name: part,
					type: 'folder',
					filePath: parts.slice(0, i + 1).join('/'),
					children: {},
				};
			}
			if (!currentLevel[part].children) {
				currentLevel[part].children = {};
			}
			currentLevel = currentLevel[part].children;
		}

		const fileName = parts[parts.length - 1];
		currentLevel[fileName] = {
			name: fileName,
			type: 'file',
			filePath: file.filePath,
			file: file,
		};
	});

	return Object.values(root);
}

interface NewFileInputProps {
	onConfirm: (filePath: string) => void;
	onCancel: () => void;
}

function NewFileInput({ onConfirm, onCancel }: NewFileInputProps) {
	const [value, setValue] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="flex items-center gap-1 px-2 py-1 border-b border-text/10">
			<File className="size-3 shrink-0 text-text-tertiary" />
			<input
				ref={inputRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
					if (e.key === 'Escape') onCancel();
				}}
				placeholder="src/NewFile.tsx"
				className="flex-1 text-xs bg-transparent text-text-primary placeholder:text-text-tertiary outline-none min-w-0"
			/>
		</div>
	);
}

export function FileExplorer({
	files,
	bootstrapFiles,
	currentFile,
	onFileClick,
	onDeleteFile,
	onCreateFile,
}: {
	files: FileType[];
	bootstrapFiles: FileType[];
	currentFile: FileType | undefined;
	onFileClick: (file: FileType) => void;
	onDeleteFile?: (filePath: string) => void;
	onCreateFile?: (filePath: string) => void;
}) {
	const [showNewFileInput, setShowNewFileInput] = useState(false);
	const fileTree = buildFileTree([...bootstrapFiles, ...files]);

	return (
		<div className="w-full max-w-[200px] bg-bg-3 border-r border-text/10 h-full overflow-y-auto">
			<div className="px-3 py-2 flex items-center justify-between">
				<div className="flex items-center gap-1 text-sm text-text-primary/50 font-medium">
					<LucideNetwork className="size-4" />
					Files
				</div>
				{onCreateFile && (
					<button
						onClick={() => setShowNewFileInput(true)}
						className="p-0.5 rounded hover:bg-accent/20 text-text-tertiary hover:text-text-primary transition-colors"
						title="New file"
					>
						<FilePlus className="size-3.5" />
					</button>
				)}
			</div>

			{showNewFileInput && onCreateFile && (
				<NewFileInput
					onConfirm={(path) => {
						onCreateFile(path);
						setShowNewFileInput(false);
					}}
					onCancel={() => setShowNewFileInput(false)}
				/>
			)}

			<div className="flex flex-col">
				{fileTree.map((item) => (
					<FileTreeItem
						key={item.filePath}
						item={item}
						currentFile={currentFile}
						onFileClick={onFileClick}
						onDeleteFile={onDeleteFile}
					/>
				))}
			</div>
		</div>
	);
}
