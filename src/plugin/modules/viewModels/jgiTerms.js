define([
    './policyViewerDialog',
    'text!./jgiTerms.md'
], function(
    PolicyViewerDialog,
    jgiTermsText
) {
    'use strict';

    var jgiTermsText = marked(JGITerms);

    // JGITerms
    // A view model just for JGI terms and conditions.
    function JGITerms() {
        // The text of the JGI terms, as found in the accompanying terms markdown file
        var text = jgiTermsText;
        var agreed = ko.observable(false);

        function doAgree() {
            agreed(true);
        }

        function doView() {
            // show viewer here
            PolicyViewerDialog.showDialog({
                agreed: agreed
            });
        }

        return Object.freeze({
            text: text,
            agreed: agreed,
            doAgree: doAgree,
            doView: doView
        });
    }

    return {
        JGITerms: JGITerms
    }
});