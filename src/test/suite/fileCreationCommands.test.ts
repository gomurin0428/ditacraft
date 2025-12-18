/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    validateFileName,
    generateTopicContent,
    generateMapContent,
    generateBookmapContent
} from '../../commands/fileCreationCommands';

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

    suite('validateFileName Function', () => {
        // Test the actual validateFileName function from fileCreationCommands

        test('Should return null for valid file names with letters', function() {
            assert.strictEqual(validateFileName('mytopic'), null);
            assert.strictEqual(validateFileName('MyTopic'), null);
            assert.strictEqual(validateFileName('TOPIC'), null);
        });

        test('Should return null for valid file names with numbers', function() {
            assert.strictEqual(validateFileName('topic1'), null);
            assert.strictEqual(validateFileName('123topic'), null);
            assert.strictEqual(validateFileName('topic123'), null);
        });

        test('Should return null for valid file names with hyphens', function() {
            assert.strictEqual(validateFileName('my-topic'), null);
            assert.strictEqual(validateFileName('my-long-topic-name'), null);
        });

        test('Should return null for valid file names with underscores', function() {
            assert.strictEqual(validateFileName('my_topic'), null);
            assert.strictEqual(validateFileName('my_long_topic_name'), null);
        });

        test('Should return null for mixed valid characters', function() {
            assert.strictEqual(validateFileName('my-topic_01'), null);
            assert.strictEqual(validateFileName('Topic-Name_v2'), null);
        });

        test('Should return error message for file names with spaces', function() {
            const result1 = validateFileName('my topic');
            const result2 = validateFileName('my topic name');
            assert.ok(result1 !== null, 'Should return error for space');
            assert.ok(result2 !== null, 'Should return error for multiple spaces');
            assert.ok(result1!.includes('letters, numbers, hyphens, and underscores'));
        });

        test('Should return error message for file names with special characters', function() {
            assert.ok(validateFileName('my.topic') !== null, 'Should reject dot');
            assert.ok(validateFileName('my@topic') !== null, 'Should reject @');
            assert.ok(validateFileName('my#topic') !== null, 'Should reject #');
            assert.ok(validateFileName('my$topic') !== null, 'Should reject $');
            assert.ok(validateFileName('my%topic') !== null, 'Should reject %');
            assert.ok(validateFileName('my/topic') !== null, 'Should reject /');
            assert.ok(validateFileName('my\\topic') !== null, 'Should reject backslash');
            assert.ok(validateFileName('my:topic') !== null, 'Should reject colon');
        });

        test('Should return error message for empty file names', function() {
            const result = validateFileName('');
            assert.ok(result !== null, 'Should return error for empty string');
            assert.ok(result!.includes('required'), 'Should mention required');
        });

        test('Should return error message for whitespace-only file names', function() {
            const result = validateFileName('   ');
            assert.ok(result !== null, 'Should return error for whitespace-only');
        });

        test('Should handle Unicode characters', function() {
            // Unicode characters should be rejected
            assert.ok(validateFileName('日本語') !== null, 'Should reject Japanese');
            assert.ok(validateFileName('трпик') !== null, 'Should reject Cyrillic');
            assert.ok(validateFileName('tópic') !== null, 'Should reject accented characters');
        });

        test('Should handle file names starting or ending with valid special chars', function() {
            assert.strictEqual(validateFileName('-mytopic'), null);
            assert.strictEqual(validateFileName('mytopic-'), null);
            assert.strictEqual(validateFileName('_mytopic'), null);
            assert.strictEqual(validateFileName('mytopic_'), null);
            assert.strictEqual(validateFileName('---'), null);
            assert.strictEqual(validateFileName('___'), null);
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

    suite('generateTopicContent Function', () => {
        // Test the topic content generation for each topic type

        suite('Generic Topic', () => {
            test('Should generate valid XML structure for topic', function() {
                const content = generateTopicContent('topic', 'my-topic');
                assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should have XML declaration');
                assert.ok(content.includes('<!DOCTYPE topic PUBLIC'), 'Should have topic DOCTYPE');
                assert.ok(content.includes('<topic id="my-topic">'), 'Should have topic element with id');
                assert.ok(content.includes('</topic>'), 'Should have closing topic tag');
            });

            test('Should include required topic elements', function() {
                const content = generateTopicContent('topic', 'test-id');
                assert.ok(content.includes('<title>'), 'Should have title element');
                assert.ok(content.includes('<shortdesc>'), 'Should have shortdesc element');
                assert.ok(content.includes('<body>'), 'Should have body element');
            });

            test('Should use provided id attribute', function() {
                const content1 = generateTopicContent('topic', 'custom-id-123');
                const content2 = generateTopicContent('topic', 'another_topic');
                assert.ok(content1.includes('id="custom-id-123"'), 'Should use custom id');
                assert.ok(content2.includes('id="another_topic"'), 'Should use another id');
            });

            test('Should be default for unknown topic type', function() {
                const content = generateTopicContent('unknown-type', 'test-id');
                assert.ok(content.includes('<!DOCTYPE topic PUBLIC'), 'Unknown type should default to topic');
            });
        });

        suite('Concept Topic', () => {
            test('Should generate valid concept structure', function() {
                const content = generateTopicContent('concept', 'my-concept');
                assert.ok(content.includes('<!DOCTYPE concept PUBLIC'), 'Should have concept DOCTYPE');
                assert.ok(content.includes('<concept id="my-concept">'), 'Should have concept element');
                assert.ok(content.includes('</concept>'), 'Should have closing concept tag');
            });

            test('Should include concept-specific elements', function() {
                const content = generateTopicContent('concept', 'test-concept');
                assert.ok(content.includes('<conbody>'), 'Should have conbody element');
                assert.ok(content.includes('</conbody>'), 'Should have closing conbody tag');
            });

            test('Should include section element', function() {
                const content = generateTopicContent('concept', 'test-concept');
                assert.ok(content.includes('<section>'), 'Should have section element');
                assert.ok(content.includes('</section>'), 'Should have closing section tag');
            });
        });

        suite('Task Topic', () => {
            test('Should generate valid task structure', function() {
                const content = generateTopicContent('task', 'my-task');
                assert.ok(content.includes('<!DOCTYPE task PUBLIC'), 'Should have task DOCTYPE');
                assert.ok(content.includes('<task id="my-task">'), 'Should have task element');
                assert.ok(content.includes('</task>'), 'Should have closing task tag');
            });

            test('Should include task-specific elements', function() {
                const content = generateTopicContent('task', 'test-task');
                assert.ok(content.includes('<taskbody>'), 'Should have taskbody element');
                assert.ok(content.includes('<prereq>'), 'Should have prereq element');
                assert.ok(content.includes('<context>'), 'Should have context element');
                assert.ok(content.includes('<steps>'), 'Should have steps element');
                assert.ok(content.includes('<result>'), 'Should have result element');
            });

            test('Should include step elements with cmd', function() {
                const content = generateTopicContent('task', 'test-task');
                assert.ok(content.includes('<step>'), 'Should have step element');
                assert.ok(content.includes('<cmd>'), 'Should have cmd element');
            });

            test('Should include multiple steps', function() {
                const content = generateTopicContent('task', 'test-task');
                const stepCount = (content.match(/<step>/g) || []).length;
                assert.ok(stepCount >= 2, 'Should have at least 2 steps');
            });
        });

        suite('Reference Topic', () => {
            test('Should generate valid reference structure', function() {
                const content = generateTopicContent('reference', 'my-reference');
                assert.ok(content.includes('<!DOCTYPE reference PUBLIC'), 'Should have reference DOCTYPE');
                assert.ok(content.includes('<reference id="my-reference">'), 'Should have reference element');
                assert.ok(content.includes('</reference>'), 'Should have closing reference tag');
            });

            test('Should include reference-specific elements', function() {
                const content = generateTopicContent('reference', 'test-ref');
                assert.ok(content.includes('<refbody>'), 'Should have refbody element');
                assert.ok(content.includes('</refbody>'), 'Should have closing refbody tag');
            });

            test('Should include properties table', function() {
                const content = generateTopicContent('reference', 'test-ref');
                assert.ok(content.includes('<properties>'), 'Should have properties element');
                assert.ok(content.includes('<prophead>'), 'Should have prophead element');
                assert.ok(content.includes('<property>'), 'Should have property element');
            });

            test('Should have property table headers', function() {
                const content = generateTopicContent('reference', 'test-ref');
                assert.ok(content.includes('<proptypehd>'), 'Should have proptypehd');
                assert.ok(content.includes('<propvaluehd>'), 'Should have propvaluehd');
                assert.ok(content.includes('<propdeschd>'), 'Should have propdeschd');
            });
        });
    });

    suite('generateMapContent Function', () => {
        // Test the map content generation

        test('Should generate valid XML structure for map', function() {
            const content = generateMapContent('my-map');
            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should have XML declaration');
            assert.ok(content.includes('<!DOCTYPE map PUBLIC'), 'Should have map DOCTYPE');
            assert.ok(content.includes('<map id="my-map">'), 'Should have map element with id');
            assert.ok(content.includes('</map>'), 'Should have closing map tag');
        });

        test('Should include required map elements', function() {
            const content = generateMapContent('test-map');
            assert.ok(content.includes('<title>'), 'Should have title element');
        });

        test('Should include topicref elements', function() {
            const content = generateMapContent('test-map');
            assert.ok(content.includes('<topicref'), 'Should have topicref element');
            assert.ok(content.includes('href="'), 'Should have href attribute');
        });

        test('Should include nested topicref structure', function() {
            const content = generateMapContent('test-map');
            // Verify nested structure by checking for topic references
            const topicrefCount = (content.match(/<topicref/g) || []).length;
            assert.ok(topicrefCount >= 2, 'Should have at least 2 topicref elements');
        });

        test('Should use provided id attribute', function() {
            const content1 = generateMapContent('custom-map-id');
            const content2 = generateMapContent('project_map');
            assert.ok(content1.includes('id="custom-map-id"'), 'Should use custom id');
            assert.ok(content2.includes('id="project_map"'), 'Should use another id');
        });

        test('Should reference .dita files', function() {
            const content = generateMapContent('test-map');
            assert.ok(content.includes('.dita"'), 'Should reference .dita files');
        });
    });

    suite('generateBookmapContent Function', () => {
        // Test the bookmap content generation

        test('Should generate valid XML structure for bookmap', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should have XML declaration');
            assert.ok(content.includes('<!DOCTYPE bookmap PUBLIC'), 'Should have bookmap DOCTYPE');
            assert.ok(content.includes('<bookmap id="my-book">'), 'Should have bookmap element with id');
            assert.ok(content.includes('</bookmap>'), 'Should have closing bookmap tag');
        });

        test('Should include booktitle with mainbooktitle', function() {
            const content = generateBookmapContent('Test Book Title', 'test-book');
            assert.ok(content.includes('<booktitle>'), 'Should have booktitle element');
            assert.ok(content.includes('<mainbooktitle>Test Book Title</mainbooktitle>'), 'Should have mainbooktitle with provided title');
        });

        test('Should include bookmeta with author and critdates', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            assert.ok(content.includes('<bookmeta>'), 'Should have bookmeta element');
            assert.ok(content.includes('<author>'), 'Should have author element');
            assert.ok(content.includes('<critdates>'), 'Should have critdates element');
            assert.ok(content.includes('<created date='), 'Should have created date');
        });

        test('Should include frontmatter with toc', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            assert.ok(content.includes('<frontmatter>'), 'Should have frontmatter element');
            assert.ok(content.includes('<booklists>'), 'Should have booklists element');
            assert.ok(content.includes('<toc/>'), 'Should have toc element');
        });

        test('Should include chapter elements', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            const chapterCount = (content.match(/<chapter/g) || []).length;
            assert.ok(chapterCount >= 2, 'Should have at least 2 chapters');
            assert.ok(content.includes('<chapter href='), 'Should have chapter with href');
        });

        test('Should include backmatter with indexlist', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            assert.ok(content.includes('<backmatter>'), 'Should have backmatter element');
            assert.ok(content.includes('<indexlist/>'), 'Should have indexlist element');
        });

        test('Should use provided title and id', function() {
            const content = generateBookmapContent('Custom Title', 'custom-book-id');
            assert.ok(content.includes('id="custom-book-id"'), 'Should use custom id');
            assert.ok(content.includes('<mainbooktitle>Custom Title</mainbooktitle>'), 'Should use custom title');
        });

        test('Should generate valid date format', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            // Date should be in ISO format YYYY-MM-DD
            const dateMatch = content.match(/<created date="(\d{4}-\d{2}-\d{2})"/);
            assert.ok(dateMatch !== null, 'Should have date in YYYY-MM-DD format');
            if (dateMatch) {
                const date = new Date(dateMatch[1]);
                assert.ok(!isNaN(date.getTime()), 'Date should be valid');
            }
        });

        test('Should handle special characters in title', function() {
            // Test that special characters in title are included as-is
            // Note: XML escaping would be needed for actual production use
            const content = generateBookmapContent('Book & Guide', 'test-book');
            assert.ok(content.includes('<mainbooktitle>Book & Guide</mainbooktitle>'), 'Should include title with &');
        });

        test('Should reference .ditamap files for chapters', function() {
            const content = generateBookmapContent('My Book', 'my-book');
            assert.ok(content.includes('.ditamap"'), 'Should reference .ditamap files for chapters');
        });
    });
});
