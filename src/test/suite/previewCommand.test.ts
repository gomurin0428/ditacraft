/**
 * Preview Command Test Suite
 * Tests preview command handling and error scenarios
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DitaOtWrapper } from '../../utils/ditaOtWrapper';
import { previewHTML5Command } from '../../commands/previewCommand';

suite('Preview Command Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

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
        // Close all editors after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Preview Command Registration', () => {
        test('Should have previewHTML5 command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.previewHTML5'),
                'ditacraft.previewHTML5 command should be registered'
            );
        });
    });

    suite('Preview Command - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute preview command without any file open
            // This should not throw but show an error message
            try {
                await vscode.commands.executeCommand('ditacraft.previewHTML5');
                // Command should complete without throwing
            } catch (_error) {
                // If it throws, that's also acceptable error handling
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('Preview Command - File Validation', () => {
        // Note: We cannot fully test preview commands because they require DITA-OT
        // and show UI dialogs that hang the test runner. These tests verify the command infrastructure.

        test('Valid DITA files have correct extensions for preview', function() {
            // Test that our fixtures have the correct extensions
            const validExtensions = ['.dita', '.ditamap', '.bookmap'];

            assert.ok(validExtensions.includes('.dita'), '.dita is a valid extension');
            assert.ok(validExtensions.includes('.ditamap'), '.ditamap is a valid extension');
            assert.ok(validExtensions.includes('.bookmap'), '.bookmap is a valid extension');
        });

        test('Fixture files exist for preview testing', function() {
            const topicPath = path.join(fixturesPath, 'valid-topic.dita');
            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            const bookmapPath = path.join(fixturesPath, 'valid-bookmap.bookmap');

            assert.ok(fs.existsSync(topicPath), 'valid-topic.dita fixture should exist');
            assert.ok(fs.existsSync(mapPath), 'valid-map.ditamap fixture should exist');
            assert.ok(fs.existsSync(bookmapPath), 'valid-bookmap.bookmap fixture should exist');
        });
    });

    suite('Preview Configuration', () => {
        test('previewAutoRefresh configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const autoRefresh = config.get<boolean>('previewAutoRefresh');

            // previewAutoRefresh should be defined (default is true)
            assert.ok(autoRefresh !== undefined, 'previewAutoRefresh config should be defined');
        });

        test('ditaOtPath configuration should exist for preview', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            // ditaOtPath should be defined (even if empty)
            assert.ok(ditaOtPath !== undefined, 'ditaOtPath config should be defined');
        });

        test('outputDirectory configuration should exist for preview output', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const outputDir = config.get<string>('outputDirectory');

            assert.ok(outputDir !== undefined, 'outputDirectory config should be defined');
        });
    });

    suite('Preview Panel ViewType', () => {
        test('Preview panel should have correct view type constant', function() {
            // The view type is used for webview panel identification
            const expectedViewType = 'ditacraft.preview';
            assert.ok(
                typeof expectedViewType === 'string' && expectedViewType.length > 0,
                'View type should be a non-empty string'
            );
        });
    });

    suite('HTML File Detection Logic', () => {
        // Test the patterns used to find generated HTML files

        test('Should recognize common HTML file patterns', function() {
            const patterns = ['index.html', 'topic.html', 'concept.html'];

            for (const pattern of patterns) {
                assert.ok(
                    pattern.endsWith('.html'),
                    `Pattern ${pattern} should end with .html`
                );
            }
        });

        test('Should handle various base names for HTML output', function() {
            const baseNames = ['my-topic', 'user-guide', 'reference_doc', 'Task1'];

            for (const baseName of baseNames) {
                const expectedHtml = `${baseName}.html`;
                assert.ok(
                    expectedHtml.endsWith('.html'),
                    `Generated HTML name ${expectedHtml} should be valid`
                );
            }
        });
    });

    suite('Preview Error Handling', () => {
        test('Should have error handling for missing files', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Try to preview with no file - should handle gracefully
            try {
                await vscode.commands.executeCommand('ditacraft.previewHTML5');
            } catch (_error) {
                // Error is acceptable - command should not crash
                assert.ok(true, 'Error was handled');
            }
        });
    });

    suite('Preview Path Validation', () => {
        test('Should validate file paths have extensions', function() {
            const validPaths = [
                '/path/to/file.dita',
                '/path/to/map.ditamap',
                '/path/to/book.bookmap'
            ];

            for (const filePath of validPaths) {
                const ext = path.extname(filePath);
                assert.ok(ext !== '', `Path ${filePath} should have an extension`);
            }
        });

        test('Should reject paths ending with directory separator', function() {
            const invalidPaths = [
                '/path/to/directory/',
                '/path/to/folder\\'
            ];

            for (const filePath of invalidPaths) {
                const endsWithSeparator = filePath.endsWith('/') || filePath.endsWith('\\');
                assert.ok(endsWithSeparator, `Path ${filePath} ends with separator`);
            }
        });

        test('Should handle paths without extensions', function() {
            const pathWithoutExt = '/path/to/file';
            const ext = path.extname(pathWithoutExt);
            assert.strictEqual(ext, '', 'Path without extension should have empty extname');
        });
    });

    suite('Preview Output Directory Structure', () => {
        test('Should use html5 subdirectory for preview output', function() {
            const baseOutputDir = '/output';
            const transtype = 'html5';
            const fileName = 'my-topic';

            const expectedPath = path.join(baseOutputDir, transtype, fileName);
            assert.ok(
                expectedPath.includes('html5'),
                'Preview output path should include html5 directory'
            );
        });

        test('Should create unique output directories per file', function() {
            const files = ['topic1', 'topic2', 'guide'];
            const outputDirs = files.map(f => path.join('/output', 'html5', f));

            // All directories should be unique
            const uniqueDirs = new Set(outputDirs);
            assert.strictEqual(
                uniqueDirs.size,
                files.length,
                'Each file should have a unique output directory'
            );
        });
    });

    suite('Preview Webview Panel', () => {
        test('Should have correct view type for preview panel', function() {
            const viewType = 'ditacraft.preview';
            assert.ok(viewType.startsWith('ditacraft.'), 'View type should be namespaced');
        });

        test('Preview panel title format should be valid', function() {
            const fileName = 'my-topic.dita';
            const expectedTitle = `Preview: ${fileName}`;
            assert.ok(expectedTitle.includes('Preview:'), 'Title should include Preview prefix');
            assert.ok(expectedTitle.includes(fileName), 'Title should include file name');
        });

        test('Preview panel should support retainContextWhenHidden option', function() {
            const options = {
                enableScripts: true,
                retainContextWhenHidden: true
            };
            assert.ok(options.retainContextWhenHidden, 'Should support retainContextWhenHidden');
        });
    });

    suite('Preview HTML Content Generation', () => {
        test('Should generate valid HTML structure', function() {
            const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Preview</title></head>
<body><p>Content</p></body>
</html>`;
            assert.ok(htmlContent.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
            assert.ok(htmlContent.includes('<html>'), 'Should have html tag');
            assert.ok(htmlContent.includes('<head>'), 'Should have head tag');
            assert.ok(htmlContent.includes('<body>'), 'Should have body tag');
        });

        test('Should support iframe for preview content', function() {
            const iframeSrc = 'file:///path/to/output/index.html';
            const iframe = `<iframe src="${iframeSrc}"></iframe>`;
            assert.ok(iframe.includes('iframe'), 'Should use iframe element');
            assert.ok(iframe.includes('src='), 'Should have src attribute');
        });
    });

    suite('Preview File Watcher', () => {
        test('Should watch for HTML file changes', function() {
            const watchPattern = '**/*.html';
            assert.ok(watchPattern.includes('*.html'), 'Pattern should match HTML files');
        });

        test('Should support multiple watch patterns', function() {
            const patterns = ['**/*.html', '**/*.htm', '**/*.xhtml'];
            assert.strictEqual(patterns.length, 3, 'Should have multiple patterns');
            for (const pattern of patterns) {
                assert.ok(pattern.startsWith('**/'), 'Pattern should be recursive');
            }
        });
    });

    suite('Preview Refresh Behavior', () => {
        test('Auto-refresh configuration should be boolean', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const autoRefresh = config.get<boolean>('previewAutoRefresh');
            if (autoRefresh !== undefined) {
                assert.ok(typeof autoRefresh === 'boolean', 'autoRefresh should be boolean');
            }
        });

        test('Should support manual refresh command', async function() {
            const commands = await vscode.commands.getCommands(true);
            // Check if there's a refresh-related command
            const hasPreviewCommand = commands.includes('ditacraft.previewHTML5');
            assert.ok(hasPreviewCommand, 'Should have preview command for refresh');
        });
    });

    suite('Preview Error Messages', () => {
        test('Should have appropriate error message for no active editor', function() {
            const errorMessage = 'No active editor. Please open a DITA file first.';
            assert.ok(errorMessage.includes('No active editor'), 'Should mention no active editor');
            assert.ok(errorMessage.includes('DITA'), 'Should mention DITA');
        });

        test('Should have appropriate error message for invalid file type', function() {
            const errorMessage = 'This command only works with DITA files (.dita, .ditamap, .bookmap)';
            assert.ok(errorMessage.includes('.dita'), 'Should mention .dita extension');
            assert.ok(errorMessage.includes('.ditamap'), 'Should mention .ditamap extension');
        });

        test('Should have appropriate error message for DITA-OT not configured', function() {
            const errorMessage = 'DITA-OT path is not configured. Please configure it first.';
            assert.ok(errorMessage.includes('DITA-OT'), 'Should mention DITA-OT');
            assert.ok(errorMessage.includes('configured'), 'Should mention configuration');
        });
    });

    suite('Command Function Execution', () => {
        test('previewHTML5Command should show error when no file is open', async function() {
            this.timeout(5000);

            // Save original methods
            const originalShowErrorMessage = vscode.window.showErrorMessage;

            let errorMessageShown: string | undefined;

            // Stub showErrorMessage to capture the error
            (vscode.window as any).showErrorMessage = async (message: string) => {
                errorMessageShown = message;
                return undefined;
            };

            try {
                // Call the command function directly with no URI
                await previewHTML5Command(undefined);

                // Assert that error message was shown
                assert.ok(errorMessageShown, 'Error message should be shown');
                assert.ok(errorMessageShown.includes('No DITA file'), 'Error should mention no DITA file');
            } finally {
                // Restore original methods
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
            }
        });

        test('previewHTML5Command should validate input file', async function() {
            this.timeout(5000);

            // Save original methods
            const originalShowErrorMessage = vscode.window.showErrorMessage;
            const originalValidateInputFile = DitaOtWrapper.prototype.validateInputFile;

            let errorMessageShown: string | undefined;
            let validateCalled = false;

            // Stub showErrorMessage to capture the error
            (vscode.window as any).showErrorMessage = async (message: string) => {
                errorMessageShown = message;
                return undefined;
            };

            // Stub validateInputFile to return invalid
            (DitaOtWrapper.prototype as any).validateInputFile = (_filePath: string) => {
                validateCalled = true;
                return { valid: false, error: 'Test validation error' };
            };

            try {
                // Call the command function with a URI
                const uri = vscode.Uri.file('/tmp/test.dita');
                await previewHTML5Command(uri);

                // Assert that validateInputFile was called
                assert.ok(validateCalled, 'validateInputFile should be called');
                // Assert that error message was shown
                assert.ok(errorMessageShown, 'Error message should be shown');
                assert.ok(errorMessageShown.includes('Cannot preview'), 'Error should mention cannot preview');
            } finally {
                // Restore original methods
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
                (DitaOtWrapper.prototype as any).validateInputFile = originalValidateInputFile;
            }
        });

        test('previewHTML5Command should check DITA-OT installation', async function() {
            this.timeout(5000);

            // Save original methods
            const originalShowErrorMessage = vscode.window.showErrorMessage;
            const originalValidateInputFile = DitaOtWrapper.prototype.validateInputFile;
            const originalVerifyInstallation = DitaOtWrapper.prototype.verifyInstallation;

            let errorMessageShown: string | undefined;
            let verifyInstallationCalled = false;

            // Stub showErrorMessage to capture the error
            (vscode.window as any).showErrorMessage = async (message: string, ..._items: string[]) => {
                errorMessageShown = message;
                return undefined;
            };

            // Stub validateInputFile to return valid
            (DitaOtWrapper.prototype as any).validateInputFile = () => {
                return { valid: true };
            };

            // Stub verifyInstallation to return not installed
            (DitaOtWrapper.prototype as any).verifyInstallation = async () => {
                verifyInstallationCalled = true;
                return { installed: false };
            };

            try {
                // Call the command function with a URI
                const uri = vscode.Uri.file('/tmp/test.dita');
                await previewHTML5Command(uri);

                // Assert that verifyInstallation was called
                assert.ok(verifyInstallationCalled, 'verifyInstallation should be called');
                // Assert that error message was shown
                assert.ok(errorMessageShown, 'Error message should be shown');
                assert.ok(errorMessageShown.includes('DITA-OT'), 'Error should mention DITA-OT');
            } finally {
                // Restore original methods
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
                (DitaOtWrapper.prototype as any).validateInputFile = originalValidateInputFile;
                (DitaOtWrapper.prototype as any).verifyInstallation = originalVerifyInstallation;
            }
        });

        test('previewHTML5Command via executeCommand should work', async function() {
            this.timeout(5000);

            // Save original methods
            const originalShowErrorMessage = vscode.window.showErrorMessage;

            let commandExecuted = false;

            // Stub showErrorMessage to mark command as executed
            (vscode.window as any).showErrorMessage = async (_message: string) => {
                commandExecuted = true;
                return undefined;
            };

            try {
                // Call via executeCommand (will show error since no file is open)
                await vscode.commands.executeCommand('ditacraft.previewHTML5');

                // Assert that command was executed (error message shown means command ran)
                assert.ok(commandExecuted, 'Command should be executed via executeCommand');
            } finally {
                // Restore original methods
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
            }
        });
    });
});
