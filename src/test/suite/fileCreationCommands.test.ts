/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sinon from 'sinon';
import { __test, newBookmapCommand, newMapCommand, newTopicCommand } from '../../commands/fileCreationCommands';

/**
 * 一時ワークスペースを差し替えてクリーンな作業領域を確保する。
 * @returns 一時ディレクトリのパスと復元用の関数
 */
function createTempWorkspaceFolder(): { tempDir: string; restore: () => void } {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-file-'));
    const newFolder: vscode.WorkspaceFolder = {
        uri: vscode.Uri.file(tempDir),
        name: path.basename(tempDir),
        index: 0
    };

    const originalFolders = vscode.workspace.workspaceFolders;
    let workspaceOverridden = false;

    try {
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [newFolder],
            configurable: true
        });
        workspaceOverridden = true;
    } catch {
        // プロパティ差し替えに失敗した場合は元のワークスペースを使用する
    }

    const restore = (): void => {
        try {
            if (workspaceOverridden) {
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalFolders,
                    configurable: true
                });
            } else {
                (vscode.workspace as any).workspaceFolders = originalFolders;
            }
        } catch {
            // 復元に失敗してもクリーンアップは継続する
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    };

    return { tempDir, restore };
}

type WindowStubKeys = 'showQuickPick' | 'showInputBox' | 'showInformationMessage' | 'showErrorMessage' | 'showTextDocument';
type WorkspaceStubKeys = 'openTextDocument';

/**
 * VS Code ウィンドウ API をモックし、テスト後に元へ戻す。
 * @param overrides 差し替えるメソッド群
 * @returns 復元関数
 */
function stubWindow(overrides: Partial<Record<WindowStubKeys, (...args: unknown[]) => unknown>>): () => void {
    const originals: Partial<Record<WindowStubKeys, unknown>> = {};
    for (const key of Object.keys(overrides) as WindowStubKeys[]) {
        originals[key] = (vscode.window as any)[key];
        (vscode.window as any)[key] = overrides[key] as unknown;
    }
    return () => {
        for (const key of Object.keys(overrides) as WindowStubKeys[]) {
            (vscode.window as any)[key] = originals[key];
        }
    };
}

/**
 * VS Code ワークスペース API をモックし、テスト後に元へ戻す。
 * @param overrides 差し替えるメソッド群
 * @returns 復元関数
 */
function stubWorkspace(overrides: Partial<Record<WorkspaceStubKeys, (...args: unknown[]) => unknown>>): () => void {
    const originals: Partial<Record<WorkspaceStubKeys, unknown>> = {};
    for (const key of Object.keys(overrides) as WorkspaceStubKeys[]) {
        originals[key] = (vscode.workspace as any)[key];
        (vscode.workspace as any)[key] = overrides[key] as unknown;
    }
    return () => {
        for (const key of Object.keys(overrides) as WorkspaceStubKeys[]) {
            (vscode.workspace as any)[key] = originals[key];
        }
    };
}

let sandbox: sinon.SinonSandbox;

