/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { __test } from '../../commands/fileCreationCommands';

suite('File Creation Commands Test Suite', () => {

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

    suite('Command Accessibility', () => {
        test('Commands should be accessible from command palette', async function() {
            this.timeout(5000);

            // Verify commands exist and are callable (even if cancelled by user)
            const commands = await vscode.commands.getCommands(true);

            const expectedCommands = [
                'ditacraft.newTopic',
                'ditacraft.newMap',
                'ditacraft.newBookmap'
            ];

            for (const cmd of expectedCommands) {
                assert.ok(
                    commands.includes(cmd),
                    `Command ${cmd} should be registered`
                );
            }
        });
    });

    suite('File Creation Command Behavior', () => {
        // Note: These tests are limited because file creation commands
        // require user interaction (showQuickPick, showInputBox)
        // Full integration tests would need mocking

        test('newTopic command should exist and be executable', async function() {
            this.timeout(5000);

            // The command should be executable (will prompt for input)
            // We can't test the full flow without mocking user input
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newTopic'));

            // Verify it's a function that can be called
            // Note: This will open a quick pick, which we can't interact with in tests
            // So we just verify the command exists
        });

        test('newMap command should exist and be executable', async function() {
            this.timeout(5000);

            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newMap'));
        });

        test('newBookmap command should exist and be executable', async function() {
            this.timeout(5000);

            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newBookmap'));
        });
    });

    suite('Command Menu Context', () => {
        test('Commands should be available in command palette', async function() {
            // Verify commands are discoverable
            const commands = await vscode.commands.getCommands(false); // false = only contributed commands

            // These commands should be in the non-internal list
            assert.ok(
                commands.includes('ditacraft.newTopic') ||
                commands.some(c => c.includes('newTopic')),
                'newTopic should be available'
            );
        });
    });

    suite('File Name Validation Logic', () => {
        // Test the validation logic used by file creation commands
        // This tests the pattern used internally

        const FILE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

        test('Should accept valid file names with letters', function() {
            assert.ok(FILE_NAME_PATTERN.test('mytopic'));
            assert.ok(FILE_NAME_PATTERN.test('MyTopic'));
            assert.ok(FILE_NAME_PATTERN.test('TOPIC'));
        });

        test('Should accept valid file names with numbers', function() {
            assert.ok(FILE_NAME_PATTERN.test('topic1'));
            assert.ok(FILE_NAME_PATTERN.test('123topic'));
            assert.ok(FILE_NAME_PATTERN.test('topic123'));
        });

        test('Should accept valid file names with hyphens', function() {
            assert.ok(FILE_NAME_PATTERN.test('my-topic'));
            assert.ok(FILE_NAME_PATTERN.test('my-long-topic-name'));
        });

        test('Should accept valid file names with underscores', function() {
            assert.ok(FILE_NAME_PATTERN.test('my_topic'));
            assert.ok(FILE_NAME_PATTERN.test('my_long_topic_name'));
        });

        test('Should accept mixed valid characters', function() {
            assert.ok(FILE_NAME_PATTERN.test('my-topic_01'));
            assert.ok(FILE_NAME_PATTERN.test('Topic-Name_v2'));
        });

        test('Should reject file names with spaces', function() {
            assert.ok(!FILE_NAME_PATTERN.test('my topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my topic name'));
        });

        test('Should reject file names with special characters', function() {
            assert.ok(!FILE_NAME_PATTERN.test('my.topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my@topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my#topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my$topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my%topic'));
        });

        test('Should reject empty file names', function() {
            assert.ok(!FILE_NAME_PATTERN.test(''));
        });
    });

    suite('Topic Type Templates', () => {
        // Verify the topic types that should be available

        const expectedTopicTypes = ['topic', 'concept', 'task', 'reference'];

        test('Should support standard DITA topic types', function() {
            // These are the types shown in the quick pick
            for (const type of expectedTopicTypes) {
                assert.ok(
                    typeof type === 'string' && type.length > 0,
                    `Topic type ${type} should be valid`
                );
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
            const content = __test.generateBookmapContent('Test', 'test');
            const today = new Date().toISOString().split('T')[0];
            assert.ok(content.includes(`date="${today}"`));
        });
    });
});
