import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    vscode.window.showInformationMessage(
        'CO-ORD Activity Tracker is active!'
    );

    const updateActivity = () => {

        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const filePath = path.relative(
            context.extensionUri.fsPath,
            editor.document.uri.fsPath
        );

        vscode.window.showInformationMessage(
            `Working on: ${filePath}`
        );

        console.log(`Currently working on: ${filePath}`);
    };

    const editorChange =
        vscode.window.onDidChangeActiveTextEditor(
            updateActivity
        );

    updateActivity();

    context.subscriptions.push(editorChange);
}

export function deactivate() {}