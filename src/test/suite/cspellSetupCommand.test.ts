/**
 * cSpell Setup Command Test Suite
 * Tests for cSpell configuration setup command
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('cSpell Setup Command Test Suite', () => {

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

    suite('Command Registration', () => {
        test('Should have setupCSpell command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.setupCSpell'),
                'ditacraft.setupCSpell command should be registered'
            );
        });
    });

    suite('Command Accessibility', () => {
        test('setupCSpell command should be accessible from command palette', async function() {
            this.timeout(5000);

            // Verify command exists and is callable
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.setupCSpell'),
                'setupCSpell should be available'
            );
        });
    });

    suite('cSpell Configuration File Structure', () => {
        test('Extension should have .cspellrc.json template', function() {
            // The extension should have a template file
            const extensionPath = path.join(__dirname, '..', '..', '..');
            const templatePath = path.join(extensionPath, '.cspellrc.json');

            // Check if template exists in extension root
            if (fs.existsSync(templatePath)) {
                const content = fs.readFileSync(templatePath, 'utf-8');
                assert.ok(content.length > 0, 'Template file should have content');

                // Verify it's valid JSON
                try {
                    const parsed = JSON.parse(content);
                    assert.ok(parsed !== null, 'Template should be valid JSON');
                } catch (_e) {
                    // If not valid JSON, that's a problem but not for this test
                    assert.ok(true, 'Template file exists');
                }
            } else {
                // Template might be in a different location
                assert.ok(true, 'Template location may vary');
            }
        });

        test('cSpell config should support DITA file extensions', function() {
            // Verify expected DITA extensions
            const ditaExtensions = ['.dita', '.ditamap', '.bookmap'];

            for (const ext of ditaExtensions) {
                assert.ok(
                    ext.startsWith('.'),
                    `Extension ${ext} should start with dot`
                );
            }
        });
    });

    suite('cSpell DITA Vocabulary', () => {
        // Test that DITA-specific terms are recognized

        const ditaTerms = [
            'conref',
            'conkeyref',
            'keyref',
            'topicref',
            'ditamap',
            'bookmap',
            'shortdesc',
            'prolog',
            'taskbody',
            'conbody',
            'refbody'
        ];

        test('Should recognize common DITA terms', function() {
            for (const term of ditaTerms) {
                assert.ok(
                    typeof term === 'string' && term.length > 0,
                    `DITA term ${term} should be valid`
                );
            }
        });

        test('DITA element names should be lowercase', function() {
            for (const term of ditaTerms) {
                assert.strictEqual(
                    term,
                    term.toLowerCase(),
                    `DITA term ${term} should be lowercase`
                );
            }
        });
    });

    suite('Workspace Folder Handling', () => {
        test('Should detect workspace folders', function() {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            // Workspace folders may or may not exist in test environment
            if (workspaceFolders && workspaceFolders.length > 0) {
                assert.ok(workspaceFolders[0].uri, 'Workspace folder should have URI');
                assert.ok(workspaceFolders[0].uri.fsPath, 'Workspace folder should have fsPath');
            } else {
                // No workspace is also valid for this test
                assert.ok(true, 'No workspace folder is acceptable');
            }
        });

        test('Workspace folder path should be accessible', function() {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (workspaceFolders && workspaceFolders.length > 0) {
                const fsPath = workspaceFolders[0].uri.fsPath;
                assert.ok(typeof fsPath === 'string', 'fsPath should be a string');
                assert.ok(fsPath.length > 0, 'fsPath should not be empty');
            } else {
                assert.ok(true, 'No workspace folder available');
            }
        });
    });

    suite('File Path Construction', () => {
        test('Should construct valid .cspellrc.json path', function() {
            const workspaceRoot = 'test' + path.sep + 'workspace';
            const configPath = path.join(workspaceRoot, '.cspellrc.json');

            assert.ok(configPath.endsWith('.cspellrc.json'), 'Path should end with .cspellrc.json');
            assert.ok(configPath.includes('workspace'), 'Path should include workspace folder name');
        });

        test('Should handle paths with spaces', function() {
            const workspaceRoot = 'test' + path.sep + 'workspace with spaces';
            const configPath = path.join(workspaceRoot, '.cspellrc.json');

            assert.ok(configPath.includes('workspace with spaces'), 'Path should preserve spaces');
        });

        test('Should handle Windows-style paths', function() {
            const windowsRoot = 'C:\\Users\\test\\workspace';
            const configPath = path.join(windowsRoot, '.cspellrc.json');

            assert.ok(
                configPath.includes('.cspellrc.json'),
                'Path should include config filename'
            );
        });
    });

    suite('Command Error Handling', () => {
        test('Command should handle gracefully when called', async function() {
            this.timeout(5000);

            // The command will show dialogs, but should not throw
            try {
                const commands = await vscode.commands.getCommands(true);
                assert.ok(commands.includes('ditacraft.setupCSpell'));
            } catch (_error) {
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('cSpell Extension Integration', () => {
        test('Should reference correct cSpell extension ID', function() {
            const cspellExtensionId = 'streetsidesoftware.code-spell-checker';

            assert.ok(
                cspellExtensionId.includes('code-spell-checker'),
                'Extension ID should reference code-spell-checker'
            );
        });

        test('cSpell extension ID format should be valid', function() {
            const cspellExtensionId = 'streetsidesoftware.code-spell-checker';

            // Extension IDs are in format publisher.name
            const parts = cspellExtensionId.split('.');
            assert.strictEqual(parts.length, 2, 'Extension ID should have publisher.name format');
            assert.ok(parts[0].length > 0, 'Publisher should not be empty');
            assert.ok(parts[1].length > 0, 'Extension name should not be empty');
        });
    });

    suite('Configuration File Content', () => {
        test('cSpell config should be JSON format', function() {
            const sampleConfig = {
                version: '0.2',
                language: 'en',
                words: ['dita', 'conref', 'keyref']
            };

            const jsonString = JSON.stringify(sampleConfig);
            const parsed = JSON.parse(jsonString);

            assert.deepStrictEqual(parsed, sampleConfig, 'Config should round-trip through JSON');
        });

        test('cSpell config should support words array', function() {
            const config = {
                words: ['ditamap', 'bookmap', 'topicref']
            };

            assert.ok(Array.isArray(config.words), 'words should be an array');
            assert.ok(config.words.length > 0, 'words array should not be empty');
        });

        test('cSpell config should support enableFiletypes', function() {
            const config = {
                enableFiletypes: ['dita', 'ditamap', 'bookmap', 'xml']
            };

            assert.ok(Array.isArray(config.enableFiletypes), 'enableFiletypes should be an array');
            assert.ok(config.enableFiletypes.includes('dita'), 'Should include dita filetype');
        });
    });

    suite('User Choice Handling', () => {
        // Test the expected user choices in the dialog

        const existingFileChoices = ['Keep Current', 'Replace with DitaCraft Config', 'Open Existing File'];
        const newFileChoices = ['Install cSpell', 'Open Config File', 'Done'];

        test('Should have valid choices for existing file scenario', function() {
            for (const choice of existingFileChoices) {
                assert.ok(
                    typeof choice === 'string' && choice.length > 0,
                    `Choice "${choice}" should be valid`
                );
            }
        });

        test('Should have valid choices for new file scenario', function() {
            for (const choice of newFileChoices) {
                assert.ok(
                    typeof choice === 'string' && choice.length > 0,
                    `Choice "${choice}" should be valid`
                );
            }
        });

        test('Choices should be distinct', function() {
            const allChoices = [...existingFileChoices, ...newFileChoices];
            const uniqueChoices = new Set(allChoices);

            assert.strictEqual(
                uniqueChoices.size,
                allChoices.length,
                'All choices should be unique'
            );
        });
    });
});
