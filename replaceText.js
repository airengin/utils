let fs = require('fs');
let _ = require('lodash');
let path = require('path');
let Promise = require('bluebird');

function recursiveReaddirSync(path) {
    var list = []
        , files = fs.readdirSync(path)
        , stats
        ;

    files.forEach(function(file) {
        stats = fs.lstatSync(p.join(path, file));
        if(stats.isDirectory()) {
            list = list.concat(recursiveReaddirSync(p.join(path, file)));
        } else {
            list.push(p.join(path, file));
        }
    });

    return list;
}
//巡检顺序写到文件中
function writeToFile(file, content) {
    return new Promise((resolve, reject) => {
        fs.exists(file, function (exists) {
            try {
                fs.writeFile(file, content, 'utf8',
                    function (err) {
                        if (err) {
                            reject();
                            throw err;
                        } else {
                            resolve('保存数据成功');
                        }
                    }
                );
            } catch (e) {
                reject('保存数据失败:' + JSON.stringify(e));
            }
        });
    });
}

/**
 *
 * @param file
 * @returns {bluebird}
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.exists(file, function (exists) {
            if (exists) {
                try {
                    fs.readFile(file, 'utf8', function (err, data) {
                        if (err) {
                            reject();
                            throw err;
                        } else {
                            resolve(data);
                        }
                    });
                } catch (e) {
                    reject();
                    console.info('读取' + file + '数据失败');
                }
            } else {
                reject();
                console.info(file + ' 不存在');
            }
        });
    });
}
var charReplace = 0;
function replaceChar(content) {
    if (_.includes(content, ' == ') || _.includes(content, ' != ')) {
        content = content.replace(/ == /g, ' === ');
        content = content.replace(/ != /g, ' !== ');
        charReplace++;
        console.log('charReplace: ' + charReplace);
        writeToFile(fp, content).then(function (error) {
            console.log('replaced file:' + fp);
            console.info(error);
        });
    }
}
var underscoreReplace = 0;
//是否包含字符串
function inclueSomeChars(content) {
    var chars = ['underscore', '_.contains', '_.pluck', '_.indexBy', '_.any', '_.mapObject'];
    return _.some(chars, function (value, key) {
        if (_.includes(content, value)) {
            return true;
        }
    });
}
function replaceUnderscore(fp, content) {
    if (inclueSomeChars(content)) {
        content = content.replace(/underscore/g, 'lodash');
        content = content.replace(/_\.contains/g, '_.includes');
        content = content.replace(/_\.pluck/g, '_.map');
        content = content.replace(/_\.indexBy/g, '_.keyBy');
        content = content.replace(/_\.any/g, '_.some');
        content = content.replace(/_\.mapObject/g, '_.mapValues');
        underscoreReplace++;
        if (_.includes(content, ' == ') || _.includes(content, ' != ')) {
            content = content.replace(/ == /g, ' === ');
            content = content.replace(/ != /g, ' !== ');
        }
        console.log('underscoreReplace :' + underscoreReplace);
        writeToFile(fp, content).then(function (error) {
            console.log('replaced file:' + fp);
            console.info(error);
        });
    }
}


var count = 0;

function start() {
    let methods = [];
    return new Promise((resolve, reject) => {
        var files = recursiveReaddirSync('./conf');
        files.forEach(function (fp) {
            fp = path.join(__dirname, fp);
            if (!/\.js$/.test(fp)) {
                return;
            }
            if (/.*readDirRecursive.*/.test(fp)) {
                return;
            }
            readFile(fp).then(function (content) {
                count++;
                let newMethods = getUsedMethods(content);
                if (newMethods.length > 0) {
                    methods = methods.concat(newMethods);
                    methods = _.uniq(methods);
                }
                if (count === 972) {
                    console.log(methods);
                }
                console.log('count=' + count);
                replaceUnderscore(fp, content);
            });
        });
    });
}
start();
/**
 * 获取使用到的方法
 * @param content
 */
function getUsedMethods(content) {
    debugger;
    let methods = [];
    let lines = content.split('\n');
    let reg = /.*_\.([A-Za-z]+)\(/;
    _.each(lines, function (line, key) {
        let matchs = line.match(reg);
        if (matchs && matchs[1]) {
            methods.push(matchs[1]);
        }
    });
    methods = _.uniq(methods);
    return methods;
}
