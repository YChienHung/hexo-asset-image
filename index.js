'use strict';
var cheerio = require('cheerio');

// http://stackoverflow.com/questions/14480345/how-to-get-the-nth-occurrence-in-a-string
function getPosition(str, m, i) {
    return str.split(m, i).join(m).length;
}

function typeFiliter(data) {
    var source = data.source;
    var ext = source.substring(source.lastIndexOf('.') + 1).toLowerCase();
    return ['md',].indexOf(ext) > -1;
}

hexo.extend.filter.register('after_post_render', function (data) {
    var config = hexo.config;
    if (config.post_asset_folder && typeFiliter(data)) {

        var link = data.permalink;
        var source = data.source;

        var beginPos = getPosition(link, '/', 3) + 1; // 获取 www.abc.com/aa.html 的 aa.html

        var appendLink = '';
        // In hexo 3.1.1, the permalink of "about" page is like ".../about/index.html".
        // if not with index.html endpos = link.lastIndexOf('.') + 1 support hexo-abbrlink
        if (/.*\/index\.html$/.test(link)) {
            // when permalink is end with index.html, for example 2019/02/20/xxtitle/index.html
            // image in xxtitle/ will go to xxtitle/index/
            appendLink = 'index/';
            var endPos = link.lastIndexOf('/');
        } else {
            var endPos = link.lastIndexOf('.');
        }
        link = link.substring(beginPos, endPos) + '/' + appendLink;

        var toprocess = ['excerpt', 'more', 'content'];
        for (var i = 0; i < toprocess.length; i++) {
            var key = toprocess[i];

            var $ = cheerio.load(data[key], {
                ignoreWhitespace: false,
                xmlMode: false,
                lowerCaseTags: false,
                decodeEntities: false
            });

            $('img').each(function () {
                if ($(this).attr('src')) {
                    // For windows style path, we replace '\' to '/'.
                    var src = $(this).attr('src').replace('\\', '/');
                    if (!(/http[s]*.*|\/\/.*/.test(src)
                        || /^\s+\//.test(src)
                        || /^\s*\/uploads|images\//.test(src))) {
                        // For "about" page, the first part of "src" can't be removed.
                        // In addition, to support multi-level local directory.
                        var linkArray = link.split('/').filter(function (elem) {
                            return elem != '';
                        });
                        var srcArray = src.split('/').filter(function (elem) {
                            return elem != '' && elem != '.';
                        });
                        if (srcArray.length > 1)
                            srcArray.shift();
                        src = srcArray.join('/');

                        $(this).attr('src', config.image_url + link + src);
                        console.info("update link as:-->" + config.image_url + link + src);
                    }
                } else {
                    console.info("no src attr, skipped...");
                    console.info($(this));
                }
            });
            data[key] = $.html();
        }
    }
});
