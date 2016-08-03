'use strict';

module.exports = function(filePath, outDir) {
    let typescript = require('typescript');

    let program = typescript.createProgram([filePath], {
        noEmitOnError: true,
        target: typescript.ScriptTarget.ES5,
        module: typescript.ModuleKind.CommonJS,
        outDir: outDir,
        removeComments: true
    });
    let emitResult = program.emit();

    let allDiagnostics = typescript
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    // allDiagnostics.forEach(diagnostic => {
    //     let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    //     let message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    //     console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    // });
}
