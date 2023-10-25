/**
 * SMART TABS EXTENSION FOR VISUAL STUDIO CODE
 *
 * Description:
 * The Smart Tabs extension is designed to improve the tab management
 * experience in Visual Studio Code. It automatically repositions the tab
 * containing modified content closer to the left or right edge of the list
 * of tabs, depending on the user's preference. The aim is to make the active
 * tab more accessible and intuitive, especially when dealing with multiple
 * open files.
 *
 * Features:
 * 1. Moves the modified tab closer to the left or right edge based on the
 *    user's preference.
 * 2. Respects pinned tabs: The extension identifies pinned tabs and ensures
 *    that the moved tab does not override or disturb them.
 * 3. Configurable fixed tab positions: A set number of tabs can be kept fixed
 *    at the start and won't be affected by automatic movements.
 *
 * How It Works:
 * - When content in a tab is modified, the extension triggers the
 *   `smart-tabs.moveTab` command.
 * - The extension then checks the configuration to determine the desired
 *   behavior, i.e., whether to move the active tab towards the left or right
 *   and how many tabs should remain fixed at their positions.
 * - Before moving the tab, the extension considers any pinned tabs and
 *   calculates the desired position for the modified tab accordingly.
 * - The tab is then repositioned using the VS Code `moveActiveEditor` command.
 *
 * Configuration Options:
 * - `fixedTabs`: Determines the number of tabs that remain fixed at the
 *    start or end of the tab list. Default is 5.
 * - `activeFirst`: A boolean to determine the direction of movement.
 *    If set to `true`, modified tabs move towards the left; if `false`,
 *    they move towards the right. Default is `false`.
 *
 * Copyright valsorym <i@valsorym.com>, 2022-2023.
 */

import * as vscode from 'vscode';


// A container to store all subscriptions.
let disposables: vscode.Disposable[] = [];

// FIXED_TABS
// This constant defines the number of tabs at the beginning (or end,
// based on the user's configuration) that should remain in their fixed
// positions and not be affected by the automated tab movement behavior
// implemented by this extension.
//
// For example, if set to 5, the first (or last) five tabs will not be
// automatically moved when their content is modified. This is useful for
// keeping frequently accessed or essential files always accessible at known
// positions.
//
// Default value: 5
const FIXED_TABS: number = 3;

// ACTIVE_FIRST
// A boolean constant that determines the direction of automatic tab movement.
//
// - If set to `true`, tabs with modified content will be moved towards the
//   beginning (left side) of the tab list.
// - If set to `false`, they will be moved towards the end (right side).
//
// This allows users to customize the behavior based on their personal
// workflow and preferences regarding tab positions.
//
// Default value: false (Tabs move towards the right).
const ACTIVE_FIRST: boolean = true;

// DEFAULT_DEBOUNCE_DELAY
// This constant defines the default delay (in milliseconds) to wait before
// invoking the `smart-tabs.moveTab` command after the user modifies the
// content in a tab. This delay helps to ensure that frequent content changes
// do not trigger excessive tab movement, improving user experience.
//
// Default value: 300 (milliseconds).
const DEFAULT_DEBOUNCE_DELAY: number = 300;

// DEFAULT_REACTION_EVENT
// This constant defines the default trigger for repositioning the tab after
// its content is modified. It can take the following values:
// - onedit - the tab is repositioned when its content is edited;
// - onsave - the tab is repositioned when its content is saved;
// - onfocus - the tab is repositioned when it gains focus.
const DEFAULT_REACTION_EVENT = 'onedit';

// These are global variables that store the configuration settings for the
// Smart Tabs extension. By making them global, we can ensure that the
// configuration is loaded once during the activation process and can be
// accessed and used across the extension without the need to re-fetch them
// from the configuration system every time they're required. This design
// improves the efficiency of the extension by reducing repetitive
// configuration lookups.
//
// - fixedTabs stores the number of tabs that remain fixed at their positions.
// - activeFirst indicates the direction of automatic tab movement.
// - debounceDelay defines the delay before the `smart-tabs.moveTab` command
//   is invoked after a tab is modified.
// - reactionEvent determines the user's preferred trigger for repositioning
//   the tab. It can take the following values:
//    - 'onedit' - the tab is repositioned when its content is edited;
//    - 'onfocus' - the tab is repositioned when it gains focus;
//    - 'onsave' - the tab is repositioned when its content is saved.
//   Default behavior is set to reposition on edit.
let fixedTabs: number = FIXED_TABS;
let activeFirst: boolean = ACTIVE_FIRST;
let debounceDelay: number = DEFAULT_DEBOUNCE_DELAY;
let reactionEvent: 'onedit' | 'onsave' | 'onfocus' = DEFAULT_REACTION_EVENT;

