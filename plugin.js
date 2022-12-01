const imagemin = require('imagemin');
const avif = require('imagemin-avif');

const GREEN = '\x1b[32m%s\x1b[0m';
const RED = '\x1b[31m%s\x1b[0m';

class ImageminAvifWebpackPlugin {
    constructor({
        config = [
            {
                test: /\.(jpe?g|png)/,
                options: {
                    quality: 75
                }
            }
        ],
        overrideExtension = true,
        detailedLogs = false,
        strict = true,
        silent = false,
        keepOriginalFile = true
    } = {}) {
        this.config = config;
        this.detailedLogs = detailedLogs;
        this.strict = strict;
        this.overrideExtension = overrideExtension;
        this.silent = silent;
        this.keepOriginalFile = keepOriginalFile;
    }

    apply(compiler) {
        const pluginName = this.constructor.name;
        const renameMap = new Map();
        const onEmit = (compilation, cb) => {
            let assetNames = Object.keys(compilation.assets);
            let nrOfImagesFailed = 0;

            if (this.silent && this.detailedLogs) {
                compilation.warnings.push(new Error(`${pluginName}: both the 'silent' and 'detailedLogs' options are true. Overriding 'detailedLogs' and disabling all console output.`));
            }

            Promise.all(
                assetNames.map(name => {
                    for (let i = 0; i < this.config.length; i++) {
                        if (this.config[i].test.test(name)) {
                            let outputName = name;
                            if (this.overrideExtension) {
                                outputName = outputName
                                    .split('.')
                                    .slice(0, -1)
                                    .join('.');
                            }
                            outputName = `${outputName}.avif`;

                            let currentAsset = compilation.assets[name];

                            return imagemin
                                .buffer(currentAsset.source(), {
                                    plugins: [
                                        avif(this.config[i].options),
                                    ]
                                })
                                .then(buffer => {
                                    let savedKB = (currentAsset.size() - buffer.length) / 1000;

                                    if (this.detailedLogs && !this.silent) {
                                        console.log(GREEN, `${savedKB.toFixed(1)} KB saved from '${name}'`);
                                    }
                                    if (this.keepOriginalFile) {
                                        emitAsset(outputName, buffer, compilation);
                                    } else {
                                        renameAsset(name, outputName, buffer, compilation);
                                        renameMap.set(name, outputName);
                                    }
                                    return savedKB;
                                })
                                .catch(err => {
                                    let customErr = new Error(`${pluginName}: "${name}" wasn't converted!`);

                                    nrOfImagesFailed++;

                                    if (this.strict) {
                                        compilation.errors.push(err, customErr);
                                    } else if (this.detailedLogs) {
                                        compilation.warnings.push(err, customErr);
                                    }

                                    return 0;
                                });
                        }
                    }
                    return Promise.resolve(0);
                })
            ).then(savedKBArr => {
                if (!this.silent) {
                    let totalKBSaved = savedKBArr.reduce((acc, cur) => acc + cur, 0);

                    if (totalKBSaved < 100) {
                        console.log(GREEN, `imagemin-avif-webpack-plugin: ${Math.floor(totalKBSaved)} KB saved`);
                    } else {
                        console.log(GREEN, `imagemin-avif-webpack-plugin: ${Math.floor(totalKBSaved / 100) / 10} MB saved`);
                    }

                    if (nrOfImagesFailed > 0) {
                        console.log(RED, `imagemin-avif-webpack-plugin: ${nrOfImagesFailed} images failed to convert to avif`);
                    }
                }
            }).then(() => {
                if (renameMap.size) {
                    const { sources: { RawSource } } = compiler.webpack;
                    const list = assetNames.filter((assetName) => /\.(css|css.map|js|js.map)$/.test(assetName));
                    const renameFiles = [...renameMap.keys()];
                    list.forEach((assetName) => {
                        const { source, info } = compilation.getAsset(assetName);
                        const assetContent = source.source();
                        let assetString = assetContent.toString('utf8');
                        // console.group('replace png to avif on ' + assetName);
                        assetString = assetString.replace(new RegExp(`(${renameFiles.join('|')})`, 'g'), (pngName) => {
                            // console.log('|- pngName', pngName, '--->', renameMap.get(pngName));
                            return renameMap.get(pngName);
                        });
                        compilation.updateAsset(assetName, new RawSource(assetString), info);
                        // console.groupEnd();
                    });
                }
                cb & cb();
            });
        };

        hookPlugin(compiler, onEmit, pluginName);
    }
}

function hookPlugin(compiler, onEmit, pluginName) {
    if (compiler.hooks && compiler.hooks.thisCompilation/*  && compiler.hooks.processAssets */) {
        // webpack 5.x
        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            compilation.hooks.processAssets.tapAsync({
                name: pluginName,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
            }, (assets, cb) => onEmit(compilation, cb));
        });
    }
    else if (compiler.hooks) {
        // webpack 4.x
        compiler.hooks.emit.tapAsync(pluginName, onEmit);
    } else {
        // older versions
        compiler.plugin('emit', onEmit);
    }
}

function emitAsset(name, buffer, compilation) {
    if (compilation.emitAsset) {
        // webpack 5.x
        compilation.emitAsset(name, {
            source: () => buffer,
            size: () => buffer.length
        })
    } else {
        // webpack 4.x & 3.x
        compilation.assets[outputName] = {
            source: () => buffer,
            size: () => buffer.length
        };
    }
}

function renameAsset(originalName, newName, buffer, compilation) {
    if (compilation.renameAsset) {
        // webpack 5.x
        emitAsset(newName, buffer, compilation);
        compilation.deleteAsset(originalName);
        //compilation.renameAsset(originalName, newName);
    } else {
        // webpack 4.x & 3.x
        // todo: I didn't test this block code on webpack4 and webpack3
        delete compilation.assets[originalName];
        compilation.assets[newName] = {
            source: () => buffer,
            size: () => buffer.length
        };
    }
}

module.exports = ImageminAvifWebpackPlugin;