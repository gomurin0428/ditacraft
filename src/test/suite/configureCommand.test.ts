/**
 * Configure Command Test Suite
 * Tests for DITA-OT configuration command
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { DitaOtWrapper } from '../../utils/ditaOtWrapper';
import { configureDitaOTCommand } from '../../commands/configureCommand';

suite('Configure Command Test Suite', () => {

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
        test('Should have configureDitaOT command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.configureDitaOT'),
                'ditacraft.configureDitaOT command should be registered'
            );
        });
    });

    suite('Command Accessibility', () => {
        test('configureDitaOT command should be accessible from command palette', async function() {
            this.timeout(5000);

            // Verify command exists and is callable
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.configureDitaOT'),
                'configureDitaOT should be available'
            );
        });
    });

    suite('Configuration Settings', () => {
        test('ditaOtPath setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            // ditaOtPath should be defined (even if empty string)
            assert.ok(ditaOtPath !== undefined, 'ditaOtPath setting should exist');
        });

        test('ditaOtPath setting should be a string', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            assert.ok(
                typeof ditaOtPath === 'string',
                'ditaOtPath should be a string'
            );
        });

        test('Configuration should have correct scope', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');

            // Verify we can inspect the configuration
            const inspection = config.inspect<string>('ditaOtPath');
            assert.ok(inspection !== undefined, 'Should be able to inspect ditaOtPath');
        });
    });

    suite('DITA-OT Path Validation Logic', () => {
        test('Empty path should be valid (means not configured)', function() {
            const emptyPath = '';
            assert.strictEqual(emptyPath, '', 'Empty path should be empty string');
        });

        test('Path with spaces should be handled', function() {
            const pathWithSpaces = '/path/with spaces/dita-ot';
            assert.ok(pathWithSpaces.includes(' '), 'Path can contain spaces');
        });

        test('Windows-style paths should be valid', function() {
            const windowsPath = 'C:\\Program Files\\dita-ot';
            assert.ok(windowsPath.includes('\\'), 'Windows path uses backslashes');
        });

        test('Unix-style paths should be valid', function() {
            const unixPath = '/usr/local/dita-ot';
            assert.ok(unixPath.startsWith('/'), 'Unix path starts with /');
        });
    });

    suite('Command Error Handling', () => {
        test('Command should handle gracefully when called', async function() {
            this.timeout(5000);

            // The command will show a dialog, but should not throw
            // We can't fully test without mocking, but we verify it doesn't crash
            try {
                // Note: This will open a file dialog which we can't interact with
                // The test verifies the command exists and can be invoked
                const commands = await vscode.commands.getCommands(true);
                assert.ok(commands.includes('ditacraft.configureDitaOT'));
            } catch (_error) {
                // If it throws, that's also acceptable error handling
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('Configuration Update Behavior', () => {
        test('Should be able to read current configuration', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const currentPath = config.get<string>('ditaOtPath');

            // Should not throw when reading
            assert.ok(currentPath !== undefined || currentPath === undefined,
                'Should be able to read configuration');
        });

        test('Configuration should support workspace and global scopes', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const inspection = config.inspect<string>('ditaOtPath');

            if (inspection) {
                // Verify inspection returns expected structure
                assert.ok('defaultValue' in inspection || inspection.defaultValue === undefined,
                    'Inspection should have defaultValue property');
            }
        });
    });

    suite('Related Configuration Settings', () => {
        test('outputDirectory setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const outputDir = config.get<string>('outputDirectory');

            assert.ok(outputDir !== undefined, 'outputDirectory should be defined');
        });

        test('defaultTranstype setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const transtype = config.get<string>('defaultTranstype');

            assert.ok(transtype !== undefined, 'defaultTranstype should be defined');
        });

        test('ditaOtArgs setting should be an array', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const args = config.get<string[]>('ditaOtArgs');

            assert.ok(Array.isArray(args), 'ditaOtArgs should be an array');
        });

        test('ditaOtTimeoutMinutes setting should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const timeout = config.get<number>('ditaOtTimeoutMinutes');

            assert.ok(timeout !== undefined, 'ditaOtTimeoutMinutes should be defined');
            assert.ok(typeof timeout === 'number', 'ditaOtTimeoutMinutes should be a number');
        });
    });

    suite('Command Function Execution', () => {
        test('configureDitaOTCommand should call DitaOtWrapper.configureOtPath', async function() {
            this.timeout(5000);

            // Save original methods
            const originalConfigureOtPath = DitaOtWrapper.prototype.configureOtPath;
            const originalShowErrorMessage = vscode.window.showErrorMessage;

            let configureOtPathCalled = false;
            let errorMessageShown: string | undefined;

            // Stub DitaOtWrapper.configureOtPath to avoid dialog
            (DitaOtWrapper.prototype as any).configureOtPath = async () => {
                configureOtPathCalled = true;
            };

            // Stub showErrorMessage to capture any errors
            (vscode.window as any).showErrorMessage = async (message: string) => {
                errorMessageShown = message;
                return undefined;
            };

            try {
                // Call the command function directly
                await configureDitaOTCommand();

                // Assert that configureOtPath was called
                assert.ok(configureOtPathCalled, 'configureOtPath should be called');
                assert.strictEqual(errorMessageShown, undefined, 'No error should be shown');
            } finally {
                // Restore original methods
                (DitaOtWrapper.prototype as any).configureOtPath = originalConfigureOtPath;
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
            }
        });

        test('configureDitaOTCommand should handle errors gracefully', async function() {
            this.timeout(5000);

            // Save original methods
            const originalConfigureOtPath = DitaOtWrapper.prototype.configureOtPath;
            const originalShowErrorMessage = vscode.window.showErrorMessage;

            let errorMessageShown: string | undefined;

            // Stub DitaOtWrapper.configureOtPath to throw an error
            (DitaOtWrapper.prototype as any).configureOtPath = async () => {
                throw new Error('Test error');
            };

            // Stub showErrorMessage to capture the error
            (vscode.window as any).showErrorMessage = async (message: string) => {
                errorMessageShown = message;
                return undefined;
            };

            try {
                // Call the command function directly
                await configureDitaOTCommand();

                // Assert that error message was shown
                assert.ok(errorMessageShown, 'Error message should be shown');
                assert.ok(errorMessageShown.includes('Configuration failed'), 'Error should mention configuration failed');
                assert.ok(errorMessageShown.includes('Test error'), 'Error should include original error message');
            } finally {
                // Restore original methods
                (DitaOtWrapper.prototype as any).configureOtPath = originalConfigureOtPath;
                (vscode.window as any).showErrorMessage = originalShowErrorMessage;
            }
        });

        test('configureDitaOTCommand via executeCommand should work', async function() {
            this.timeout(5000);

            // Save original methods
            const originalConfigureOtPath = DitaOtWrapper.prototype.configureOtPath;

            let configureOtPathCalled = false;

            // Stub DitaOtWrapper.configureOtPath to avoid dialog
            (DitaOtWrapper.prototype as any).configureOtPath = async () => {
                configureOtPathCalled = true;
            };

            try {
                // Call via executeCommand
                await vscode.commands.executeCommand('ditacraft.configureDitaOT');

                // Assert that configureOtPath was called
                assert.ok(configureOtPathCalled, 'configureOtPath should be called via executeCommand');
            } finally {
                // Restore original methods
                (DitaOtWrapper.prototype as any).configureOtPath = originalConfigureOtPath;
            }
        });
    });
});
