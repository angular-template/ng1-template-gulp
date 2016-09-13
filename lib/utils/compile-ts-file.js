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

    if (allDiagnostics && allDiagnostics.length) {
        for (let i = 0; i < allDiagnostics.length; i++) {
            let diag = allDiagnostics[i];
            let position = diag.file.getLineAndCharacterOfPosition(diag.start);
            let message = typescript.flattenDiagnosticMessageText(diag.messageText, '\n');
            console.log(`(${position.line + 1},${position.character + 1}): ${message}`);
        };
        console.log(`${allDiagnostics.length} error(s) found in the gulp.config.ts file`);
        throw new Error();
    }
}