suite('File Creation Commands Test Suite', () => {

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    suiteSetup(async () => {
        // Get and activate extension
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        sandbox.restore();
        // Close all editors after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Command Registration', () => {
        test('Should have newTopic command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newTopic'),
                'ditacraft.newTopic command should be registered'
            );
        });

        test('Should have newMap command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newMap'),
                'ditacraft.newMap command should be registered'
            );
        });

        test('Should have newBookmap command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newBookmap'),
                'ditacraft.newBookmap command should be registered'
            );
        });
    });

    suite('Command Execution Flow', () => {
        test('newTopicCommand は入力を受けてトピックファイルを生成する', async function() {
            this.timeout(7000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'my-topic.dita');

            const restoreWindow = stubWindow({
                showQuickPick: async () => ({ label: 'Topic', description: 'Generic DITA topic', value: 'topic' } as any),
                showInputBox: async () => 'my-topic',
                showInformationMessage: async () => undefined
            });

            const openedPaths: string[] = [];
            const restoreWorkspace = stubWorkspace({
                openTextDocument: async (uri: unknown) => {
                    const fsPath = typeof uri === 'string' ? uri : (uri as vscode.Uri).fsPath;
                    openedPaths.push(fsPath);
                    return { fileName: fsPath } as unknown as vscode.TextDocument;
                }
            });

            const originalShowTextDocument = vscode.window.showTextDocument;
            const shown: string[] = [];
            (vscode.window as any).showTextDocument = async (doc: unknown) => {
                shown.push((doc as any).fileName ?? '');
                return {} as vscode.TextEditor;
            };

            try {
                await newTopicCommand();
                assert.ok(fs.existsSync(targetFile), 'トピックファイルが生成されること');
                const content = fs.readFileSync(targetFile, 'utf8');
                assert.ok(content.includes('<topic id="my-topic">'), '生成ファイルにIDが埋め込まれること');
                assert.ok(openedPaths.includes(targetFile), '生成後にドキュメントを開くこと');
                assert.ok(shown.includes(targetFile), 'エディタ表示を試みること');
            } finally {
                (vscode.window as any).showTextDocument = originalShowTextDocument;
                restoreWorkspace();
                restoreWindow();
                restore();
            }
        });

        test('トピックタイプ選択をキャンセルした場合は作成しない', async function() {
            this.timeout(5000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'cancel.dita');
            let inputCalled = 0;

            const restoreWindow = stubWindow({
                showQuickPick: async () => undefined,
                showInputBox: async () => {
                    inputCalled += 1;
                    return 'should-not-be-used';
                }
            });

            try {
                await newTopicCommand();
                assert.strictEqual(inputCalled, 0, 'ファイル名入力は呼ばれないこと');
                assert.ok(!fs.existsSync(targetFile), 'キャンセル時はファイルが作成されないこと');
            } finally {
                restoreWindow();
                restore();
            }
        });

        test('無効なファイル名はvalidateInputで弾かれ作成しない', async function() {
            this.timeout(5000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'bad name.dita');

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Task', description: 'Step-by-step procedure', value: 'task' } as any);

            const validateSpy = sandbox.spy(__test, 'validateFileName');

            sandbox.stub(vscode.window, 'showInputBox').callsFake(async (options?: vscode.InputBoxOptions) => {
                const validator = options?.validateInput;
                const validationResult = validator ? validator('bad name') : null;
                return validationResult ? undefined : 'bad name';
            });

            const infoStub = sandbox.stub(vscode.window, 'showInformationMessage');
            const writeSpy = sandbox.spy(fs, 'writeFileSync');

            try {
                await newTopicCommand();
                assert.ok(validateSpy.called, 'validateFileNameが呼ばれること');
                assert.ok(writeSpy.notCalled, '無効入力ではファイルを書き込まないこと');
                assert.ok(infoStub.notCalled, '成功メッセージを表示しないこと');
                assert.ok(!fs.existsSync(targetFile), 'ファイルは作成されないこと');
            } finally {
                restore();
            }
        });

        test('既存ファイルがある場合はエラー表示し上書きしない', async function() {
            this.timeout(7000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const duplicateFile = path.join(tempDir, 'duplicate.dita');
            fs.writeFileSync(duplicateFile, 'original', 'utf8');

            const errors: string[] = [];
            const restoreWindow = stubWindow({
                showQuickPick: async () => ({ label: 'Topic', description: 'Generic DITA topic', value: 'topic' } as any),
                showInputBox: async () => 'duplicate',
                showErrorMessage: async (...args: unknown[]) => {
                    const message = String(args[0]);
                    errors.push(message);
                    return undefined;
                }
            });

            let openCalled = false;
            const restoreWorkspace = stubWorkspace({
                openTextDocument: async () => {
                    openCalled = true;
                    return {} as vscode.TextDocument;
                }
            });

            try {
                await newTopicCommand();
                const contentAfter = fs.readFileSync(duplicateFile, 'utf8');
                assert.strictEqual(contentAfter, 'original', '既存ファイルは上書きされないこと');
                assert.ok(errors.some(m => m.includes('File already exists')), '既存ファイルの警告を出すこと');
                assert.ok(!openCalled, '既存ファイルの場合はエディタを開かないこと');
            } finally {
                restoreWorkspace();
                restoreWindow();
                restore();
            }
        });

        test('newMapCommand は不正入力を拒否する', async function() {
            this.timeout(5000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'bad name.ditamap');

            const inputStub = sandbox.stub(vscode.window, 'showInputBox').callsFake(async (options?: vscode.InputBoxOptions) => {
                const validator = options?.validateInput;
                const validationResult = validator ? validator('bad name') : null;
                return validationResult ? undefined : 'bad name';
            });

            const infoStub = sandbox.stub(vscode.window, 'showInformationMessage');
            const writeSpy = sandbox.spy(fs, 'writeFileSync');

            try {
                await newMapCommand();
                assert.ok(inputStub.called, 'showInputBox が呼ばれること');
                assert.ok(writeSpy.notCalled, 'バリデーションエラー時は書き込まないこと');
                assert.ok(infoStub.notCalled, '成功メッセージを出さないこと');
                assert.ok(!fs.existsSync(targetFile), '不正入力ではファイルが作成されないこと');
            } finally {
                restore();
            }
        });

        test('newBookmapCommand はタイトル入力キャンセル時に中断する', async function() {
            this.timeout(5000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'book-file.bookmap');

            sandbox.stub(vscode.window, 'showInputBox').onFirstCall().resolves(undefined);

            await newBookmapCommand();

            assert.ok(!fs.existsSync(targetFile), 'キャンセル時はファイルを作らないこと');

            restore();
        });

        test('ファイル書き込み失敗はエラーとして伝搬する', async function() {
            this.timeout(5000);

            const { restore } = createTempWorkspaceFolder();

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Topic', description: 'Generic DITA topic', value: 'topic' } as any);
            sandbox.stub(vscode.window, 'showInputBox').resolves('io-error-topic');
            const errorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');

            const writeStub = sandbox.stub(fs, 'writeFileSync').throws(new Error('disk full'));

            try {
                await newTopicCommand();
                assert.ok(writeStub.called, '書き込みを試みること');
                assert.ok(errorMessageStub.called, 'エラーをユーザーへ表示すること');
                assert.ok(
                    errorMessageStub.args.some((args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('Failed to create topic')),
                    'エラーメッセージにコマンド名が含まれること'
                );
            } finally {
                restore();
            }
        });

        test('newMapCommand は .ditamap ファイルを生成する', async function() {
            this.timeout(7000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'my-map.ditamap');

            const restoreWindow = stubWindow({
                showInputBox: async () => 'my-map',
                showInformationMessage: async () => undefined
            });

            const restoreWorkspace = stubWorkspace({
                openTextDocument: async (uri: unknown) => {
                    const fsPath = typeof uri === 'string' ? uri : (uri as vscode.Uri).fsPath;
                    return { fileName: fsPath } as unknown as vscode.TextDocument;
                }
            });

            const originalShowTextDocument = vscode.window.showTextDocument;
            (vscode.window as any).showTextDocument = async () => {
                return {} as vscode.TextEditor;
            };

            try {
                await newMapCommand();
                assert.ok(fs.existsSync(targetFile), '.ditamap ファイルが生成されること');
                const content = fs.readFileSync(targetFile, 'utf8');
                assert.ok(content.includes('<map id="my-map">'), 'マップIDが反映されること');
                assert.ok(content.includes('<topicref href="topic1.dita">'), 'テンプレートの内容が含まれること');
            } finally {
                (vscode.window as any).showTextDocument = originalShowTextDocument;
                restoreWorkspace();
                restoreWindow();
                restore();
            }
        });

        test('newBookmapCommand はタイトルを反映した .bookmap を生成する', async function() {
            this.timeout(7000);

            const { tempDir, restore } = createTempWorkspaceFolder();
            const targetFile = path.join(tempDir, 'book-file.bookmap');

            let inputCall = 0;
            const restoreWindow = stubWindow({
                showInputBox: async () => {
                    inputCall += 1;
                    return inputCall === 1 ? 'My Book Title' : 'book-file';
                },
                showInformationMessage: async () => undefined
            });

            const restoreWorkspace = stubWorkspace({
                openTextDocument: async (uri: unknown) => {
                    const fsPath = typeof uri === 'string' ? uri : (uri as vscode.Uri).fsPath;
                    return { fileName: fsPath } as unknown as vscode.TextDocument;
                }
            });

            const originalShowTextDocument = vscode.window.showTextDocument;
            (vscode.window as any).showTextDocument = async () => {
                return {} as vscode.TextEditor;
            };

            try {
                await newBookmapCommand();
                assert.ok(fs.existsSync(targetFile), '.bookmap ファイルが生成されること');
                const content = fs.readFileSync(targetFile, 'utf8');
                assert.ok(content.includes('<mainbooktitle>My Book Title</mainbooktitle>'), '入力したタイトルを使用すること');
                assert.ok(content.includes('id="book-file"'), '入力したIDを使用すること');
            } finally {
                (vscode.window as any).showTextDocument = originalShowTextDocument;
                restoreWorkspace();
                restoreWindow();
                restore();
            }
        });
    });

    suite('Internal Function Tests (validateFileName)', () => {
        test('Should return null for valid file names', function() {
            assert.strictEqual(__test.validateFileName('mytopic'), null);
            assert.strictEqual(__test.validateFileName('my-topic'), null);
            assert.strictEqual(__test.validateFileName('my_topic'), null);
            assert.strictEqual(__test.validateFileName('topic123'), null);
            assert.strictEqual(__test.validateFileName('Topic-Name_v2'), null);
        });

        test('Should return error message for empty file name', function() {
            const result = __test.validateFileName('');
            assert.strictEqual(result, 'File name is required');
        });

        test('Should return error message for file name with spaces', function() {
            const result = __test.validateFileName('my topic');
            assert.strictEqual(result, __test.FILE_NAME_VALIDATION_MESSAGE);
        });

        test('Should return error message for file name with special characters', function() {
            assert.strictEqual(__test.validateFileName('my.topic'), __test.FILE_NAME_VALIDATION_MESSAGE);
            assert.strictEqual(__test.validateFileName('my@topic'), __test.FILE_NAME_VALIDATION_MESSAGE);
            assert.strictEqual(__test.validateFileName('my#topic'), __test.FILE_NAME_VALIDATION_MESSAGE);
            assert.strictEqual(__test.validateFileName('my$topic'), __test.FILE_NAME_VALIDATION_MESSAGE);
            assert.strictEqual(__test.validateFileName('my%topic'), __test.FILE_NAME_VALIDATION_MESSAGE);
        });

        test('FILE_NAME_PATTERN should match valid names', function() {
            assert.ok(__test.FILE_NAME_PATTERN.test('valid-name'));
            assert.ok(__test.FILE_NAME_PATTERN.test('valid_name'));
            assert.ok(__test.FILE_NAME_PATTERN.test('ValidName123'));
        });

        test('FILE_NAME_PATTERN should not match invalid names', function() {
            assert.ok(!__test.FILE_NAME_PATTERN.test('invalid name'));
            assert.ok(!__test.FILE_NAME_PATTERN.test('invalid.name'));
            assert.ok(!__test.FILE_NAME_PATTERN.test(''));
        });
    });

    suite('Internal Function Tests (generateTopicContent)', () => {
        test('Should generate valid topic content', function() {
            const content = __test.generateTopicContent('topic', 'my-topic');
            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE topic PUBLIC'));
            assert.ok(content.includes('<topic id="my-topic">'));
            assert.ok(content.includes('<title>Topic Title</title>'));
            assert.ok(content.includes('<body>'));
            assert.ok(content.includes('</topic>'));
        });

        test('Should generate valid concept content', function() {
            const content = __test.generateTopicContent('concept', 'my-concept');
            assert.ok(content.includes('<!DOCTYPE concept PUBLIC'));
            assert.ok(content.includes('<concept id="my-concept">'));
            assert.ok(content.includes('<conbody>'));
            assert.ok(content.includes('</concept>'));
        });

        test('Should generate valid task content', function() {
            const content = __test.generateTopicContent('task', 'my-task');
            assert.ok(content.includes('<!DOCTYPE task PUBLIC'));
            assert.ok(content.includes('<task id="my-task">'));
            assert.ok(content.includes('<taskbody>'));
            assert.ok(content.includes('<prereq>'));
            assert.ok(content.includes('<steps>'));
            assert.ok(content.includes('<step>'));
            assert.ok(content.includes('</task>'));
        });

        test('Should generate valid reference content', function() {
            const content = __test.generateTopicContent('reference', 'my-reference');
            assert.ok(content.includes('<!DOCTYPE reference PUBLIC'));
            assert.ok(content.includes('<reference id="my-reference">'));
            assert.ok(content.includes('<refbody>'));
            assert.ok(content.includes('<properties>'));
            assert.ok(content.includes('</reference>'));
        });

        test('Should default to topic for unknown type', function() {
            const content = __test.generateTopicContent('unknown', 'my-unknown');
            assert.ok(content.includes('<!DOCTYPE topic PUBLIC'));
            assert.ok(content.includes('<topic id="my-unknown">'));
        });

        test('Should use provided id in generated content', function() {
            const content = __test.generateTopicContent('topic', 'custom-id-123');
            assert.ok(content.includes('id="custom-id-123"'));
        });
    });

    suite('Internal Function Tests (generateMapContent)', () => {
        test('Should generate valid map content', function() {
            const content = __test.generateMapContent('my-map');
            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE map PUBLIC'));
            assert.ok(content.includes('<map id="my-map">'));
            assert.ok(content.includes('<title>Map Title</title>'));
            assert.ok(content.includes('<topicref href="topic1.dita">'));
            assert.ok(content.includes('</map>'));
        });

        test('Should include nested topicrefs', function() {
            const content = __test.generateMapContent('test-map');
            assert.ok(content.includes('<topicref href="subtopic1.dita"/>'));
            assert.ok(content.includes('<topicref href="subtopic2.dita"/>'));
        });

        test('Should use provided id in map', function() {
            const content = __test.generateMapContent('custom-map-id');
            assert.ok(content.includes('id="custom-map-id"'));
        });
    });

    suite('Internal Function Tests (generateBookmapContent)', () => {
        test('Should generate valid bookmap content', function() {
            const content = __test.generateBookmapContent('My Book Title', 'my-bookmap');
            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE bookmap PUBLIC'));
            assert.ok(content.includes('<bookmap id="my-bookmap">'));
            assert.ok(content.includes('<mainbooktitle>My Book Title</mainbooktitle>'));
            assert.ok(content.includes('</bookmap>'));
        });

        test('Should include bookmeta with author and dates', function() {
            const content = __test.generateBookmapContent('Test Book', 'test-bookmap');
            assert.ok(content.includes('<bookmeta>'));
            assert.ok(content.includes('<author>Author Name</author>'));
            assert.ok(content.includes('<critdates>'));
            assert.ok(content.includes('<created date='));
        });

        test('Should include frontmatter and backmatter', function() {
            const content = __test.generateBookmapContent('Test Book', 'test-bookmap');
            assert.ok(content.includes('<frontmatter>'));
            assert.ok(content.includes('<toc/>'));
            assert.ok(content.includes('<backmatter>'));
            assert.ok(content.includes('<indexlist/>'));
        });

        test('Should include chapter structure', function() {
            const content = __test.generateBookmapContent('Test Book', 'test-bookmap');
            assert.ok(content.includes('<chapter href="chapter1.ditamap">'));
            assert.ok(content.includes('<chapter href="chapter2.ditamap">'));
            assert.ok(content.includes('<topicref href="introduction.dita"/>'));
            assert.ok(content.includes('<topicref href="getting-started.dita"/>'));
        });

        test('Should use provided title and id', function() {
            const content = __test.generateBookmapContent('Custom Title', 'custom-id');
            assert.ok(content.includes('<mainbooktitle>Custom Title</mainbooktitle>'));
            assert.ok(content.includes('id="custom-id"'));
        });

        test('Should include current date in created element', function() {
            const clock = sandbox.useFakeTimers(new Date('2024-04-05T12:34:56Z'));
            const content = __test.generateBookmapContent('Test', 'test');
            const match = content.match(/<created date="([0-9]{4}-[0-9]{2}-[0-9]{2})"\/>/);
            clock.restore();

            assert.ok(match, 'created 要素が存在すること');
            const isoDate = match ? match[1] : '';
            assert.strictEqual(isoDate, '2024-04-05', '日付が固定値で生成されること');
        });
    });
});