// This variable stores the timer used to debounce the `smart-tabs.moveTab`.
let isDebouncing: boolean = false;


// Loads and updates the configuration settings for the Smart Tabs extension
// from the VS Code settings.
//
// Configuration settings are key preferences defined by the user that dictate
// how the extension behaves. Since the user can change these settings at any
// point, this function provides a means to load (and reload) the latest values
// into the global variables, ensuring that the extension always operates based
// on the most recent configurations.
function loadConfigurations() {
    const config = vscode.workspace.getConfiguration('smart-tabs');
    fixedTabs = config.get('fixedTabs', FIXED_TABS);
    activeFirst = config.get('activeFirst', ACTIVE_FIRST);
    debounceDelay = config.get('debounceDelay', DEFAULT_DEBOUNCE_DELAY);
    reactionEvent = config.get('reactionEvent', DEFAULT_REACTION_EVENT);
}

// Sets up the appropriate event listeners based on the user's configuration.
//
// This function first clears any existing listeners to ensure that no
// redundant listeners are active. It then checks the current setting for
// the `reactionEvent` configuration and attaches the relevant event listener
// to the desired action, such as editing, focusing, or saving a tab.
function setupEventListeners() {
    // Clear existing listeners first.
    disposables.forEach(disposable => disposable.dispose());
    disposables = [];

    let e: vscode.Disposable;
    switch (reactionEvent) {
        case 'onfocus':
            e = vscode.window.onDidChangeActiveTextEditor(moveTabWithDebounce);
            break;
        case 'onsave':
            // or onDidSaveTextDocument
            e = vscode.workspace.onWillSaveTextDocument(moveTabWithDebounce);
            break;
        default:
            e = vscode.workspace.onDidChangeTextDocument(moveTabWithDebounce);
    }

    disposables.push(e);
}

// This function ensures that the `smart-tabs.moveTab` command is not triggered
// excessively during rapid text changes in the editor. It utilizes a debounce
// mechanism, which means that if this function is called multiple times within
// a short time frame (defined by the `debounceDelay` value), the command
// will only be executed once after the last invocation and after the specified
// delay has passed.
function moveTabWithDebounce() {
    if (debounceDelay === 0) {
        // If the delay is set to 0, the command is executed immediately.
        vscode.commands.executeCommand('smart-tabs.moveTab');
    } else {
        // If there's already a timer, don't create another one.
        if (isDebouncing) {
            return;
        }

        isDebouncing = true;
        vscode.commands.executeCommand('smart-tabs.moveTab');
        setTimeout(() => { isDebouncing = false; }, debounceDelay);
    }
}

// This function computes and returns the position immediately after the last
// pinned tab in the active tab group. If no tabs are pinned, it returns 0.
//
// Pinned tabs are tabs that the user has explicitly locked in their current
// position, preventing them from being automatically moved or closed.
// By considering pinned tabs, this function ensures that the automated
// movement behavior respects the user's manual tab arrangements.
//
// @param {vscode.TabGroup} activeGroup - the active group of tabs in the
//     current VS Code window.
// @returns {number} - the position immediately after the last pinned tab
//     or 0 if no tabs are pinned.
function getPositionAfterLastPinnedTab(
    activeGroup: vscode.TabGroup,
): number {
    let lastPinnedIndex = -1;
    for (let i = 0; i < activeGroup.tabs.length; i++) {
        const tab = activeGroup.tabs[i];
        if (tab.isPinned) {
            lastPinnedIndex = i;
        } else {
            break;
        }
    }

    return lastPinnedIndex + 1;
}

