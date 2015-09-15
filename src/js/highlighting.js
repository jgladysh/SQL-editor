/**
 * Created by julia on 7/20/15.
 */
"use strict";

import 'jquery';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
export function Highlighting(keyWordsArray, className) {
    var hl = this;

//Find occurrences of word in text, and return array of indexes of each matched word inside text
    this.getMatches = function(word, text) {
        var regular = new RegExp("\\b" + word + "\\b((?!\\W(?=\\w))|(?=\\s))", "gi"),
            array,
            result = [];
        while ((array = regular.exec(text)) !== null) {
            result.push(array.index);
        }
        return result;
    };

//Make range from each matched word, return array of created ranges
    function makeRangesFromMatches(arr, node) {
        var ranges = [];

        for (var j = 0; j < arr.length; j++) {
            var word = arr[j],
                matches = hl.getMatches(word, node.nodeValue);
            if (matches.length > 0) {
                var matchArray = [];
                for (var l = 0; l < matches.length; l++) {
                    var rng = document.createRange();
                    rng.setStart(node, matches[l]);
                    rng.setEnd(node, matches[l] + word.length);
                    matchArray[l] = rng;
                }
                ranges = ranges.concat(matchArray);
            }
        }
        return ranges;
    }

//Wrap every range element from ranges array with 'highlighted' span tag
    function wrapNodes(ranges) {
        for (var i = 0; i < ranges.length; i++) {
            var highlightTag = document.createElement('span');
            highlightTag.className = className;
            ranges[i].surroundContents(highlightTag);
        }
    }

    //Recursively check every element in contentEditable node
    this.checkEveryTag = function (node) {
        if (keyWordsArray) {
            if (node.childNodes.length > 0) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i].data && node.childNodes[i].data !== '' || node.childNodes[i].nodeName === 'DIV') {
                        this.checkEveryTag(node.childNodes[i]);
                    }
                }
            }
            else {
                var ranges = makeRangesFromMatches(keyWordsArray, node);
                wrapNodes(ranges);
            }
        }
    };

    //Check every highlighted node for changes
    this.checkHighlighted = function (e, content) {
            var sel = window.getSelection(),
                anchorNode = sel.anchorNode,
                nextNode = anchorNode.nextElementSibling,
                nodeToCheck = sel.baseNode.parentElement;
            //Handle caret positioning just before highlighted node, that prevent sticking of regular text nodes with highlighted
            if (anchorNode.length === sel.anchorOffset && (nextNode && nextNode.nodeName === 'SPAN')) {
                $(nextNode).contents().unwrap();
                content.normalize();
            }
            if (nodeToCheck.className === className || sel.baseNode.className === className) {
                var range = sel.getRangeAt(0),
                    char = getCharacterOffsetWithin(range, content),
                    highlighted = content.getElementsByClassName(className);
                for (var i = 0; i < highlighted.length; i++) {
                    var text = $(highlighted[i]).text();
                    if (!(new RegExp(keyWordsArray.map(function (w) {
                            return '^' + w + '$';
                        }).join('|'), 'gi').test(text))) {
                        $(highlighted[i]).contents().unwrap();
                        content.normalize();
                        if (e.keyCode !== 13) {
                            setCaretCharIndex(content, char);
                        }
                    }
                }
            }
    };
}