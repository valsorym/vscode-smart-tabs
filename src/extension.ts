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
const FIXED_TABS = 5;

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
const ACTIVE_FIRST: boolean = false;


// getPositionAfterLastPinnedTab(activeGroup: vscode.TabGroup): number
//
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
        }
    }

    return lastPinnedIndex + 1;
}

// getActiveTabNum(activeGroup: vscode.TabGroup, fromLeft: boolean): number
//
// This function determines the position of the currently active tab (i.e.,
// the tab in focus) in the tab list. The position can be counted either
// from the left (beginning) or from the right (end) based on the `fromLeft`
// parameter.
//
// - If `fromLeft` is true, it returns the zero-based index of the active tab
//   from the left.
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
function getActiveTabNum(
    activeGroup: vscode.TabGroup,
    fromLeft: boolean,
): number {
    const activeTab = activeGroup.activeTab;
    for (let i = 0; i < activeGroup.tabs.length; i++) {
        // Trying to find the current tab index.
        const tab = activeGroup.tabs[i];
        if (tab.isActive && activeTab?.label === tab.label) {
            if (fromLeft) {
                return i; // move to the left
            } else {
                return activeGroup.tabs.length - (i + 1); // move to the right
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
    // Retrieve configuration settings.
    // The user can customize the behavior of the extension through VSCode
    // settings.If the settings aren't provided, default values are used.
    context.subscriptions.push(
        vscode.commands.registerCommand('smart-tabs.moveTab', () => {
            // Get configs.
            // Configurations can be left blank, then default
            // values will be used.
            const config = vscode.workspace.getConfiguration('smart-tabs');
            const fixedTabs = config.get('fixedTabs', FIXED_TABS);
            const activeFirst = config.get('activeFirst', ACTIVE_FIRST);

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
            const activeTabNum = getActiveTabNum(activeGroup, activeFirst);

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

    // Move tabs when modifying a document.
    vscode.workspace.onDidChangeTextDocument((e) => {
        vscode.commands.executeCommand('smart-tabs.moveTab');
    });
}

// Deactivate extension.
export function deactivate() {
    vscode.window.showErrorMessage('Successfully deactivated ' +
        'Smart-Tabs extension.');
}