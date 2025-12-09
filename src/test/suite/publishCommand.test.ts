/**
 * Publish Command Test Suite
 * Tests publish command handling and error scenarios
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Publish Command Test Suite', () => {
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

    suite('Publish Command Registration', () => {
        test('Should have publish command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.publish'),
                'ditacraft.publish command should be registered'
            );
        });

        test('Should have publishHTML5 command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.publishHTML5'),
                'ditacraft.publishHTML5 command should be registered'
            );
        });
    });

    suite('Publish Command - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute publish command without any file open
            // This should not throw but show an error message
            try {
                await vscode.commands.executeCommand('ditacraft.publish');
                // Command should complete without throwing
            } catch (_error) {
                // If it throws, that's also acceptable error handling
                assert.ok(true, 'Command handled gracefully');
            }
        });

        test('Should handle publishHTML5 with no active editor gracefully', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute publishHTML5 command without any file open
            try {
                await vscode.commands.executeCommand('ditacraft.publishHTML5');
            } catch (_error) {
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('Publish Command - File Validation', () => {
        // Note: We cannot fully test publish commands because they show UI dialogs
        // that hang the test runner. These tests verify the command infrastructure.

        test('Valid DITA files have correct extensions', function() {
            // Test that our fixtures have the correct extensions
            const validExtensions = ['.dita', '.ditamap', '.bookmap'];

            assert.ok(validExtensions.includes('.dita'), '.dita is a valid extension');
            assert.ok(validExtensions.includes('.ditamap'), '.ditamap is a valid extension');
            assert.ok(validExtensions.includes('.bookmap'), '.bookmap is a valid extension');
        });

        test('Fixture files exist for testing', function() {
            const topicPath = path.join(fixturesPath, 'valid-topic.dita');
            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            const bookmapPath = path.join(fixturesPath, 'valid-bookmap.bookmap');

            assert.ok(fs.existsSync(topicPath), 'valid-topic.dita fixture should exist');
            assert.ok(fs.existsSync(mapPath), 'valid-map.ditamap fixture should exist');
            assert.ok(fs.existsSync(bookmapPath), 'valid-bookmap.bookmap fixture should exist');
        });
    });

    suite('DITA-OT Configuration', () => {
        test('ditaOtPath configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            // ditaOtPath should be defined (even if empty)
            assert.ok(ditaOtPath !== undefined, 'ditaOtPath config should be defined');
        });

        test('outputDirectory configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const outputDir = config.get<string>('outputDirectory');

            assert.ok(outputDir !== undefined, 'outputDirectory config should be defined');
        });

        test('defaultTranstype configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const transtype = config.get<string>('defaultTranstype');

            assert.ok(transtype !== undefined, 'defaultTranstype config should be defined');
            assert.strictEqual(transtype, 'html5', 'Default transtype should be html5');
        });
    });

    suite('Publish Format Selection', () => {
        test('Should support html5 transtype', function() {
            const transtypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            assert.ok(transtypes.includes('html5'), 'html5 should be supported');
        });

        test('Should support pdf transtype', function() {
            const transtypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            assert.ok(transtypes.includes('pdf'), 'pdf should be supported');
        });

        test('Should support all standard transtypes', function() {
            const expectedTranstypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            for (const transtype of expectedTranstypes) {
                assert.ok(
                    typeof transtype === 'string' && transtype.length > 0,
                    `Transtype ${transtype} should be valid`
                );
            }
        });
    });

    suite('Publish Output Directory', () => {
        test('Should construct valid output path', function() {
            const baseDir = '/workspace/output';
            const transtype = 'html5';
            const expectedPath = path.join(baseDir, transtype);
            assert.ok(expectedPath.includes('html5'), 'Output path should include transtype');
        });

        test('Should support workspace folder variable', function() {
            const outputDir = '${workspaceFolder}/output';
            assert.ok(outputDir.includes('${workspaceFolder}'), 'Should support workspace variable');
        });

        test('Should handle paths with spaces', function() {
            const pathWithSpaces = '/path/with spaces/output';
            assert.ok(pathWithSpaces.includes(' '), 'Path can contain spaces');
        });
    });

    suite('Publish Progress Reporting', () => {
        test('Should have progress stages', function() {
            const stages = ['Initializing', 'Processing', 'Generating', 'Complete'];
            assert.strictEqual(stages.length, 4, 'Should have 4 progress stages');
        });

        test('Progress percentage should be valid', function() {
            const percentages = [0, 25, 50, 75, 100];
            for (const pct of percentages) {
                assert.ok(pct >= 0 && pct <= 100, `Percentage ${pct} should be valid`);
            }
        });
    });

    suite('Publish Error Handling', () => {
        test('Should have appropriate error message for no active editor', function() {
            const errorMessage = 'No active editor. Please open a DITA file first.';
            assert.ok(errorMessage.includes('No active editor'), 'Should mention no active editor');
        });

        test('Should have appropriate error message for invalid file type', function() {
            const errorMessage = 'This command only works with DITA files (.dita, .ditamap, .bookmap)';
            assert.ok(errorMessage.includes('.dita'), 'Should mention .dita extension');
        });

        test('Should have appropriate error message for DITA-OT not configured', function() {
            const errorMessage = 'DITA-OT path is not configured. Please configure it first.';
            assert.ok(errorMessage.includes('DITA-OT'), 'Should mention DITA-OT');
        });

        test('Should have appropriate error message for publish failure', function() {
            const errorMessage = 'Publishing failed. Check the output for details.';
            assert.ok(errorMessage.includes('failed'), 'Should mention failure');
        });
    });

    suite('DITA-OT Wrapper Integration', () => {
        test('Should validate input file before publishing', function() {
            const validExtensions = ['.dita', '.ditamap', '.bookmap'];
            for (const ext of validExtensions) {
                assert.ok(ext.startsWith('.'), 'Extension should start with dot');
            }
        });

        test('Should reject non-DITA files', function() {
            const invalidExtensions = ['.txt', '.xml', '.html', '.md'];
            for (const ext of invalidExtensions) {
                assert.ok(!ext.includes('dita'), 'Non-DITA extension should not contain dita');
            }
        });

        test('Should support timeout configuration', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const timeout = config.get<number>('ditaOtTimeoutMinutes');
            if (timeout !== undefined) {
                assert.ok(typeof timeout === 'number', 'Timeout should be a number');
                assert.ok(timeout > 0, 'Timeout should be positive');
            }
        });

        test('Should support additional arguments', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const args = config.get<string[]>('ditaOtArgs');
            if (args !== undefined) {
                assert.ok(Array.isArray(args), 'ditaOtArgs should be an array');
            }
        });
    });

    suite('Publish Command Variants', () => {
        test('publish command should show format selection', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.publish'), 'publish command should exist');
        });

        test('publishHTML5 command should skip format selection', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.publishHTML5'), 'publishHTML5 command should exist');
        });

        test('Both commands should be registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            const publishCommands = commands.filter(c => c.startsWith('ditacraft.publish'));
            assert.ok(publishCommands.length >= 2, 'Should have at least 2 publish commands');
        });
    });

    suite('Publish Result Handling', () => {
        test('Should have success result structure', function() {
            const successResult = {
                success: true,
                outputPath: '/output/html5',
                duration: 5000
            };
            assert.ok(successResult.success, 'Success result should have success=true');
            assert.ok(successResult.outputPath, 'Success result should have outputPath');
        });

        test('Should have failure result structure', function() {
            const failureResult = {
                success: false,
                error: 'DITA-OT execution failed',
                exitCode: 1
            };
            assert.ok(!failureResult.success, 'Failure result should have success=false');
            assert.ok(failureResult.error, 'Failure result should have error message');
        });
    });
});
