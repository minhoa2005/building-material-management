'use strict';
require('./model.cjs').main().catch(error => { console.error(error); process.exitCode = 1; });