// This function determines the position of the currently active tab (i.e.,
// the tab in focus) in the tab list. The position can be counted either
// from the left (beginning) or from the right (end) based on the `fromLeft`
// parameter.
//
// - If `fromLeft` is true, it returns the zero-based index of the active
//   tab from the left.
// - If `fromLeft` is false, it returns the zero-based index from the right.
//
// This functionality is useful for deciding which direction to move the
// active tab, based on the user's configuration and preference.
//
// @param {vscode.TabGroup} activeGroup - the active group of tabs in the
//    current VS Code window.
// @param {boolean} fromLeft - flag to determine direction of counting;
//    true for counting from the left, false for the right.
// @returns {number} - zero-based index of the active tab based on the
//    specified direction.
function getActiveTabIndex(
    activeGroup: vscode.TabGroup,
    fromLeft: boolean,
): number {
    const tabsLength = activeGroup.tabs.length;
    for (let i = 0; i < tabsLength; i++) {
        // Trying to find the current tab index.
        const tab = activeGroup.tabs[i];
        if (tab.isActive) {
            if (fromLeft) {
                return i; // move to the left
            } else {
                return tabsLength - (i + 1); // move to the right
            }
        }
    }

    return 0;
}

// Activate the Smart Tabs extension.
// This function is responsible for subscribing to the `smart-tabs.moveTab`
// command and attaching the necessary behavior to handle tab movements when
// a document is modified. The behavior is determined by the extension's
// configuration settings.
//
// During the activation process, the extension:
// 1. Reads the configuration options set by the user in the VS Code settings.
// 2. Binds the tab movement behavior to the `smart-tabs.moveTab` command.
// 3. Listens for changes in any document and triggers the tab movement
//    command when modifications are detected.
export function activate(context: vscode.ExtensionContext) {
    loadConfigurations(); // load configurations
    setupEventListeners(); // event for move tab

    // Update settings.
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('smart-tabs')) {
                loadConfigurations(); // load configurations
                setupEventListeners(); // event for move tab
            }
        })
    );

    // Retrieve configuration settings.
    // The user can customize the behavior of the extension through VSCode
    // settings.If the settings aren't provided, default values are used.
    context.subscriptions.push(
        vscode.commands.registerCommand('smart-tabs.moveTab', () => {
            // Identify the currently active tab group.
            // The extension operates on the active tab group in the
            // VSCode window. If no active group is found, the command
            // execution is halted.
            const activeGroup = vscode.window.tabGroups.all.filter(
                (group) => group.isActive
            )[0];

            if (!activeGroup) {
                return;
            }

            // Verify that the active tab is not pinned.
            // Pinned tabs are excluded from the automated movement behavior.
            const activeTab = activeGroup.activeTab;
            if (activeTab?.isPinned) {
                return;
            }

            // Compute the position right after the last pinned tab.
            // This position is used as a reference point for moving
            // the modified tab.
            const offset = getPositionAfterLastPinnedTab(activeGroup);

            // Determine the position of the active tab.
            const activeTabNum = getActiveTabIndex(activeGroup, activeFirst);

            // Move the modified tab based on the user's preferred direction.
            // If `activeFirst` is set to true, the tab is moved towards the
            // left; otherwise, it is moved to the extreme right.
            if (activeFirst) {
                // If the active tab is within the fixed group (as defined
                // by user settings), it is exempt from the movement logic,
                // and the command execution is aborted.
                if (activeTabNum < fixedTabs + offset) {
                    return;
                }

                vscode.commands.executeCommand('moveActiveEditor', {
                    to: 'position',
                    value: offset + 1,
                });
            } else {
                // If the active tab is within the fixed group (as defined
                // by user settings), it is exempt from the movement logic,
                // and the command execution is aborted.
                if (activeTabNum < fixedTabs) {
                    return;
                }

                vscode.commands.executeCommand('moveActiveEditor', {
                    to: 'last',
                    by: 'tab',
                });
            }
        }), // smart-tabs.moveTab
    );
}

// Deactivate extension.
export function deactivate() {
    // Dispose all subscriptions.
    disposables.forEach(disposable => disposable.dispose());
    disposables = [];

    // Show a message to confirm deactivation.
    vscode.window.showInformationMessage('Successfully deactivated ' +
        'Smart-Tabs extension.');
}