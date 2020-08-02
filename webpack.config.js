const path = require('path');

module.exports = env => {
    return {
        entry: './src/fatex.js',
        mode: 'development',
        watch: env === undefined ? false : env.watch,
        output: {
            filename: 'fatex.js',
            path: path.resolve(__dirname, 'system'),
        }
    }
};