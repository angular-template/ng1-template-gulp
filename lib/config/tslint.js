'use strict';

let folders = require('./folders');

module.exports = {
    'default': {
        description: 'Default rules',
        config: `${folders.tools}tslint/default.json`,
        files: [].concat(
            `${folders.modules}**/*.ts`
        ),
        exclude: [
            `${folders.modules}app.ts`,
            `${folders.modules}**/*.module.ts`,
            `${folders.modules}**/__*.ts`
        ]
    }
};
