import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

interface Scripts {
  name: string
  script: string
}

function readPackageJsonScripts(): Array<Scripts> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    return []
  }

  try {
    const packageJsonPath = path.join(
      workspaceFolder.uri.fsPath,
      'package.json',
    )
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonData)
    const scripts = packageJson.scripts || {}

    const result: Scripts[] = Object.entries(scripts).map(([name, script]) => ({
      name,
      script,
    })) as Scripts[]

    return result
  } catch (error) {
    return []
  }
}

export function activate(context: vscode.ExtensionContext) {
  const packageJsonScripts = readPackageJsonScripts()

  if (!packageJsonScripts.length) {
    vscode.window.showErrorMessage('No scripts found in package.json')
  }

  if (!vscode.window.terminals.length) {
    vscode.window.createTerminal()
  }

  let disposable = vscode.commands.registerCommand(
    'scripty.showScripts',
    () => {
      vscode.window
        .showQuickPick(
          packageJsonScripts.map((s) => ({
            label: s.name,
            description: s.script,
          })),
          { placeHolder: 'Select a script to run' },
        )
        .then((name) => {
          if (name) {
            vscode.window.showInformationMessage(`Running ${name.label}`)
            const script = packageJsonScripts.find((s) => s.name === name.label)
            if (script) {
              vscode.window.terminals[0].sendText(script.script)
              vscode.window.terminals[0].show()
            }
          }
        })
    },
  )

  context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
